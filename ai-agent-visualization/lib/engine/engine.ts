import { AsyncQueue } from "./asyncQueue";
import { TaskGeneralEvent, TaskStatusChangeEvent, ExecutionState, TaskData, TaskID, TaskStatus, TaskCreatedEvent } from "@/lib/types"
import { runAgent } from "./agent";
import { processEvent } from "@/app/hooks/fetchStreamedData";
import { resolveModel } from "./resolveModel";

function emptyState(): ExecutionState {
    return {
        tasks: {} as Record<TaskID, TaskData>,
        taskCountByStatus: {} as Record<TaskStatus, number>,
        errors: [] as string[],
        executionLog: [] as string[],
    }
}

function createRootTask(prompt: string, resultQueue: AsyncQueue, state: ExecutionState): TaskData {
    const rootTask: TaskData = {
        id: "root",
        status: "pending",
        name: "Root Task",
        goal: prompt,
        dependencies: [],
        agentDefinition: "root",
        context: [],
        upcomingTasks: [],
        model: resolveModel("o4-mini"),
        planningSubresults: [],
        executionSubresults: [],
        planSubtasks: [],
        taskResult: {
            type: "root",
            content: "",
            childResults: []
        },
        taskCreationTime: Date.now(),
        taskStartTime: 0,
        taskEndPlanningTime: 0,
        taskEndExecutionTime: 0, 
        taskEndTime: 0,
        expanded: true
    }
    const rootTaskCreatedEvent: TaskCreatedEvent = {
        eventType: "task_created",
        timestamp: Date.now().toString(),
        taskId: rootTask.id,
        taskData: rootTask,
        log: `[${Date.now().toString()}] Created root task ${rootTask.id}`
    }
    resultQueue.enqueue(rootTaskCreatedEvent, state);
    return rootTask;
}

function isEndEvent(event: TaskGeneralEvent) {
    if (event.taskId !== "root" || event.eventType !== "task_status_change") {
        return false;
    }
    const statusEvent = event as TaskStatusChangeEvent;
    return statusEvent.status === "completed";
}

export async function* runEngine(prompt: string) {
    let state: ExecutionState = emptyState();
    const resultQueue = new AsyncQueue();
    state.tasks["root"] = createRootTask(prompt, resultQueue, state);
    runAgent("root", resultQueue, state);

    let finishedExecution = false;
    while (!finishedExecution) {
        const results: TaskGeneralEvent[] = await resultQueue.dequeue();
        for (const result of results) {
            finishedExecution ||= isEndEvent(result);
            yield result;
        }
    }
}