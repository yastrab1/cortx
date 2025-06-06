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
	"github.com/aws/aws-sdk-go-v2/service/ssm"
	"log"
	"os"
)

var (
	tableName        = getEnvWithDefault("TABLE_NAME", "TerminalSessions")
	secretKey        = getEnvWithDefault("SECRET_KEY", "skibiditoilet123")
)

type Response struct {
	StatusCode int               `json:"statusCode"`
	Body       string            `json:"body"`
	Headers    map[string]string `json:"headers"`
}

type InitiatorResponse struct {
	CommandID  string `json:"commandId"`
	InstanceID string `json:"instanceId"`
	SessionID  string `json:"sessionId"`
}

func getEnvWithDefault(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

type callCommandBody struct {
	Command string `json:"command"`
}

type dbRecord struct {
	InstanceID string `json:"instanceID"`
	SessionID  string `json:"sessionID"`
	Timestamp  int64  `json:"timestamp"`
}

func initiateCommand(ctx context.Context, sessionID string, body string) (*Response, error) {
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("unable to load SDK config: %v", err)
	}

	ssmClient := ssm.NewFromConfig(cfg)
	dynamoClient := dynamodb.NewFromConfig(cfg)

	var reqBody callCommandBody
	err = json.Unmarshal([]byte(body), &reqBody)
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
		return &Response{
			StatusCode: 500,
			Body:       fmt.Sprintf("Failed to send command: %v", err),
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	commandID := *sendCommandOutput.Command.CommandId
	fmt.Printf("Command sent. Command ID: %s\n", commandID)

	// Create response with command ID and instance ID
	responseData := InitiatorResponse{
		CommandID:  commandID,
		InstanceID: instanceID,
		SessionID:  sessionID,
	}

	responseJSON, err := json.Marshal(responseData)
	if err != nil {
		return nil, err
	}

	return &Response{
		StatusCode: 200,
		Body:       string(responseJSON),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}, nil
}

func handleRequest(ctx context.Context, request events.APIGatewayV2HTTPRequest) (*Response, error) {
	// Verify secret key
	if request.QueryStringParameters["secretKey"] != secretKey {
		return &Response{
			StatusCode: 401,
			Body:       "Unauthorized request",
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	sessionID := request.QueryStringParameters["sessionID"]
	if sessionID == "" {
		return &Response{
			StatusCode: 400,
			Body:       "Missing sessionID parameter",
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	return initiateCommand(ctx, sessionID, request.Body)
}

func main() {
	lambda.Start(handleRequest)
}
