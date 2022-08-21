import { Entity } from '../../EntityComponentSystem';
import { Action } from '../Action';
import { ActionContext } from '../ActionContext';
/**
 * Action that can represent a sequence of actions, this can be useful in conjunction with
 * [[ParallelActions]] to run multiple sequences in parallel.
 */
export declare class ActionSequence implements Action {
    private _actionQueue;
    private _stopped;
    private _sequenceContext;
    private _sequenceBuilder;
    constructor(entity: Entity, actionBuilder: (actionContext: ActionContext) => any);
    update(delta: number): void;
    isComplete(): boolean;
    stop(): void;
    reset(): void;
    clone(entity: Entity): ActionSequence;
}
