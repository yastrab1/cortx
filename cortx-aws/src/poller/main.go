package main

import (
	"context"
	"fmt"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ssm"
	"log"
)

type PollerEvent struct {
	CommandID  string `json:"commandId"`
	InstanceID string `json:"instanceId"`
	SessionID  string `json:"sessionId"`
}

type PollerResponse struct {
	CommandID     string `json:"commandId"`
	InstanceID    string `json:"instanceId"`
	SessionID     string `json:"sessionId"`
	Status        string `json:"status"`
	Output        string `json:"output,omitempty"`
	ErrorOutput   string `json:"errorOutput,omitempty"`
	IsComplete    bool   `json:"isComplete"`
}

func handleRequest(ctx context.Context, event PollerEvent) (PollerResponse, error) {
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		log.Printf("unable to load SDK config: %v", err)
		return PollerResponse{
			CommandID:  event.CommandID,
			InstanceID: event.InstanceID,
			SessionID:  event.SessionID,
			Status:     "Error",
			Output:     fmt.Sprintf("Failed to load AWS config: %v", err),
			IsComplete: true,
		}, nil
	}

	ssmClient := ssm.NewFromConfig(cfg)

	getInvocationOutput, err := ssmClient.GetCommandInvocation(ctx, &ssm.GetCommandInvocationInput{
		CommandId:  aws.String(event.CommandID),
		InstanceId: aws.String(event.InstanceID),
	})
	if err != nil {
		log.Printf("failed to get command invocation: %v", err)
		return PollerResponse{
			CommandID:  event.CommandID,
			InstanceID: event.InstanceID,
			SessionID:  event.SessionID,
			Status:     "Error",
			Output:     fmt.Sprintf("Failed to get command invocation: %v", err),
			IsComplete: true,
		}, nil
	}

	status := getInvocationOutput.Status
	fmt.Printf("Current command status: %s\n", status)

	var output, errorOutput string
	var isComplete bool

	if getInvocationOutput.StandardOutputContent != nil {
		output = *getInvocationOutput.StandardOutputContent
	}

	if getInvocationOutput.StandardErrorContent != nil {
		errorOutput = *getInvocationOutput.StandardErrorContent
	}

	switch status {
	case "Success":
		fmt.Println("Command executed successfully!")
		isComplete = true
	case "Failed", "Cancelled", "TimedOut":
		fmt.Printf("Command failed with status: %s\n", status)
		isComplete = true
	case "Pending", "InProgress", "Delayed":
		// Command is still running or waiting
		isComplete = false
	default:
		log.Printf("unexpected command status: %s", status)
		isComplete = true
	}

	return PollerResponse{
		CommandID:   event.CommandID,
		InstanceID:  event.InstanceID,
		SessionID:   event.SessionID,
		Status:      string(status),
		Output:      output,
		ErrorOutput: errorOutput,
		IsComplete:  isComplete,
	}, nil
}

func main() {
	lambda.Start(handleRequest)
}
