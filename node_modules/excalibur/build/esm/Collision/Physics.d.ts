import { Vector } from '../Math/vector';
/**
 * Possible collision resolution strategies
 *
 * The default is [[CollisionResolutionStrategy.Arcade]] which performs simple axis aligned arcade style physics. This is useful for things
 * like platformers or top down games.
 *
 * More advanced rigid body physics are enabled by setting [[CollisionResolutionStrategy.Realistic]] which allows for complicated
 * simulated physical interactions.
 */
export declare enum CollisionResolutionStrategy {
    Arcade = "arcade",
    Realistic = "realistic"
}
/**
 * Possible broadphase collision pair identification strategies
 *
 * The default strategy is [[BroadphaseStrategy.DynamicAABBTree]] which uses a binary tree of axis-aligned bounding boxes to identify
 * potential collision pairs which is O(nlog(n)) faster.
 */
export declare enum BroadphaseStrategy {
    DynamicAABBTree = 0
}
/**
 * Possible numerical integrators for position and velocity
 */
export declare enum Integrator {
    Euler = 0
}
/**
 * The [[Physics]] object is the global configuration object for all Excalibur physics.
 */
export declare class Physics {
    /**
     * Global acceleration that is applied to all vanilla actors that have a [[CollisionType.Active|active]] collision type.
     * Global acceleration won't effect [[Label|labels]], [[ScreenElement|ui actors]], or [[Trigger|triggers]] in Excalibur.
     *
     * This is a great way to globally simulate effects like gravity.
     */
    static acc: Vector;
    static get gravity(): Vector;
    static set gravity(v: Vector);
    /**
     * Globally switches all Excalibur physics behavior on or off.
     */
    static enabled: boolean;
    /**
     * Gets or sets the broadphase pair identification strategy.
     *
     * The default strategy is [[BroadphaseStrategy.DynamicAABBTree]] which uses a binary tree of axis-aligned bounding boxes to identify
     * potential collision pairs which is O(nlog(n)) faster.
     */
    static broadphaseStrategy: BroadphaseStrategy;
    /**
     * Gets or sets the global collision resolution strategy (narrowphase).
     *
     * The default is [[CollisionResolutionStrategy.Arcade]] which performs simple axis aligned arcade style physics.
     *
     * More advanced rigid body physics are enabled by setting [[CollisionResolutionStrategy.Realistic]] which allows for complicated
     * simulated physical interactions.
     */
    static collisionResolutionStrategy: CollisionResolutionStrategy;
    /**
     * The default mass to use if none is specified
     */
    static defaultMass: number;
    /**
     * Gets or sets the position and velocity positional integrator, currently only Euler is supported.
     */
    static integrator: Integrator;
    /**
     * Configures Excalibur to use "arcade" physics. Arcade physics which performs simple axis aligned arcade style physics.
     */
    static useArcadePhysics(): void;
    /**
     * Configures Excalibur to use rigid body physics. Rigid body physics allows for complicated
     * simulated physical interactions.
     */
    static useRealisticPhysics(): void;
    /**
     * Factor to add to the RigidBody BoundingBox, bounding box (dimensions += vel * dynamicTreeVelocityMultiplier);
     */
    static dynamicTreeVelocityMultiplier: number;
    static get dynamicTreeVelocityMultiplyer(): number;
    static set dynamicTreeVelocityMultiplyer(value: number);
    /**
     * Pad RigidBody BoundingBox by a constant amount
     */
    static boundsPadding: number;
    /**
     * Number of position iterations (overlap) to run in the solver
     */
    static positionIterations: number;
    /**
     * Number of velocity iteration (response) to run in the solver
     */
    static velocityIterations: number;
    /**
     * Amount of overlap to tolerate in pixels
     */
    static slop: number;
    /**
     * Amount of positional overlap correction to apply each position iteration of the solver
     * O - meaning no correction, 1 - meaning correct all overlap
     */
    static steeringFactor: number;
    /**
     * Warm start set to true re-uses impulses from previous frames back in the solver
     */
    static warmStart: boolean;
    /**
     * By default bodies do not sleep
     */
    static bodiesCanSleepByDefault: boolean;
    /**
     * Surface epsilon is used to help deal with surface penetration
     */
    static surfaceEpsilon: number;
    static sleepEpsilon: number;
    static wakeThreshold: number;
    static sleepBias: number;
    /**
     * Enable fast moving body checking, this enables checking for collision pairs via raycast for fast moving objects to prevent
     * bodies from tunneling through one another.
     */
    static checkForFastBodies: boolean;
    /**
     * Disable minimum fast moving body raycast, by default if ex.Physics.checkForFastBodies = true Excalibur will only check if the
     * body is moving at least half of its minimum dimension in an update. If ex.Physics.disableMinimumSpeedForFastBody is set to true,
     * Excalibur will always perform the fast body raycast regardless of speed.
     */
    static disableMinimumSpeedForFastBody: boolean;
}
