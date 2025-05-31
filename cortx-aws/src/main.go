package main

import (
	"context"
	"fmt"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
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

func createInstance(ctx context.Context, sessionID string, reqID string) (*Response, error) {
	// Initialize AWS configs
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("unable to load SDK config: %v", err)
	}

	// Initialize DynamoDB client
	dynamoClient := dynamodb.NewFromConfig(cfg)

	// Check if session already exists
	_, err = dynamoClient.GetItem(ctx, &dynamodb.GetItemInput{
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
		InstanceMarketOptions: &ec2types.InstanceMarketOptionsRequest{
			MarketType: ec2types.MarketTypeSpot,
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
		Body:       fmt.Sprintf("Successful launch of the instance %s for session %s Hello from version 2!!", instanceID, sessionID),
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

	path := request.RawPath
	stage := request.RequestContext.Stage

	if path == fmt.Sprintf("/%s/routeHandler/createInstance", stage) {
		return createInstance(ctx, request.QueryStringParameters["sessionID"], request.RequestContext.RequestID)
	} else if path == fmt.Sprintf("/%s/routeHandler/callCommand", stage) {
		return &Response{
			StatusCode: 200,
			Body:       "WIP",
		}, nil
	}

	return &Response{
		StatusCode: 404,
		Body:       "Path not found: " + path + " with stage: " + stage,
	}, nil
}

func main() {
	lambda.Start(handleRequest)
}
