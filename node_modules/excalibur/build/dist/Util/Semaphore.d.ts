/**
 * Semaphore allows you to limit the amount of async calls happening between `enter()` and `exit()`
 *
 * This can be useful when limiting the number of http calls, browser api calls, etc either for performance or to work
 * around browser limitations like max Image.decode() calls in chromium being 256.
 */
export declare class Semaphore {
    private _count;
    private _waitQueue;
    constructor(_count: number);
    get count(): number;
    get waiting(): number;
    enter(): Promise<unknown>;
    exit(count?: number): void;
}
