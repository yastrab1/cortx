import { ExecutionState, TaskEvent, TaskCreatedEvent, TaskStatusChangeEvent, TaskPlanningSubresults, TaskExecutionSubresults, TaskPlanningResults } from "@/lib/types";

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
        case "task_planning_results":
            processTaskPlanningResults(event as TaskPlanningResults, setState);
            break;
    }
}

function processTaskCreatedEvent(event: TaskCreatedEvent, setState: (state: (prev: ExecutionState) => ExecutionState) => void) {
    console.log("task_created", event);
    setState(prevState => ({
        ...prevState,
        tasks: {
            ...prevState?.tasks,
            [event.taskData.id]: event.taskData,
        },
        executionLog: [...prevState?.executionLog, event.log]
    }));
}

function processTaskStatusChangeEvent(event: TaskStatusChangeEvent, setState: (state: (prev: ExecutionState) => ExecutionState) => void) {
    console.log("task_status_change_event", event);
    setState(prevState => ({
        ...prevState,
        taskCountByStatus: {
            ...prevState?.taskCountByStatus,
            [prevState?.tasks[event.taskId].status]: prevState?.taskCountByStatus[prevState?.tasks[event.taskId].status] - 1,
            [event.status]: prevState?.taskCountByStatus[event.status] + 1
        },
        tasks: {
            ...prevState?.tasks,
            [event.taskId]: { ...prevState?.tasks[event.taskId], status: event.status },
        },
        executionLog: [...prevState?.executionLog, event.log]
    }));
}

function processTaskPlanningSubresults(event: TaskPlanningSubresults, setState: (state: (prev: ExecutionState) => ExecutionState) => void) {
    console.log("task_planning_subresults: ", event);
    setState(prevState => ({
        ...prevState,
        tasks: {
            ...prevState?.tasks,
            [event.taskId]: { ...prevState?.tasks[event.taskId], planningSubresults: [...prevState?.tasks[event.taskId].planningSubresults, ...event.subresults] },
        },
        executionLog: [...prevState?.executionLog, event.log]
    }));
}

function processTaskExecutionSubresults(event: TaskExecutionSubresults) {
    console.log("task_execution_subresults: ", event);
}

function processTaskPlanningResults(event: TaskPlanningResults, setState: (state: (prev: ExecutionState) => ExecutionState) => void) {
    console.log("task_planning_results: ", event);
    setState(prevState => ({
        ...prevState,
        tasks: {
            ...prevState?.tasks,
            [event.taskId]: { ...prevState?.tasks[event.taskId], planSubtasks: event.result },
        },
        executionLog: [...prevState?.executionLog, event.log]
    }));
}

export async function fetchStreamedData(prompt: string, setState: (state: (prev: ExecutionState) => ExecutionState) => void) {
    setState(prevState => ({
        ...prevState,
        executionLog: [...prevState?.executionLog, "Starting agent process..."]//{ timestamp: new Date().toISOString(), message: "Starting agent process..." }]
    }));

    const response = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt }),
    });

    if (!response.ok || !response.body) {
        console.error("HTTP error! status: ", response.status);
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

            console.log("event", event);
            const eventObject = JSON.parse(event) as TaskEvent;
            processEvent(eventObject, setState);
        }

        buffer = "";
    }
}