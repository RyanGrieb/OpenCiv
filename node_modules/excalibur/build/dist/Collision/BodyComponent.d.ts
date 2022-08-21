import { Vector } from '../Math/vector';
import { CollisionType } from './CollisionType';
import { Clonable } from '../Interfaces/Clonable';
import { TransformComponent } from '../EntityComponentSystem/Components/TransformComponent';
import { MotionComponent } from '../EntityComponentSystem/Components/MotionComponent';
import { Component } from '../EntityComponentSystem/Component';
import { CollisionGroup } from './Group/CollisionGroup';
import { EventDispatcher } from '../EventDispatcher';
import { Id } from '../Id';
export interface BodyComponentOptions {
    type?: CollisionType;
    group?: CollisionGroup;
    useGravity?: boolean;
}
export declare enum DegreeOfFreedom {
    Rotation = "rotation",
    X = "x",
    Y = "y"
}
/**
 * Body describes all the physical properties pos, vel, acc, rotation, angular velocity for the purpose of
 * of physics simulation.
 */
export declare class BodyComponent extends Component<'ex.body'> implements Clonable<BodyComponent> {
    readonly type = "ex.body";
    dependencies: (typeof TransformComponent | typeof MotionComponent)[];
    static _ID: number;
    readonly id: Id<'body'>;
    events: EventDispatcher<any>;
    private _oldTransform;
    /**
     * Indicates whether the old transform has been captured at least once for interpolation
     * @internal
     */
    __oldTransformCaptured: boolean;
    /**
     * Enable or disabled the fixed update interpolation, by default interpolation is on.
     */
    enableFixedUpdateInterpolate: boolean;
    constructor(options?: BodyComponentOptions);
    get matrix(): import("..").AffineMatrix;
    /**
     * Collision type for the rigidbody physics simulation, by default [[CollisionType.PreventCollision]]
     */
    collisionType: CollisionType;
    /**
     * The collision group for the body's colliders, by default body colliders collide with everything
     */
    group: CollisionGroup;
    /**
     * The amount of mass the body has
     */
    private _mass;
    get mass(): number;
    set mass(newMass: number);
    /**
     * The inverse mass (1/mass) of the body. If [[CollisionType.Fixed]] this is 0, meaning "infinite" mass
     */
    get inverseMass(): number;
    /**
     * Amount of "motion" the body has before sleeping. If below [[Physics.sleepEpsilon]] it goes to "sleep"
     */
    sleepMotion: number;
    /**
     * Can this body sleep, by default bodies do not sleep
     */
    canSleep: boolean;
    private _sleeping;
    /**
     * Whether this body is sleeping or not
     */
    get sleeping(): boolean;
    /**
     * Set the sleep state of the body
     * @param sleeping
     */
    setSleeping(sleeping: boolean): void;
    /**
     * Update body's [[BodyComponent.sleepMotion]] for the purpose of sleeping
     */
    updateMotion(): void;
    private _cachedInertia;
    /**
     * Get the moment of inertia from the [[ColliderComponent]]
     */
    get inertia(): number;
    private _cachedInverseInertia;
    /**
     * Get the inverse moment of inertial from the [[ColliderComponent]]. If [[CollisionType.Fixed]] this is 0, meaning "infinite" mass
     */
    get inverseInertia(): number;
    /**
     * The also known as coefficient of restitution of this actor, represents the amount of energy preserved after collision or the
     * bounciness. If 1, it is 100% bouncy, 0 it completely absorbs.
     */
    bounciness: number;
    /**
     * The coefficient of friction on this actor
     */
    friction: number;
    /**
     * Should use global gravity [[Physics.gravity]] in it's physics simulation, default is true
     */
    useGravity: boolean;
    /**
     * Degrees of freedom to limit
     *
     * Note: this only limits responses in the realistic solver, if velocity/angularVelocity is set the actor will still respond
     */
    limitDegreeOfFreedom: DegreeOfFreedom[];
    /**
     * Returns if the owner is active
     */
    get active(): boolean;
    /**
     * @deprecated Use globalP0s
     */
    get center(): Vector;
    get transform(): TransformComponent;
    get motion(): MotionComponent;
    get pos(): Vector;
    set pos(val: Vector);
    /**
     * The (x, y) position of the actor this will be in the middle of the actor if the
     * [[Actor.anchor]] is set to (0.5, 0.5) which is default.
     * If you want the (x, y) position to be the top left of the actor specify an anchor of (0, 0).
     */
    get globalPos(): Vector;
    set globalPos(val: Vector);
    /**
     * The position of the actor last frame (x, y) in pixels
     */
    get oldPos(): Vector;
    /**
     * The current velocity vector (vx, vy) of the actor in pixels/second
     */
    get vel(): Vector;
    set vel(val: Vector);
    /**
     * The velocity of the actor last frame (vx, vy) in pixels/second
     */
    oldVel: Vector;
    /**
     * The current acceleration vector (ax, ay) of the actor in pixels/second/second. An acceleration pointing down such as (0, 100) may
     * be useful to simulate a gravitational effect.
     */
    get acc(): Vector;
    set acc(val: Vector);
    /**
     * Gets/sets the acceleration of the actor from the last frame. This does not include the global acc [[Physics.acc]].
     */
    oldAcc: Vector;
    /**
     * The current torque applied to the actor
     */
    get torque(): number;
    set torque(val: number);
    /**
     * Gets/sets the rotation of the body from the last frame.
     */
    get oldRotation(): number;
    /**
     * The rotation of the body in radians
     */
    get rotation(): number;
    set rotation(val: number);
    /**
     * The scale vector of the actor
     */
    get scale(): Vector;
    set scale(val: Vector);
    /**
     * The scale of the actor last frame
     */
    get oldScale(): Vector;
    /**
     * The scale rate of change of the actor in scale/second
     */
    get scaleFactor(): Vector;
    set scaleFactor(scaleFactor: Vector);
    /**
     * Get the angular velocity in radians/second
     */
    get angularVelocity(): number;
    /**
     * Set the angular velocity in radians/second
     */
    set angularVelocity(value: number);
    /**
     * Apply a specific impulse to the body
     * @param point
     * @param impulse
     */
    applyImpulse(point: Vector, impulse: Vector): void;
    /**
     * Apply only linear impulse to the body
     * @param impulse
     */
    applyLinearImpulse(impulse: Vector): void;
    /**
     * Apply only angular impulse to the body
     * @param point
     * @param impulse
     */
    applyAngularImpulse(point: Vector, impulse: Vector): void;
    /**
     * Sets the old versions of pos, vel, acc, and scale.
     */
    captureOldTransform(): void;
}
