import { Entity } from '../../EntityComponentSystem/Entity';
import { Action } from '../Action';
export declare class ScaleBy implements Action {
    private _tx;
    private _motion;
    x: number;
    y: number;
    private _startScale;
    private _endScale;
    private _offset;
    private _distanceX;
    private _distanceY;
    private _directionX;
    private _directionY;
    private _started;
    private _stopped;
    private _speedX;
    private _speedY;
    constructor(entity: Entity, scaleOffsetX: number, scaleOffsetY: number, speed: number);
    update(_delta: number): void;
    isComplete(): boolean;
    stop(): void;
    reset(): void;
}
