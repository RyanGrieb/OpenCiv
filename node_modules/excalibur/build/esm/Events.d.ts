import { Scene } from './Scene';
import { Vector } from './Math/vector';
import { Actor } from './Actor';
import { Trigger } from './Trigger';
import { FrameStats } from './Debug';
import { Engine } from './Engine';
import { TileMap } from './TileMap';
import { Side } from './Collision/Side';
import * as Input from './Input/Index';
import { CollisionContact } from './Collision/Detection/CollisionContact';
import { Collider } from './Collision/Colliders/Collider';
import { Entity } from './EntityComponentSystem/Entity';
import { OnInitialize, OnPreUpdate, OnPostUpdate, SceneActivationContext } from './Interfaces/LifecycleEvents';
import { BodyComponent } from './Collision/BodyComponent';
import { ExcaliburGraphicsContext } from './Graphics';
export declare enum EventTypes {
    Kill = "kill",
    PreKill = "prekill",
    PostKill = "postkill",
    PreDraw = "predraw",
    PostDraw = "postdraw",
    PreDebugDraw = "predebugdraw",
    PostDebugDraw = "postdebugdraw",
    PreUpdate = "preupdate",
    PostUpdate = "postupdate",
    PreFrame = "preframe",
    PostFrame = "postframe",
    PreCollision = "precollision",
    CollisionStart = "collisionstart",
    CollisionEnd = "collisionend",
    PostCollision = "postcollision",
    Initialize = "initialize",
    Activate = "activate",
    Deactivate = "deactivate",
    ExitViewport = "exitviewport",
    EnterViewport = "enterviewport",
    ExitTrigger = "exit",
    EnterTrigger = "enter",
    Connect = "connect",
    Disconnect = "disconnect",
    Button = "button",
    Axis = "axis",
    Visible = "visible",
    Hidden = "hidden",
    Start = "start",
    Stop = "stop",
    PointerUp = "pointerup",
    PointerDown = "pointerdown",
    PointerMove = "pointermove",
    PointerEnter = "pointerenter",
    PointerLeave = "pointerleave",
    PointerCancel = "pointercancel",
    PointerWheel = "pointerwheel",
    Up = "up",
    Down = "down",
    Move = "move",
    Enter = "enter",
    Leave = "leave",
    Cancel = "cancel",
    Wheel = "wheel",
    Press = "press",
    Release = "release",
    Hold = "hold",
    PointerDragStart = "pointerdragstart",
    PointerDragEnd = "pointerdragend",
    PointerDragEnter = "pointerdragenter",
    PointerDragLeave = "pointerdragleave",
    PointerDragMove = "pointerdragmove"
}
export declare type kill = 'kill';
export declare type prekill = 'prekill';
export declare type postkill = 'postkill';
export declare type predraw = 'predraw';
export declare type postdraw = 'postdraw';
export declare type predebugdraw = 'predebugdraw';
export declare type postdebugdraw = 'postdebugdraw';
export declare type preupdate = 'preupdate';
export declare type postupdate = 'postupdate';
export declare type preframe = 'preframe';
export declare type postframe = 'postframe';
export declare type precollision = 'precollision';
export declare type collisionstart = 'collisionstart';
export declare type collisionend = 'collisionend';
export declare type postcollision = 'postcollision';
export declare type initialize = 'initialize';
export declare type activate = 'activate';
export declare type deactivate = 'deactivate';
export declare type exitviewport = 'exitviewport';
export declare type enterviewport = 'enterviewport';
export declare type exittrigger = 'exit';
export declare type entertrigger = 'enter';
export declare type connect = 'connect';
export declare type disconnect = 'disconnect';
export declare type button = 'button';
export declare type axis = 'axis';
export declare type subscribe = 'subscribe';
export declare type unsubscribe = 'unsubscribe';
export declare type visible = 'visible';
export declare type hidden = 'hidden';
export declare type start = 'start';
export declare type stop = 'stop';
export declare type pointerup = 'pointerup';
export declare type pointerdown = 'pointerdown';
export declare type pointermove = 'pointermove';
export declare type pointerenter = 'pointerenter';
export declare type pointerleave = 'pointerleave';
export declare type pointercancel = 'pointercancel';
export declare type pointerwheel = 'pointerwheel';
export declare type up = 'up';
export declare type down = 'down';
export declare type move = 'move';
export declare type enter = 'enter';
export declare type leave = 'leave';
export declare type cancel = 'cancel';
export declare type wheel = 'wheel';
export declare type press = 'press';
export declare type release = 'release';
export declare type hold = 'hold';
export declare type pointerdragstart = 'pointerdragstart';
export declare type pointerdragend = 'pointerdragend';
export declare type pointerdragenter = 'pointerdragenter';
export declare type pointerdragleave = 'pointerdragleave';
export declare type pointerdragmove = 'pointerdragmove';
/**
 * Base event type in Excalibur that all other event types derive from. Not all event types are thrown on all Excalibur game objects,
 * some events are unique to a type, others are not.
 *
 */
export declare class GameEvent<T, U = T> {
    /**
     * Target object for this event.
     */
    target: T;
    /**
     * Other target object for this event
     */
    other: U | null;
    /**
     * If set to false, prevents event from propagating to other actors. If true it will be propagated
     * to all actors that apply.
     */
    get bubbles(): boolean;
    set bubbles(value: boolean);
    private _bubbles;
    /**
     * Prevents event from bubbling
     */
    stopPropagation(): void;
}
/**
 * The 'kill' event is emitted on actors when it is killed. The target is the actor that was killed.
 */
export declare class KillEvent extends GameEvent<Actor> {
    target: Actor;
    constructor(target: Actor);
}
/**
 * The 'prekill' event is emitted directly before an actor is killed.
 */
export declare class PreKillEvent extends GameEvent<Actor> {
    target: Actor;
    constructor(target: Actor);
}
/**
 * The 'postkill' event is emitted directly after the actor is killed.
 */
export declare class PostKillEvent extends GameEvent<Actor> {
    target: Actor;
    constructor(target: Actor);
}
/**
 * The 'start' event is emitted on engine when has started and is ready for interaction.
 */
export declare class GameStartEvent extends GameEvent<Engine> {
    target: Engine;
    constructor(target: Engine);
}
/**
 * The 'stop' event is emitted on engine when has been stopped and will no longer take input, update or draw.
 */
export declare class GameStopEvent extends GameEvent<Engine> {
    target: Engine;
    constructor(target: Engine);
}
/**
 * The 'predraw' event is emitted on actors, scenes, and engine before drawing starts. Actors' predraw happens inside their graphics
 * transform so that all drawing takes place with the actor as the origin.
 *
 */
export declare class PreDrawEvent extends GameEvent<Entity | Scene | Engine | TileMap> {
    ctx: ExcaliburGraphicsContext;
    delta: number;
    target: Entity | Scene | Engine | TileMap;
    constructor(ctx: ExcaliburGraphicsContext, delta: number, target: Entity | Scene | Engine | TileMap);
}
/**
 * The 'postdraw' event is emitted on actors, scenes, and engine after drawing finishes. Actors' postdraw happens inside their graphics
 * transform so that all drawing takes place with the actor as the origin.
 *
 */
export declare class PostDrawEvent extends GameEvent<Entity | Scene | Engine | TileMap> {
    ctx: ExcaliburGraphicsContext;
    delta: number;
    target: Entity | Scene | Engine | TileMap;
    constructor(ctx: ExcaliburGraphicsContext, delta: number, target: Entity | Scene | Engine | TileMap);
}
/**
 * The 'predebugdraw' event is emitted on actors, scenes, and engine before debug drawing starts.
 */
export declare class PreDebugDrawEvent extends GameEvent<Entity | Actor | Scene | Engine> {
    ctx: ExcaliburGraphicsContext;
    target: Entity | Actor | Scene | Engine;
    constructor(ctx: ExcaliburGraphicsContext, target: Entity | Actor | Scene | Engine);
}
/**
 * The 'postdebugdraw' event is emitted on actors, scenes, and engine after debug drawing starts.
 */
export declare class PostDebugDrawEvent extends GameEvent<Entity | Actor | Scene | Engine> {
    ctx: ExcaliburGraphicsContext;
    target: Entity | Actor | Scene | Engine;
    constructor(ctx: ExcaliburGraphicsContext, target: Entity | Actor | Scene | Engine);
}
/**
 * The 'preupdate' event is emitted on actors, scenes, camera, and engine before the update starts.
 */
export declare class PreUpdateEvent<T extends OnPreUpdate = Entity> extends GameEvent<T> {
    engine: Engine;
    delta: number;
    target: T;
    constructor(engine: Engine, delta: number, target: T);
}
/**
 * The 'postupdate' event is emitted on actors, scenes, camera, and engine after the update ends.
 */
export declare class PostUpdateEvent<T extends OnPostUpdate = Entity> extends GameEvent<T> {
    engine: Engine;
    delta: number;
    target: T;
    constructor(engine: Engine, delta: number, target: T);
}
/**
 * The 'preframe' event is emitted on the engine, before the frame begins.
 */
export declare class PreFrameEvent extends GameEvent<Engine> {
    engine: Engine;
    prevStats: FrameStats;
    constructor(engine: Engine, prevStats: FrameStats);
}
/**
 * The 'postframe' event is emitted on the engine, after a frame ends.
 */
export declare class PostFrameEvent extends GameEvent<Engine> {
    engine: Engine;
    stats: FrameStats;
    constructor(engine: Engine, stats: FrameStats);
}
/**
 * Event received when a gamepad is connected to Excalibur. [[Gamepads]] receives this event.
 */
export declare class GamepadConnectEvent extends GameEvent<Input.Gamepad> {
    index: number;
    gamepad: Input.Gamepad;
    constructor(index: number, gamepad: Input.Gamepad);
}
/**
 * Event received when a gamepad is disconnected from Excalibur. [[Gamepads]] receives this event.
 */
export declare class GamepadDisconnectEvent extends GameEvent<Input.Gamepad> {
    index: number;
    gamepad: Input.Gamepad;
    constructor(index: number, gamepad: Input.Gamepad);
}
/**
 * Gamepad button event. See [[Gamepads]] for information on responding to controller input. [[Gamepad]] instances receive this event;
 */
export declare class GamepadButtonEvent extends GameEvent<Input.Gamepad> {
    button: Input.Buttons;
    value: number;
    target: Input.Gamepad;
    /**
     * @param button  The Gamepad button
     * @param value   A numeric value between 0 and 1
     */
    constructor(button: Input.Buttons, value: number, target: Input.Gamepad);
}
/**
 * Gamepad axis event. See [[Gamepads]] for information on responding to controller input. [[Gamepad]] instances receive this event;
 */
export declare class GamepadAxisEvent extends GameEvent<Input.Gamepad> {
    axis: Input.Axes;
    value: number;
    target: Input.Gamepad;
    /**
     * @param axis  The Gamepad axis
     * @param value A numeric value between -1 and 1
     */
    constructor(axis: Input.Axes, value: number, target: Input.Gamepad);
}
/**
 * Event received by the [[Engine]] when the browser window is visible on a screen.
 */
export declare class VisibleEvent extends GameEvent<Engine> {
    target: Engine;
    constructor(target: Engine);
}
/**
 * Event received by the [[Engine]] when the browser window is hidden from all screens.
 */
export declare class HiddenEvent extends GameEvent<Engine> {
    target: Engine;
    constructor(target: Engine);
}
/**
 * Event thrown on an [[Actor|actor]] when a collision will occur this frame if it resolves
 */
export declare class PreCollisionEvent<T extends BodyComponent | Collider | Entity = Actor> extends GameEvent<T> {
    other: T;
    side: Side;
    intersection: Vector;
    /**
     * @param actor         The actor the event was thrown on
     * @param other         The actor that will collided with the current actor
     * @param side          The side that will be collided with the current actor
     * @param intersection  Intersection vector
     */
    constructor(actor: T, other: T, side: Side, intersection: Vector);
}
/**
 * Event thrown on an [[Actor|actor]] when a collision has been resolved (body reacted) this frame
 */
export declare class PostCollisionEvent<T extends Collider | Entity = Actor> extends GameEvent<T> {
    other: T;
    side: Side;
    intersection: Vector;
    /**
     * @param actor         The actor the event was thrown on
     * @param other         The actor that did collide with the current actor
     * @param side          The side that did collide with the current actor
     * @param intersection  Intersection vector
     */
    constructor(actor: T, other: T, side: Side, intersection: Vector);
    get actor(): T;
    set actor(actor: T);
}
export declare class ContactStartEvent<T> {
    target: T;
    other: T;
    contact: CollisionContact;
    constructor(target: T, other: T, contact: CollisionContact);
}
export declare class ContactEndEvent<T> {
    target: T;
    other: T;
    constructor(target: T, other: T);
}
export declare class CollisionPreSolveEvent<T> {
    target: T;
    other: T;
    side: Side;
    intersection: Vector;
    contact: CollisionContact;
    constructor(target: T, other: T, side: Side, intersection: Vector, contact: CollisionContact);
}
export declare class CollisionPostSolveEvent<T> {
    target: T;
    other: T;
    side: Side;
    intersection: Vector;
    contact: CollisionContact;
    constructor(target: T, other: T, side: Side, intersection: Vector, contact: CollisionContact);
}
/**
 * Event thrown the first time an [[Actor|actor]] collides with another, after an actor is in contact normal collision events are fired.
 */
export declare class CollisionStartEvent<T extends BodyComponent | Collider | Entity = Actor> extends GameEvent<T> {
    other: T;
    contact: CollisionContact;
    /**
     *
     * @param actor
     * @param other
     * @param contact
     */
    constructor(actor: T, other: T, contact: CollisionContact);
    get actor(): T;
    set actor(actor: T);
}
/**
 * Event thrown when the [[Actor|actor]] is no longer colliding with another
 */
export declare class CollisionEndEvent<T extends BodyComponent | Collider | Entity = Actor> extends GameEvent<T> {
    other: T;
    /**
     *
     */
    constructor(actor: T, other: T);
    get actor(): T;
    set actor(actor: T);
}
/**
 * Event thrown on an [[Actor]] and a [[Scene]] only once before the first update call
 */
export declare class InitializeEvent<T extends OnInitialize = Entity> extends GameEvent<T> {
    engine: Engine;
    target: T;
    /**
     * @param engine  The reference to the current engine
     */
    constructor(engine: Engine, target: T);
}
/**
 * Event thrown on a [[Scene]] on activation
 */
export declare class ActivateEvent<TData = undefined> extends GameEvent<Scene> {
    context: SceneActivationContext<TData>;
    target: Scene;
    /**
     * @param context  The context for the scene activation
     */
    constructor(context: SceneActivationContext<TData>, target: Scene);
}
/**
 * Event thrown on a [[Scene]] on deactivation
 */
export declare class DeactivateEvent extends GameEvent<Scene> {
    context: SceneActivationContext<never>;
    target: Scene;
    /**
     * @param context  The context for the scene deactivation
     */
    constructor(context: SceneActivationContext<never>, target: Scene);
}
/**
 * Event thrown on an [[Actor]] when it completely leaves the screen.
 */
export declare class ExitViewPortEvent extends GameEvent<Entity> {
    target: Entity;
    constructor(target: Entity);
}
/**
 * Event thrown on an [[Actor]] when it completely leaves the screen.
 */
export declare class EnterViewPortEvent extends GameEvent<Entity> {
    target: Entity;
    constructor(target: Entity);
}
export declare class EnterTriggerEvent extends GameEvent<Actor> {
    target: Trigger;
    actor: Actor;
    constructor(target: Trigger, actor: Actor);
}
export declare class ExitTriggerEvent extends GameEvent<Actor> {
    target: Trigger;
    actor: Actor;
    constructor(target: Trigger, actor: Actor);
}
