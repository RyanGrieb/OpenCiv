/**
 * Future is a wrapper around a native browser Promise to allow resolving/rejecting at any time
 */
export declare class Future<T> {
    private _resolver;
    private _rejecter;
    private _isCompleted;
    constructor();
    readonly promise: Promise<T>;
    get isCompleted(): boolean;
    resolve(value: T): void;
    reject(error: Error): void;
}
