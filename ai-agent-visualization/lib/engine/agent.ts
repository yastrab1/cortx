import { TaskGeneralEvent, ExecutionState, TaskID } from "../types"
import { AsyncQueue } from "./asyncQueue"
import { generatePlan } from "./planner"

function findIndependentTasks(id: TaskID): TaskID[] {
    return [];
}

export function runAgent(id: TaskID, resultQueue: AsyncQueue<TaskGeneralEvent>, state: ExecutionState) {
    generatePlan(id, resultQueue, state);
    const independentTasks = findIndependentTasks(id);
    for (const task of independentTasks) {
        // executeTask(task, state, resultQueue);
    }
}