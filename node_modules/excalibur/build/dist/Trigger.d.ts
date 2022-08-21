import { Engine } from './Engine';
import { Vector } from './Math/vector';
import { Entity } from './EntityComponentSystem';
import { Actor } from './Actor';
/**
 * ITriggerOptions
 */
export interface TriggerOptions {
    pos: Vector;
    width: number;
    height: number;
    visible: boolean;
    action: () => void;
    target: Entity;
    filter: (actor: Entity) => boolean;
    repeat: number;
}
/**
 * Triggers are a method of firing arbitrary code on collision. These are useful
 * as 'buttons', 'switches', or to trigger effects in a game. By default triggers
 * are invisible, and can only be seen when [[Trigger.visible]] is set to `true`.
 */
export declare class Trigger extends Actor {
    private _target;
    /**
     * Action to fire when triggered by collision
     */
    action: () => void;
    /**
     * Filter to add additional granularity to action dispatch, if a filter is specified the action will only fire when
     * filter return true for the collided actor.
     */
    filter: (actor: Entity) => boolean;
    /**
     * Number of times to repeat before killing the trigger,
     */
    repeat: number;
    /**
     *
     * @param opts Trigger options
     */
    constructor(opts: Partial<TriggerOptions>);
    set target(target: Entity);
    get target(): Entity;
    _initialize(engine: Engine): void;
    private _dispatchAction;
}
