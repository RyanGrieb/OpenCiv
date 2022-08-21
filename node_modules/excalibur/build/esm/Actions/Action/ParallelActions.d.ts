import { Entity } from '../../EntityComponentSystem';
import { Action } from '../Action';
/**
 * Action that can run multiple [[Action]]s or [[ActionSequence]]s at the same time
 */
export declare class ParallelActions implements Action {
    private _actions;
    constructor(parallelActions: Action[]);
    update(delta: number): void;
    isComplete(entity: Entity): boolean;
    reset(): void;
    stop(): void;
}
