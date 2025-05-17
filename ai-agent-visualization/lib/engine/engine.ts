import { AsyncQueue } from "./asyncQueue";
import { TaskGeneralEvent, TaskStatusChangeEvent, ExecutionState, TaskData } from "@/lib/types"

function isEndEvent(event: TaskGeneralEvent) {
    if (event.taskId !== "root" || event.eventType !== "TaskSatusChange") {
        return false;
    }
    const statusEvent = event as TaskStatusChangeEvent;
    return statusEvent.status === "completed";
}

async function executeEngine(prompt: string, resultQueue: AsyncQueue<TaskGeneralEvent>) {
     const state: ExecutionState = emptyState();
}

export async function* runEngine(prompt: string) {
    const plan = generatePlan(prompt);
    const state: ExecutionState = emptyState();
    const independentTasks: TaskData[] = findIndependentTasks(plan);
    const resultQueue = new AsyncQueue<TaskGeneralEvent>();

    for (const task of independentTasks) {
        executeTask(task, state, resultQueue);
    }

    let finishedExecution = false;
    while (!finishedExecution) {
        const results: TaskGeneralEvent[] = await resultQueue.dequeue();
        for (const result of results) {
            finishedExecution ||= isEndEvent(result);
            yield result;
        }
    }
}