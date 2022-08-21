import { Entity } from '../../EntityComponentSystem/Entity';
import { Action } from '../Action';
export declare class MoveBy implements Action {
    private _tx;
    private _motion;
    private _entity;
    x: number;
    y: number;
    private _distance;
    private _speed;
    private _start;
    private _offset;
    private _end;
    private _dir;
    private _started;
    private _stopped;
    constructor(entity: Entity, offsetX: number, offsetY: number, speed: number);
    update(_delta: number): void;
    isComplete(entity: Entity): boolean;
    stop(): void;
    reset(): void;
}
