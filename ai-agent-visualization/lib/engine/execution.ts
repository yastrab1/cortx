import { TaskGeneralEvent, ExecutionState, TaskID } from "../types"
import { AsyncQueue } from "./asyncQueue"

export function executeTask(taskID: TaskID, resultQueue: AsyncQueue, state: ExecutionState) {
    console.log("executing task", taskID);
}