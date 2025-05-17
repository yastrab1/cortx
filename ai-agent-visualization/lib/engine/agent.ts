import { TaskTreeLoading } from "@/components/task-rendering/task-tree/task-tree-loading";
import { TaskGeneralEvent, ExecutionState, TaskID } from "../types"
import { AsyncQueue } from "./asyncQueue"
import { generatePlan } from "./planner"
import { executeTask } from "./execution";

export function findIndependentSubTasks(taskID: TaskID, state: ExecutionState) {
    const result: TaskID[] = []
    
    for (const subtaskID of state.tasks[taskID].planSubtasks) {
        if (state.tasks[subtaskID].dependencies.every(task => state.tasks[task].status === "completed")) {
            result.push(subtaskID);
        }
    }

    return result;
}

export async function runAgent(id: TaskID, resultQueue: AsyncQueue, state: ExecutionState) {
    const benefitFromSplitting = await generatePlan(id, resultQueue, state);
    if (!benefitFromSplitting) {
        executeTask(id, resultQueue, state);
        return;
    }

    const independentTasks = findIndependentSubTasks(id, state);
    for (const task of independentTasks) {
        runAgent(task, resultQueue, state);
    }
}