import { Action } from '../Action';
export declare class CallMethod implements Action {
    private _method;
    private _hasBeenCalled;
    constructor(method: () => any);
    update(_delta: number): void;
    isComplete(): boolean;
    reset(): void;
    stop(): void;
}
