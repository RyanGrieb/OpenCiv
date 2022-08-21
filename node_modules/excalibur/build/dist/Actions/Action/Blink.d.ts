import { Entity } from '../../EntityComponentSystem/Entity';
import { Action } from '../Action';
export declare class Blink implements Action {
    private _graphics;
    private _timeVisible;
    private _timeNotVisible;
    private _elapsedTime;
    private _totalTime;
    private _duration;
    private _stopped;
    private _started;
    constructor(entity: Entity, timeVisible: number, timeNotVisible: number, numBlinks?: number);
    update(delta: number): void;
    isComplete(): boolean;
    stop(): void;
    reset(): void;
}
