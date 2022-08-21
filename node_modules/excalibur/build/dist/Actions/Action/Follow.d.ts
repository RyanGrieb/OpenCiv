import { Entity } from '../../EntityComponentSystem/Entity';
import { Action } from '../Action';
export declare class Follow implements Action {
    private _tx;
    private _motion;
    private _followTx;
    private _followMotion;
    x: number;
    y: number;
    private _current;
    private _end;
    private _dir;
    private _speed;
    private _maximumDistance;
    private _distanceBetween;
    private _started;
    private _stopped;
    constructor(entity: Entity, entityToFollow: Entity, followDistance?: number);
    update(_delta: number): void;
    stop(): void;
    isComplete(): boolean;
    reset(): void;
}
