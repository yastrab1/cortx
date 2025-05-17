import { TaskGeneralEvent, ExecutionState, TaskID } from "../types"
import { AsyncQueue } from "./asyncQueue"
import { generatePlan } from "./planner"


export function findIndependentSubTasks(taskID: TaskID, state: ExecutionState) {
    const result: TaskID[] = []

    for (const subtaskID of state.tasks[taskID].planSubtasks) {
        if (state.tasks[subtaskID].dependencies.every(task => state.tasks[task].status === "completed")) {
            result.push(subtaskID);
        }
    }

    return result;
}

export async function runAgent(id: TaskID, resultQueue: AsyncQueue<TaskGeneralEvent>, state: ExecutionState) {
    await generatePlan(id, resultQueue, state);
    const independentTasks = findIndependentSubTasks(id, state);
    for (const task of independentTasks) {
        // executeTask(task, state, resultQueue);
    }
}