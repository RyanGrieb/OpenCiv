import { Entity } from '../../EntityComponentSystem/Entity';
import { Action } from '../Action';
import { ActionContext } from '../ActionContext';
export declare class Repeat implements Action {
    private _actionQueue;
    private _repeat;
    private _originalRepeat;
    private _stopped;
    private _repeatContext;
    private _repeatBuilder;
    constructor(entity: Entity, repeatBuilder: (repeatContext: ActionContext) => any, repeat: number);
    update(delta: number): void;
    isComplete(): boolean;
    stop(): void;
    reset(): void;
}
