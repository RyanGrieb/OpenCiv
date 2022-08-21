import { Entity } from '../../EntityComponentSystem/Entity';
import { Action } from '../Action';
export declare class EaseBy implements Action {
    easingFcn: (currentTime: number, startValue: number, endValue: number, duration: number) => number;
    private _tx;
    private _motion;
    private _currentLerpTime;
    private _lerpDuration;
    private _lerpStart;
    private _lerpEnd;
    private _offset;
    private _initialized;
    private _stopped;
    constructor(entity: Entity, offsetX: number, offsetY: number, duration: number, easingFcn: (currentTime: number, startValue: number, endValue: number, duration: number) => number);
    private _initialize;
    update(delta: number): void;
    isComplete(): boolean;
    reset(): void;
    stop(): void;
}
