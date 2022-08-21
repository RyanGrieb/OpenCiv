import { Entity } from '../../EntityComponentSystem/Entity';
import { Action } from '../Action';
import { ActionContext } from '../ActionContext';
/**
 * RepeatForever Action implementation, it is recommended you use the fluent action
 * context API.
 *
 *
 */
export declare class RepeatForever implements Action {
    private _actionQueue;
    private _stopped;
    private _repeatContext;
    private _repeatBuilder;
    constructor(entity: Entity, repeatBuilder: (repeatContext: ActionContext) => any);
    update(delta: number): void;
    isComplete(): boolean;
    stop(): void;
    reset(): void;
}
