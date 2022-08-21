import { Action } from '../Action';
import { RotationType } from '../RotationType';
import { Entity } from '../../EntityComponentSystem/Entity';
export declare class RotateBy implements Action {
    private _tx;
    private _motion;
    x: number;
    y: number;
    private _start;
    private _end;
    private _speed;
    private _offset;
    private _rotationType;
    private _direction;
    private _distance;
    private _shortDistance;
    private _longDistance;
    private _shortestPathIsPositive;
    private _currentNonCannonAngle;
    private _started;
    private _stopped;
    constructor(entity: Entity, angleRadiansOffset: number, speed: number, rotationType?: RotationType);
    update(_delta: number): void;
    isComplete(): boolean;
    stop(): void;
    reset(): void;
}
