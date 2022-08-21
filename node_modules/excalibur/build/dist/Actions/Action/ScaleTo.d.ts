import { Action } from '../Action';
import { Entity } from '../../EntityComponentSystem/Entity';
export declare class ScaleTo implements Action {
    private _tx;
    private _motion;
    x: number;
    y: number;
    private _startX;
    private _startY;
    private _endX;
    private _endY;
    private _speedX;
    private _speedY;
    private _distanceX;
    private _distanceY;
    private _started;
    private _stopped;
    constructor(entity: Entity, scaleX: number, scaleY: number, speedX: number, speedY: number);
    update(_delta: number): void;
    isComplete(): boolean;
    stop(): void;
    reset(): void;
}
