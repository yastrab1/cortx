import { processEvent } from "@/app/hooks/fetchStreamedData";
import { ExecutionState, TaskEvent } from "@/lib/types";

export class AsyncQueue {
    private queue: TaskEvent[] = [];
    private resolver: ((value: TaskEvent[]) => void) | null;

    constructor() {
        this.queue = [];
        this.resolver = null;
    }

    enqueue(value: TaskEvent, state: ExecutionState) {
        // TODO: This is a hack to get the state to update correctly. Remove this from this file and move it to new file for event processing
        processEvent(value, (newState) => Object.assign(state, newState(state))); // Event should always have single responsibility otherwise the snapshot taking will mess up the state setting function
        if (this.resolver) {
            this.resolver([value]);
            this.resolver = null;
        } else {
            this.queue.push(value);
        }

    }

    async dequeue(): Promise<TaskEvent[]> {
        if (this.queue.length > 0) {
            const data = this.queue;
            this.queue = [];
            return data;
        }

        return new Promise<TaskEvent[]>((resolve) => {
            this.resolver = resolve;
        });
    }
}