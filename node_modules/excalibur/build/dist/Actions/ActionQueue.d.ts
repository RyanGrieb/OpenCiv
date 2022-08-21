import { Entity } from '../EntityComponentSystem/Entity';
import { Action } from './Action';
/**
 * Action Queues represent an ordered sequence of actions
 *
 * Action queues are part of the [[ActionContext|Action API]] and
 * store the list of actions to be executed for an [[Actor]].
 *
 * Actors implement [[Actor.actions]] which can be manipulated by
 * advanced users to adjust the actions currently being executed in the
 * queue.
 */
export declare class ActionQueue {
    private _entity;
    private _actions;
    private _currentAction;
    private _completedActions;
    constructor(entity: Entity);
    /**
     * Add an action to the sequence
     * @param action
     */
    add(action: Action): void;
    /**
     * Remove an action by reference from the sequence
     * @param action
     */
    remove(action: Action): void;
    /**
     * Removes all actions from this sequence
     */
    clearActions(): void;
    /**
     *
     * @returns The total list of actions in this sequence complete or not
     */
    getActions(): Action[];
    /**
     *
     * @returns `true` if there are more actions to process in the sequence
     */
    hasNext(): boolean;
    /**
     * @returns `true` if the current sequence of actions is done
     */
    isComplete(): boolean;
    /**
     * Resets the sequence of actions, this is used to restart a sequence from the beginning
     */
    reset(): void;
    /**
     * Update the queue which updates actions and handles completing actions
     * @param elapsedMs
     */
    update(elapsedMs: number): void;
}
