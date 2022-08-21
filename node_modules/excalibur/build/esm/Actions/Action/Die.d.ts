import { Entity } from '../../EntityComponentSystem/Entity';
import { Action } from '../Action';
export declare class Die implements Action {
    private _entity;
    private _stopped;
    constructor(entity: Entity);
    update(_delta: number): void;
    isComplete(): boolean;
    stop(): void;
    reset(): void;
}
