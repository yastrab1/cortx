import { ExecutionState, TaskEvent, TaskCreatedEvent, TaskStatusChangeEvent, TaskPlanningSubresults, TaskExecutionSubresults } from "@/lib/types";

export function processEvent(event: TaskEvent, setState: (state: (prev: ExecutionState) => ExecutionState) => void) {
    switch (event.eventType) {
        case "task_created":
            processTaskCreatedEvent(event as TaskCreatedEvent, setState);
            break;
        case "task_status_change":
            processTaskStatusChangeEvent(event as TaskStatusChangeEvent, setState);
            break;
        case "task_planning_subresults":
            processTaskPlanningSubresults(event as TaskPlanningSubresults, setState);
            break;
        case "task_execution_subresults":
            processTaskExecutionSubresults(event as TaskExecutionSubresults);
            break;
    }
}

function processTaskCreatedEvent(event: TaskCreatedEvent, setState: (state: (prev: ExecutionState) => ExecutionState) => void) {
    console.log("task_created", event);
    setState(prevState => ({
        ...prevState,
        tasks: {
            ...prevState.tasks,
            [event.taskData.id]: event.taskData,
        }
    }));
}

function processTaskStatusChangeEvent(event: TaskStatusChangeEvent, setState: (state: (prev: ExecutionState) => ExecutionState) => void) {
    console.log("task_status_change_event", event);
    setState(prevState => ({
        ...prevState,
        taskCountByStatus: {
            ...prevState.taskCountByStatus,
            [prevState.tasks[event.taskId].status]: prevState.taskCountByStatus[prevState.tasks[event.taskId].status] - 1,
            [event.status]: prevState.taskCountByStatus[event.status] + 1
        },
        tasks: {
            ...prevState.tasks,
            [event.taskId]: { ...prevState.tasks[event.taskId], status: event.status },
        }
    }));
}

function processTaskPlanningSubresults(event: TaskPlanningSubresults, setState: (state: (prev: ExecutionState) => ExecutionState) => void) {
    console.log("task_planning_subresults: ", event);
    setState(prevState => ({
        ...prevState,
        tasks: {
            ...prevState.tasks,
            [event.taskId]: { ...prevState.tasks[event.taskId], planningSubresults: [...prevState.tasks[event.taskId].planningSubresults, ...event.subresults] },
        }
    }));
}

function processTaskExecutionSubresults(event: TaskExecutionSubresults) {
    console.log("task_execution_subresults: ", event);
}

export async function fetchStreamedData(params: string, state: ExecutionState, setState: (state: (prev: ExecutionState) => ExecutionState) => void) {
    setState(prevState => ({
        ...prevState,
        executionLog: [...prevState.executionLog, "Starting agent process..."]//{ timestamp: new Date().toISOString(), message: "Starting agent process..." }]
    }));

    const response = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        // If you need to send a prompt, include it in the body:
        // body: JSON.stringify({ prompt: "Your user prompt here" }),
    });

    if (!response.ok || !response.body) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();

        if (done) {
            break;
        }

        buffer += decoder.decode(value, { stream: true });

        let events = buffer.split('\n');

        for (const event of events) {
            if (event === "") {
                continue;
            }

            const eventObject = JSON.parse(event) as TaskEvent;
            processEvent(eventObject, setState);
        }

        buffer = "";
    }
}