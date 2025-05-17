import {processEvent} from "@/app/hooks/fetchStreamedData";
import {ExecutionState, TaskEvent} from "@/lib/types";

export class AsyncQueue {
    private queue: TaskEvent[] = [];
    private resolver: ((value: TaskEvent[]) => void) | null;

    constructor() {
        this.queue = [];
        this.resolver = null;
    }

    enqueue(value: TaskEvent,state:ExecutionState) {
        console.log(state)
        // processEvent(value, (newState) => state = newState(state)); // Event should always have single responsibility otherwise the snapshot taking will mess up the state setting function
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