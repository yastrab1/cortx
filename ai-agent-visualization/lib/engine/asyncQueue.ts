export class AsyncQueue<T> {
    private queue: T[] = [];
    private resolver: ((value: T[]) => void) | null;

    constructor() {
        this.queue = [];
        this.resolver = null;
    }

    enqueue(value: T) {
        if (this.resolver) {
            this.resolver([value]);
            this.resolver = null;
        } else {
            this.queue.push(value);
        }
    }
 
    async dequeue(): Promise<T[]> {
        if (this.queue.length > 0) {
            const data = this.queue;
            this.queue = [];
            return data;
        }

        return new Promise<T[]>((resolve) => {
            this.resolver = resolve;
        });
    }
}