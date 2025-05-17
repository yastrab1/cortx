import { AsyncQueue } from "./asyncQueue";
import { TaskGeneralEvent, TaskStatusChangeEvent, ExecutionState, TaskData, TaskID, TaskStatus } from "@/lib/types"
import { plan } from "./planner";

function emptyState(): ExecutionState {
    return {
        tasks: {} as Record<TaskID, TaskData>,
        taskCountByStatus: {} as Record<TaskStatus, number>,
        errors: [] as string[],
        executionLog: [] as string[],
    }
}

function isEndEvent(event: TaskGeneralEvent) {
    if (event.taskId !== "root" || event.eventType !== "TaskSatusChange") {
        return false;
    }
    const statusEvent = event as TaskStatusChangeEvent;
    return statusEvent.status === "completed";
}

export async function* runEngine(prompt: string) {
    const state: ExecutionState = emptyState();
    const resultQueue = new AsyncQueue<TaskGeneralEvent>();
    plan(prompt, resultQueue, state);

    let finishedExecution = false;
    while (!finishedExecution) {
        const results: TaskGeneralEvent[] = await resultQueue.dequeue();
        for (const result of results) {
            finishedExecution ||= isEndEvent(result);
            yield result;
        }
    }
}