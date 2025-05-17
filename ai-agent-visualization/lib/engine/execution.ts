import { TaskGeneralEvent, ExecutionState, TaskID } from "../types"
import { AsyncQueue } from "./asyncQueue"

export function executeTask(taskID: TaskID, resultQueue: AsyncQueue<TaskGeneralEvent>, state: ExecutionState) {

}