import { Entity } from '../../EntityComponentSystem/Entity';
import { Action } from '../Action';
export declare class MoveTo implements Action {
    entity: Entity;
    private _tx;
    private _motion;
    x: number;
    y: number;
    private _start;
    private _end;
    private _dir;
    private _speed;
    private _distance;
    private _started;
    private _stopped;
    constructor(entity: Entity, destx: number, desty: number, speed: number);
    update(_delta: number): void;
    isComplete(entity: Entity): boolean;
    stop(): void;
    reset(): void;
}
