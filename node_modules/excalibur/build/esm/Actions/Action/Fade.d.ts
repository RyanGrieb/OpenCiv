import { Entity } from '../../EntityComponentSystem/Entity';
import { Action } from '../Action';
export declare class Fade implements Action {
    private _graphics;
    x: number;
    y: number;
    private _endOpacity;
    private _speed;
    private _ogspeed;
    private _multiplier;
    private _started;
    private _stopped;
    constructor(entity: Entity, endOpacity: number, speed: number);
    update(delta: number): void;
    isComplete(): boolean;
    stop(): void;
    reset(): void;
}
