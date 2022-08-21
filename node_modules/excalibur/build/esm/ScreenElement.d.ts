import { Engine } from './Engine';
import { Actor, ActorArgs } from './Actor';
/**
 * Type guard to detect a screen element
 */
export declare function isScreenElement(actor: Actor): boolean;
/**
 * Helper [[Actor]] primitive for drawing UI's, optimized for UI drawing. Does
 * not participate in collisions. Drawn on top of all other actors.
 */
export declare class ScreenElement extends Actor {
    protected _engine: Engine;
    constructor();
    constructor(config?: ActorArgs);
    _initialize(engine: Engine): void;
    contains(x: number, y: number, useWorld?: boolean): boolean;
}
