import { TaskGeneralEvent, ExecutionState, TaskID } from "../types"
import { AsyncQueue } from "./asyncQueue"
import { generatePlan } from "./planner"


export function findIndependentSubTasks(taskID:TaskID, state:ExecutionState) {
    const result:TaskID[] = []
    console.log("currnet state:"+JSON.stringify(state))
    for (const subtaskID of state.tasks[taskID].planSubtasks) {
        console.log("checking subtask"+subtaskID);
        if (state.tasks[subtaskID].dependencies.every(task=>state.tasks[task].status === "completed")) {
            console.log("found independent task"+subtaskID);
            result.push(subtaskID);
        }
    }

    return result;
}

export async function runAgent(id: TaskID, resultQueue: AsyncQueue, state: ExecutionState) {
    await generatePlan(id, resultQueue, state);
    await new Promise(resolve=>setTimeout(resolve, 10000))
    console.log("running agent");
    const independentTasks = findIndependentSubTasks(id,state);
    for (const task of independentTasks) {
        console.log("independent task"+task);
        // executeTask(task, state, resultQueue);
    }
}