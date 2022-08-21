import { Action } from '../Action';
export declare class Delay implements Action {
    private _elapsedTime;
    private _delay;
    private _started;
    private _stopped;
    constructor(delay: number);
    update(delta: number): void;
    isComplete(): boolean;
    stop(): void;
    reset(): void;
}
