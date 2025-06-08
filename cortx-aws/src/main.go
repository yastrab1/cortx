package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/ssm"

	"log"
	"os"
	"strconv"
	"strings"
	"time"
)

import (
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
)

var (
	tableName        = getEnvWithDefault("TABLE_NAME", "TerminalSessions")
	amiID            = getEnvWithDefault("AMI_ID", "ami-0548d28d4f7ec72c5")
	iamRoleName      = getEnvWithDefault("IAM_ROLE_NAME", "EC2-SSM-Role")
	instanceType     = getEnvWithDefault("INSTANCE_TYPE", "t3.micro")
	keyPairName      = getEnvWithDefault("KEY_PAIR_NAME", "cortx")
	securityGroupIDs = strings.Split(getEnvWithDefault("SECURITY_GROUP_IDS", "sg-044fcf4f764c282d6"), ",")
	instanceTagKey   = getEnvWithDefault("INSTANCE_TAG_KEY", "Purpose")
	instanceTagValue = getEnvWithDefault("INSTANCE_TAG_VALUE", "LambdaLaunched")
	secretKey        = getEnvWithDefault("SECRET_KEY", "skibiditoilet123")
)

type Response struct {
	StatusCode int    `json:"statusCode"`
	Body       string `json:"body"`
}

func getEnvWithDefault(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

func createInstance(ctx context.Context, cfg aws.Config, dynamoClient *dynamodb.Client, sessionID string, reqID string) (*Response, error) {

	// Check if session already exists
	_, err := dynamoClient.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: &tableName,
		Key: map[string]types.AttributeValue{
			"sessionID": &types.AttributeValueMemberS{Value: sessionID},
		},
	})
	if err == nil {
		return &Response{
			StatusCode: 400,
			Body:       "Session already exists",
		}, nil
	}

	// Initialize EC2 client
	ec2Client := ec2.NewFromConfig(cfg)

	// Create EC2 instance
	input := &ec2.RunInstancesInput{
		ImageId:          &amiID,
		InstanceType:     ec2types.InstanceType(instanceType),
		MinCount:         aws.Int32(1),
		MaxCount:         aws.Int32(1),
		KeyName:          &keyPairName,
		SecurityGroupIds: securityGroupIDs,
		//InstanceMarketOptions: &ec2types.InstanceMarketOptionsRequest{
		//	MarketType: ec2types.MarketTypeSpot,
		//}, //TODO when in prod uncomment this - spot is free tier ineligible
		IamInstanceProfile: &ec2types.IamInstanceProfileSpecification{
			Name: aws.String(iamRoleName),
		},
		TagSpecifications: []ec2types.TagSpecification{
			{
				ResourceType: ec2types.ResourceTypeInstance,
				Tags: []ec2types.Tag{
					{
						Key:   aws.String("Name"),
						Value: aws.String(fmt.Sprintf("Lambda-Launched-Instance-%s", reqID)),
					},
					{
						Key:   aws.String(instanceTagKey),
						Value: aws.String(instanceTagValue),
					},
					{
						Key:   aws.String("LaunchedBy"),
						Value: aws.String("Lambda"),
					},
				},
			},
		},
	}

	result, err := ec2Client.RunInstances(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to launch instance: %v", err)
	}

	instanceID := *result.Instances[0].InstanceId

	// Store session information in DynamoDB
	_, err = dynamoClient.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: &tableName,
		Item: map[string]types.AttributeValue{
			"sessionID":  &types.AttributeValueMemberS{Value: sessionID},
			"instanceID": &types.AttributeValueMemberS{Value: instanceID},
			"timestamp": &types.AttributeValueMemberN{
				Value: strconv.FormatInt(time.Now().Unix(), 10),
			},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to store session info: %v", err)
	}

	return &Response{
		StatusCode: 200,
		Body:       fmt.Sprintf("{\"instanceID\":\"%s\"}", instanceID),
	}, nil
}

func handleRequest(ctx context.Context, request events.APIGatewayV2HTTPRequest) (*Response, error) {
	// Verify secret key
	if request.QueryStringParameters["secretKey"] != secretKey {
		return &Response{
			StatusCode: 401,
			Body:       "Unauthorized request",
		}, nil
	}

	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("unable to load SDK config: %v", err)
	}

	path := request.RawPath
	stage := request.RequestContext.Stage

	dynamoClient := dynamodb.NewFromConfig(cfg)

	if path == fmt.Sprintf("/%s/createInstance", stage) {
		return createInstance(ctx, cfg, dynamoClient, request.QueryStringParameters["sessionID"], request.RequestContext.RequestID)
	} else if path == fmt.Sprintf("/%s/callCommand", stage) {
		// Original synchronous implementation
		return callCommand(ctx, cfg, dynamoClient, request.QueryStringParameters["sessionID"], request.Body)
	} else if path == fmt.Sprintf("/%s/initiateCommand", stage) {
		// New asynchronous implementation - step 1: initiate command
		return initiateCommand(ctx, cfg, dynamoClient, request.QueryStringParameters["sessionID"], request.Body)
	} else if path == fmt.Sprintf("/%s/checkCommand", stage) {
		// New asynchronous implementation - step 2: check command status
		commandID := request.QueryStringParameters["commandID"]
		instanceID := request.QueryStringParameters["instanceID"]

		if commandID == "" || instanceID == "" {
			return &Response{
				StatusCode: 400,
				Body:       "Missing commandID or instanceID parameter",
			}, nil
		}

		return checkCommand(ctx, cfg, commandID, instanceID)
	}

	return &Response{
		StatusCode: 404,
		Body:       "Path not found: " + path + " with stage: " + stage,
	}, nil
}

type callCommandBody struct {
	Command string `json:"command"`
}

type dbRecord struct {
	InstanceID string `json:"instanceID"`
	SessionID  string `json:"sessionID"`
	Timestamp  int64  `json:"timestamp"`
}

// initiateCommand starts a command but doesn't wait for it to complete
func initiateCommand(ctx context.Context, cfg aws.Config, dynamoClient *dynamodb.Client, sessionID string, body string) (*Response, error) {
	ssmClient := ssm.NewFromConfig(cfg)
	var reqBody callCommandBody
	err := json.Unmarshal([]byte(body), &reqBody)
	if err != nil {
		return nil, err
	}

	instanceQuery, err := dynamoClient.Query(ctx, &dynamodb.QueryInput{
		TableName:              aws.String(tableName),
		KeyConditionExpression: aws.String("sessionID = :s"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":s": &types.AttributeValueMemberS{Value: sessionID},
		},
	})

	if err != nil {
		return nil, err
	}

	var sessionRecord dbRecord
	err = attributevalue.UnmarshalMap(instanceQuery.Items[0], &sessionRecord)
	if err != nil {
		return nil, err
	}

	instanceID := sessionRecord.InstanceID
	fmt.Printf("instanceID:" + instanceID + "\n")

	sendCommandOutput, err := ssmClient.SendCommand(context.TODO(), &ssm.SendCommandInput{
		DocumentName: aws.String("AWS-RunShellScript"),
		InstanceIds:  []string{instanceID},
		Parameters: map[string][]string{
			"commands": {reqBody.Command},
		},
		Comment: aws.String("Command initiated by Lambda"),
	})
	if err != nil {
		log.Printf("failed to send command: %v", err)
		return &Response{StatusCode: 500, Body: fmt.Sprintf("Failed to send command: %v", err)}, nil
	}

	commandID := *sendCommandOutput.Command.CommandId
	fmt.Printf("Command sent. Command ID: %s\n", commandID)

	// Return the command ID and instance ID
	responseData := map[string]string{
		"commandId":  commandID,
		"instanceId": instanceID,
		"sessionId":  sessionID,
		"message":    "Command initiated successfully. Use the checkCommand endpoint to get results.",
	}

	responseJSON, err := json.Marshal(responseData)
	if err != nil {
		return nil, err
	}

	return &Response{StatusCode: 202, Body: string(responseJSON)}, nil
}

// checkCommand checks the status of a command
func checkCommand(ctx context.Context, cfg aws.Config, commandID string, instanceID string) (*Response, error) {
	ssmClient := ssm.NewFromConfig(cfg)

	getInvocationOutput, err := ssmClient.GetCommandInvocation(ctx, &ssm.GetCommandInvocationInput{
		CommandId:  aws.String(commandID),
		InstanceId: aws.String(instanceID),
	})
	if err != nil {
		log.Printf("failed to get command invocation: %v", err)
		return &Response{StatusCode: 500, Body: fmt.Sprintf("Failed to get command invocation: %v", err)}, nil
	}

	status := getInvocationOutput.Status
	fmt.Printf("Current command status: %s\n", status)

	var output, errorOutput string
	if getInvocationOutput.StandardOutputContent != nil {
		output = *getInvocationOutput.StandardOutputContent
	}
	if getInvocationOutput.StandardErrorContent != nil {
		errorOutput = *getInvocationOutput.StandardErrorContent
	}

	responseData := map[string]interface{}{
		"status":      status,
		"output":      output,
		"errorOutput": errorOutput,
	}

	switch status {
	case "Success":
		fmt.Println("\nCommand executed successfully!")
		responseData["isComplete"] = true
		responseJSON, err := json.Marshal(responseData)
		if err != nil {
			return nil, err
		}
		return &Response{StatusCode: 200, Body: string(responseJSON)}, nil
	case "Failed", "Cancelled", "TimedOut":
		fmt.Printf("\nCommand failed with status: %s\n", status)
		responseData["isComplete"] = true
		responseJSON, err := json.Marshal(responseData)
		if err != nil {
			return nil, err
		}
		return &Response{StatusCode: 200, Body: string(responseJSON)}, nil
	case "Pending", "InProgress", "Delayed":
		// Command is still running or waiting
		responseData["isComplete"] = false
		responseJSON, err := json.Marshal(responseData)
		if err != nil {
			return nil, err
		}
		return &Response{StatusCode: 200, Body: string(responseJSON)}, nil
	default:
		log.Printf("unexpected command status: %s", status)
		responseData["isComplete"] = true
		responseData["error"] = fmt.Sprintf("Unexpected command status: %s", status)
		responseJSON, err := json.Marshal(responseData)
		if err != nil {
			return nil, err
		}
		return &Response{StatusCode: 200, Body: string(responseJSON)}, nil
	}
}

// callCommand is the original implementation that initiates a command and waits for it to complete
func callCommand(ctx context.Context, cfg aws.Config, dynamoClient *dynamodb.Client, sessionID string, body string) (*Response, error) {
	ssmClient := ssm.NewFromConfig(cfg)
	var reqBody callCommandBody
	err := json.Unmarshal([]byte(body), &reqBody)
	if err != nil {
		return nil, err
	}

	instanceQuery, err := dynamoClient.Query(ctx, &dynamodb.QueryInput{
		TableName:              aws.String(tableName),
		KeyConditionExpression: aws.String("sessionID = :s"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":s": &types.AttributeValueMemberS{Value: sessionID},
		},
	})

	if err != nil {
		return nil, err
	}

	var sessionRecord dbRecord
	err = attributevalue.UnmarshalMap(instanceQuery.Items[0], &sessionRecord)
	if err != nil {
		return nil, err
	}

	instanceID := sessionRecord.InstanceID
	fmt.Printf("instanceID:" + instanceID + "\n")

	sendCommandOutput, err := ssmClient.SendCommand(context.TODO(), &ssm.SendCommandInput{
		DocumentName: aws.String("AWS-RunShellScript"),
		InstanceIds:  []string{instanceID},
		Parameters: map[string][]string{
			"commands": {reqBody.Command},
		},
		Comment: aws.String("My Go SDK SSM Command Example"),
	})
	if err != nil {
		log.Fatalf("failed to send command: %v", err)
	}
	commandID := *sendCommandOutput.Command.CommandId
	fmt.Printf("Command sent. Command ID: %s\n", commandID)

	// --- 2. Poll for Command Status and Output ---
	fmt.Println("Polling for command status and output...")
	for {
		time.Sleep(5 * time.Second) // Wait for 5 seconds before checking again

		getInvocationOutput, err := ssmClient.GetCommandInvocation(ctx, &ssm.GetCommandInvocationInput{
			CommandId:  aws.String(commandID),
			InstanceId: aws.String(instanceID),
		})
		if err != nil {
			log.Fatalf("failed to get command invocation: %v", err)
		}

		status := getInvocationOutput.Status
		fmt.Printf("Current command status: %s\n", status)

		switch status {
		case "Success":
			fmt.Println("\nCommand executed successfully!")
			fmt.Printf("Output: \n%s\n", *getInvocationOutput.StandardOutputContent)
			if getInvocationOutput.StandardErrorContent != nil && *getInvocationOutput.StandardErrorContent != "" {
				fmt.Printf("Error Output: \n%s\n", *getInvocationOutput.StandardErrorContent)
			}
			return &Response{StatusCode: 200, Body: *getInvocationOutput.StandardOutputContent}, nil
		case "Failed", "Cancelled", "TimedOut":
			fmt.Printf("\nCommand failed with status: %s\n", status)
			fmt.Printf("Output: \n%s\n", *getInvocationOutput.StandardOutputContent)
			if getInvocationOutput.StandardErrorContent != nil && *getInvocationOutput.StandardErrorContent != "" {
				fmt.Printf("Error Output: \n%s\n", *getInvocationOutput.StandardErrorContent)
			}
			log.Fatalf("command did not succeed.")
		case "Pending", "InProgress", "Delayed":
			// Command is still running or waiting
			continue
		default:
			log.Fatalf("unexpected command status: %s", status)
		}
	}
}

func main() {
	lambda.Start(handleRequest)
}
