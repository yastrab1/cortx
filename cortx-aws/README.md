# CORTX AWS Lambda

This project provides AWS Lambda functions for managing EC2 instances and executing commands on them.

## Architecture

The project now supports two approaches for executing commands:

1. **Synchronous Approach (Original)**: A single Lambda function that initiates a command and waits for it to complete.
2. **Asynchronous Approach (New)**: Split into two steps:
   - Initiator: Initiates the command and returns immediately
   - Poller: Checks the command status and returns the result when complete

## API Endpoints

### Synchronous Approach

#### Create Instance
- **Path**: `/createInstance`
- **Method**: GET
- **Query Parameters**:
  - `secretKey`: Authentication key
  - `sessionID`: Unique identifier for the session

#### Call Command (Synchronous)
- **Path**: `/callCommand`
- **Method**: POST
- **Query Parameters**:
  - `secretKey`: Authentication key
  - `sessionID`: Unique identifier for the session
- **Request Body**:
  ```json
  {
    "command": "your-command-here"
  }
  ```

### Asynchronous Approach

#### Initiate Command
- **Path**: `/initiateCommand`
- **Method**: POST
- **Query Parameters**:
  - `secretKey`: Authentication key
  - `sessionID`: Unique identifier for the session
- **Request Body**:
  ```json
  {
    "command": "your-command-here"
  }
  ```
- **Response**:
  ```json
  {
    "commandId": "command-id",
    "instanceId": "instance-id",
    "sessionId": "session-id",
    "message": "Command initiated successfully. Use the checkCommand endpoint to get results."
  }
  ```

#### Check Command Status
- **Path**: `/checkCommand`
- **Method**: GET
- **Query Parameters**:
  - `secretKey`: Authentication key
  - `commandID`: ID of the command to check
  - `instanceID`: ID of the instance where the command is running
- **Response**:
  ```json
  {
    "status": "Success",
    "output": "command-output",
    "errorOutput": "error-output-if-any",
    "isComplete": true
  }
  ```

## Usage Example

### Synchronous Approach

```bash
# Create an instance
curl -X GET "https://your-api-endpoint/Prod/createInstance?secretKey=your-secret-key&sessionID=your-session-id"

# Execute a command and wait for the result
curl -X POST "https://your-api-endpoint/Prod/callCommand?secretKey=your-secret-key&sessionID=your-session-id" \
  -H "Content-Type: application/json" \
  -d '{"command": "ls -la"}'
```

### Asynchronous Approach

```bash
# Create an instance
curl -X GET "https://your-api-endpoint/Prod/createInstance?secretKey=your-secret-key&sessionID=your-session-id"

# Initiate a command
curl -X POST "https://your-api-endpoint/Prod/initiateCommand?secretKey=your-secret-key&sessionID=your-session-id" \
  -H "Content-Type: application/json" \
  -d '{"command": "ls -la"}'

# Check the command status
curl -X GET "https://your-api-endpoint/Prod/checkCommand?secretKey=your-secret-key&commandID=command-id&instanceID=instance-id"
```

## Client-Side Polling Example

Here's an example of how to implement client-side polling:

```javascript
async function executeCommand(sessionId, command) {
  // Step 1: Initiate the command
  const initiateResponse = await fetch(`https://your-api-endpoint/Prod/initiateCommand?secretKey=your-secret-key&sessionID=${sessionId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ command }),
  });
  
  const initiateData = await initiateResponse.json();
  const { commandId, instanceId } = initiateData;
  
  // Step 2: Poll for the command status
  let isComplete = false;
  let result;
  
  while (!isComplete) {
    // Wait for 5 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const checkResponse = await fetch(`https://your-api-endpoint/Prod/checkCommand?secretKey=your-secret-key&commandID=${commandId}&instanceID=${instanceId}`);
    result = await checkResponse.json();
    
    isComplete = result.isComplete;
  }
  
  return result;
}
```

## Deployment

Deploy the application using the AWS SAM CLI:

```bash
sam build
sam deploy --guided
```