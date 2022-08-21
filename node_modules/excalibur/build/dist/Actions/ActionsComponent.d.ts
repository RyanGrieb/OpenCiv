import { ActionContext } from './ActionContext';
import { Component } from '../EntityComponentSystem/Component';
import { Entity } from '../EntityComponentSystem/Entity';
import { Actor } from '../Actor';
import { MotionComponent } from '../EntityComponentSystem/Components/MotionComponent';
import { TransformComponent } from '../EntityComponentSystem/Components/TransformComponent';
import { Vector } from '../Math/vector';
import { EasingFunction } from '../Util/EasingFunctions';
import { ActionQueue } from './ActionQueue';
import { RotationType } from './RotationType';
import { Action } from './Action';
export interface ActionContextMethods extends Pick<ActionContext, keyof ActionContext> {
}
export declare class ActionsComponent extends Component<'ex.actions'> implements ActionContextMethods {
    readonly type = "ex.actions";
    dependencies: (typeof TransformComponent | typeof MotionComponent)[];
    private _ctx;
    onAdd(entity: Entity): void;
    onRemove(): void;
    /**
     * Returns the internal action queue
     * @returns action queue
     */
    getQueue(): ActionQueue;
    runAction(action: Action): ActionContext;
    /**
     * Updates the internal action context, performing action and moving through the internal queue
     * @param elapsedMs
     */
    update(elapsedMs: number): void;
    /**
     * Clears all queued actions from the Actor
     */
    clearActions(): void;
    /**
     * This method will move an actor to the specified `x` and `y` position over the
     * specified duration using a given [[EasingFunctions]] and return back the actor. This
     * method is part of the actor 'Action' fluent API allowing action chaining.
     * @param pos       The x,y vector location to move the actor to
     * @param duration  The time it should take the actor to move to the new location in milliseconds
     * @param easingFcn Use [[EasingFunctions]] or a custom function to use to calculate position, Default is [[EasingFunctions.Linear]]
     */
    easeTo(pos: Vector, duration: number, easingFcn?: EasingFunction): ActionContext;
    /**
     * This method will move an actor to the specified `x` and `y` position over the
     * specified duration using a given [[EasingFunctions]] and return back the actor. This
     * method is part of the actor 'Action' fluent API allowing action chaining.
     * @param x         The x location to move the actor to
     * @param y         The y location to move the actor to
     * @param duration  The time it should take the actor to move to the new location in milliseconds
     * @param easingFcn Use [[EasingFunctions]] or a custom function to use to calculate position, Default is [[EasingFunctions.Linear]]
     */
    easeTo(x: number, y: number, duration: number, easingFcn?: EasingFunction): ActionContext;
    easeBy(offset: Vector, duration: number, easingFcn?: EasingFunction): ActionContext;
    easeBy(offsetX: number, offsetY: number, duration: number, easingFcn?: EasingFunction): ActionContext;
    /**
     * This method will move an actor to the specified x and y position at the
     * speed specified (in pixels per second) and return back the actor. This
     * method is part of the actor 'Action' fluent API allowing action chaining.
     * @param pos    The x,y vector location to move the actor to
     * @param speed  The speed in pixels per second to move
     */
    moveTo(pos: Vector, speed: number): ActionContext;
    /**
     * This method will move an actor to the specified x and y position at the
     * speed specified (in pixels per second) and return back the actor. This
     * method is part of the actor 'Action' fluent API allowing action chaining.
     * @param x      The x location to move the actor to
     * @param y      The y location to move the actor to
     * @param speed  The speed in pixels per second to move
     */
    moveTo(x: number, y: number, speed: number): ActionContext;
    /**
     * This method will move an actor by the specified x offset and y offset from its current position, at a certain speed.
     * This method is part of the actor 'Action' fluent API allowing action chaining.
     * @param offset The (x, y) offset to apply to this actor
     * @param speed  The speed in pixels per second the actor should move
     */
    moveBy(offset: Vector, speed: number): ActionContext;
    /**
     * This method will move an actor by the specified x offset and y offset from its current position, at a certain speed.
     * This method is part of the actor 'Action' fluent API allowing action chaining.
     * @param xOffset     The x offset to apply to this actor
     * @param yOffset     The y location to move the actor to
     * @param speed  The speed in pixels per second the actor should move
     */
    moveBy(xOffset: number, yOffset: number, speed: number): ActionContext;
    /**
     * This method will rotate an actor to the specified angle at the speed
     * specified (in radians per second) and return back the actor. This
     * method is part of the actor 'Action' fluent API allowing action chaining.
     * @param angleRadians  The angle to rotate to in radians
     * @param speed         The angular velocity of the rotation specified in radians per second
     * @param rotationType  The [[RotationType]] to use for this rotation
     */
    rotateTo(angleRadians: number, speed: number, rotationType?: RotationType): ActionContext;
    /**
     * This method will rotate an actor by the specified angle offset, from it's current rotation given a certain speed
     * in radians/sec and return back the actor. This method is part
     * of the actor 'Action' fluent API allowing action chaining.
     * @param angleRadiansOffset  The angle to rotate to in radians relative to the current rotation
     * @param speed          The speed in radians/sec the actor should rotate at
     * @param rotationType  The [[RotationType]] to use for this rotation, default is shortest path
     */
    rotateBy(angleRadiansOffset: number, speed: number, rotationType?: RotationType): ActionContext;
    /**
     * This method will scale an actor to the specified size at the speed
     * specified (in magnitude increase per second) and return back the
     * actor. This method is part of the actor 'Action' fluent API allowing
     * action chaining.
     * @param size    The scale to adjust the actor to over time
     * @param speed   The speed of scaling specified in magnitude increase per second
     */
    scaleTo(size: Vector, speed: Vector): ActionContext;
    /**
     * This method will scale an actor to the specified size at the speed
     * specified (in magnitude increase per second) and return back the
     * actor. This method is part of the actor 'Action' fluent API allowing
     * action chaining.
     * @param sizeX   The scaling factor to apply on X axis
     * @param sizeY   The scaling factor to apply on Y axis
     * @param speedX  The speed of scaling specified in magnitude increase per second on X axis
     * @param speedY  The speed of scaling specified in magnitude increase per second on Y axis
     */
    scaleTo(sizeX: number, sizeY: number, speedX: number, speedY: number): ActionContext;
    /**
     * This method will scale an actor by an amount relative to the current scale at a certain speed in scale units/sec
     * and return back the actor. This method is part of the
     * actor 'Action' fluent API allowing action chaining.
     * @param offset   The scaling factor to apply to the actor
     * @param speed    The speed to scale at in scale units/sec
     */
    scaleBy(offset: Vector, speed: number): ActionContext;
    /**
     * This method will scale an actor by an amount relative to the current scale at a certain speed in scale units/sec
     * and return back the actor. This method is part of the
     * actor 'Action' fluent API allowing action chaining.
     * @param sizeOffsetX   The scaling factor to apply on X axis
     * @param sizeOffsetY   The scaling factor to apply on Y axis
     * @param speed    The speed to scale at in scale units/sec
     */
    scaleBy(sizeOffsetX: number, sizeOffsetY: number, speed: number): ActionContext;
    /**
     * This method will cause an actor to blink (become visible and not
     * visible). Optionally, you may specify the number of blinks. Specify the amount of time
     * the actor should be visible per blink, and the amount of time not visible.
     * This method is part of the actor 'Action' fluent API allowing action chaining.
     * @param timeVisible     The amount of time to stay visible per blink in milliseconds
     * @param timeNotVisible  The amount of time to stay not visible per blink in milliseconds
     * @param numBlinks       The number of times to blink
     */
    blink(timeVisible: number, timeNotVisible: number, numBlinks?: number): ActionContext;
    /**
     * This method will cause an actor's opacity to change from its current value
     * to the provided value by a specified time (in milliseconds). This method is
     * part of the actor 'Action' fluent API allowing action chaining.
     * @param opacity  The ending opacity
     * @param time     The time it should take to fade the actor (in milliseconds)
     */
    fade(opacity: number, time: number): ActionContext;
    /**
     * This method will delay the next action from executing for a certain
     * amount of time (in milliseconds). This method is part of the actor
     * 'Action' fluent API allowing action chaining.
     * @param time  The amount of time to delay the next action in the queue from executing in milliseconds
     */
    delay(time: number): ActionContext;
    /**
     * This method will add an action to the queue that will remove the actor from the
     * scene once it has completed its previous  Any actions on the
     * action queue after this action will not be executed.
     */
    die(): ActionContext;
    /**
     * This method allows you to call an arbitrary method as the next action in the
     * action queue. This is useful if you want to execute code in after a specific
     * action, i.e An actor arrives at a destination after traversing a path
     */
    callMethod(method: () => any): ActionContext;
    /**
     * This method will cause the actor to repeat all of the actions built in
     * the `repeatBuilder` callback. If the number of repeats
     * is not specified it will repeat forever. This method is part of
     * the actor 'Action' fluent API allowing action chaining
     *
     * ```typescript
     * // Move up in a zig-zag by repeated moveBy's
     * actor.actions.repeat(repeatCtx => {
     *  repeatCtx.moveBy(10, 0, 10);
     *  repeatCtx.moveBy(0, 10, 10);
     * }, 5);
     * ```
     *
     * @param repeatBuilder The builder to specify the repeatable list of actions
     * @param times  The number of times to repeat all the previous actions in the action queue. If nothing is specified the actions
     * will repeat forever
     */
    repeat(repeatBuilder: (repeatContext: ActionContext) => any, times?: number): ActionContext;
    /**
     * This method will cause the actor to repeat all of the actions built in
     * the `repeatBuilder` callback. If the number of repeats
     * is not specified it will repeat forever. This method is part of
     * the actor 'Action' fluent API allowing action chaining
     *
     * ```typescript
     * // Move up in a zig-zag by repeated moveBy's
     * actor.actions.repeat(repeatCtx => {
     *  repeatCtx.moveBy(10, 0, 10);
     *  repeatCtx.moveBy(0, 10, 10);
     * }, 5);
     * ```
     *
     * @param repeatBuilder The builder to specify the repeatable list of actions
     */
    repeatForever(repeatBuilder: (repeatContext: ActionContext) => any): ActionContext;
    /**
     * This method will cause the entity to follow another at a specified distance
     * @param entity           The entity to follow
     * @param followDistance  The distance to maintain when following, if not specified the actor will follow at the current distance.
     */
    follow(entity: Actor, followDistance?: number): ActionContext;
    /**
     * This method will cause the entity to move towards another until they
     * collide "meet" at a specified speed.
     * @param entity  The entity to meet
     * @param speed  The speed in pixels per second to move, if not specified it will match the speed of the other actor
     */
    meet(entity: Actor, speed?: number): ActionContext;
    /**
     * Returns a promise that resolves when the current action queue up to now
     * is finished.
     */
    toPromise(): Promise<void>;
}
