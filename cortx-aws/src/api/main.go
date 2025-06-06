package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	lambdaService "github.com/aws/aws-sdk-go-v2/service/lambda"
	"os"
)

var (
	secretKey             = getEnvWithDefault("SECRET_KEY", "skibiditoilet123")
	initiatorFunctionName = getEnvWithDefault("INITIATOR_FUNCTION_NAME", "")
)

type InitiatorPayload struct {
	SessionID string `json:"sessionID"`
	Command   string `json:"command"`
}

type Response struct {
	StatusCode int               `json:"statusCode"`
	Body       string            `json:"body"`
	Headers    map[string]string `json:"headers"`
}

type CommandRequest struct {
	Command string `json:"command"`
}

type InitiatorRequest struct {
	SessionID string `json:"sessionID"`
	Command   string `json:"command"`
}

func getEnvWithDefault(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
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

	var commandReq CommandRequest
	err := json.Unmarshal([]byte(request.Body), &commandReq)
	if err != nil {
		return &Response{
			StatusCode: 400,
			Body:       fmt.Sprintf("Invalid request body: %v", err),
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	// Check if initiator function name is set
	if initiatorFunctionName == "" {
		return &Response{
			StatusCode: 500,
			Body:       "Initiator function name not configured",
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	// Create payload for initiator function
	payload := InitiatorPayload{
		SessionID: sessionID,
		Command:   commandReq.Command,
	}

	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return &Response{
			StatusCode: 500,
			Body:       fmt.Sprintf("Failed to marshal payload: %v", err),
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	// Load AWS config
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return &Response{
			StatusCode: 500,
			Body:       fmt.Sprintf("Failed to load AWS config: %v", err),
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	// Create Lambda client
	lambdaClient := lambdaService.NewFromConfig(cfg)

	// Invoke initiator function
	invokeOutput, err := lambdaClient.Invoke(ctx, &lambdaService.InvokeInput{
		FunctionName: aws.String(initiatorFunctionName),
		Payload:      payloadJSON,
	})

	if err != nil {
		return &Response{
			StatusCode: 500,
			Body:       fmt.Sprintf("Failed to invoke initiator function: %v", err),
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	// Parse the response from the initiator function
	var initiatorResponse map[string]interface{}
	err = json.Unmarshal(invokeOutput.Payload, &initiatorResponse)
	if err != nil {
		return &Response{
			StatusCode: 500,
			Body:       fmt.Sprintf("Failed to parse initiator response: %v", err),
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	// Return the response
	responseJSON, err := json.Marshal(initiatorResponse)
	if err != nil {
		return &Response{
			StatusCode: 500,
			Body:       fmt.Sprintf("Failed to marshal response: %v", err),
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	return &Response{
		StatusCode: 202, // Accepted
		Body:       string(responseJSON),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}, nil
}

func main() {
	lambda.Start(handleRequest)
}
