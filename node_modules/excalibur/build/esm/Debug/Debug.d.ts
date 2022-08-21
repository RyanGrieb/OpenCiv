import { DebugFlags, ColorBlindFlags } from './DebugFlags';
import { Engine } from '../Engine';
import { Color } from '../Color';
import { CollisionContact } from '../Collision/Detection/CollisionContact';
import { StandardClock, TestClock } from '..';
/**
 * Debug stats containing current and previous frame statistics
 */
export interface DebugStats {
    currFrame: FrameStats;
    prevFrame: FrameStats;
}
/**
 * Represents a frame's individual statistics
 */
export interface FrameStatistics {
    /**
     * The number of the frame
     */
    id: number;
    /**
     * Gets the frame's delta (time since last frame scaled by [[Engine.timescale]]) (in ms)
     */
    delta: number;
    /**
     * Gets the frame's frames-per-second (FPS)
     */
    fps: number;
    /**
     * Duration statistics (in ms)
     */
    duration: FrameDurationStats;
    /**
     * Actor statistics
     */
    actors: FrameActorStats;
    /**
     * Physics statistics
     */
    physics: PhysicsStatistics;
    /**
     * Graphics statistics
     */
    graphics: GraphicsStatistics;
}
/**
 * Represents actor stats for a frame
 */
export interface FrameActorStats {
    /**
     * Gets the frame's number of actors (alive)
     */
    alive: number;
    /**
     * Gets the frame's number of actors (killed)
     */
    killed: number;
    /**
     * Gets the frame's number of remaining actors (alive - killed)
     */
    remaining: number;
    /**
     * Gets the frame's number of UI actors
     */
    ui: number;
    /**
     * Gets the frame's number of total actors (remaining + UI)
     */
    total: number;
}
/**
 * Represents duration stats for a frame
 */
export interface FrameDurationStats {
    /**
     * Gets the frame's total time to run the update function (in ms)
     */
    update: number;
    /**
     * Gets the frame's total time to run the draw function (in ms)
     */
    draw: number;
    /**
     * Gets the frame's total render duration (update + draw duration) (in ms)
     */
    total: number;
}
/**
 * Represents physics stats for the current frame
 */
export interface PhysicsStatistics {
    /**
     * Gets the number of broadphase collision pairs which
     */
    pairs: number;
    /**
     * Gets the number of actual collisions
     */
    collisions: number;
    /**
     * Copy of the current frame contacts (only updated if debug is toggled on)
     */
    contacts: Map<string, CollisionContact>;
    /**
     * Gets the number of fast moving bodies using raycast continuous collisions in the scene
     */
    fastBodies: number;
    /**
     * Gets the number of bodies that had a fast body collision resolution
     */
    fastBodyCollisions: number;
    /**
     * Gets the time it took to calculate the broadphase pairs
     */
    broadphase: number;
    /**
     * Gets the time it took to calculate the narrowphase
     */
    narrowphase: number;
}
export interface GraphicsStatistics {
    drawCalls: number;
    drawnImages: number;
}
/**
 * Debug statistics and flags for Excalibur. If polling these values, it would be
 * best to do so on the `postupdate` event for [[Engine]], after all values have been
 * updated during a frame.
 */
export declare class Debug implements DebugFlags {
    private _engine;
    constructor(engine: Engine);
    /**
     * Switch the current excalibur clock with the [[TestClock]] and return
     * it in the same running state.
     *
     * This is useful when you need to debug frame by frame.
     */
    useTestClock(): TestClock;
    /**
     * Switch the current excalibur clock with the [[StandardClock]] and
     * return it in the same running state.
     *
     * This is useful when you need to switch back to normal mode after
     * debugging.
     */
    useStandardClock(): StandardClock;
    /**
     * Performance statistics
     */
    stats: DebugStats;
    /**
     * Correct or simulate color blindness using [[ColorBlindnessPostProcessor]].
     * @warning Will reduce FPS.
     */
    colorBlindMode: ColorBlindFlags;
    /**
     * Filter debug context to named entities or entity ids
     */
    filter: {
        useFilter: boolean;
        nameQuery: string;
        ids: number[];
    };
    /**
     * Entity debug settings
     */
    entity: {
        showAll: boolean;
        showId: boolean;
        showName: boolean;
    };
    /**
     * Transform component debug settings
     */
    transform: {
        showAll: boolean;
        showPosition: boolean;
        showPositionLabel: boolean;
        positionColor: Color;
        showZIndex: boolean;
        showScale: boolean;
        scaleColor: Color;
        showRotation: boolean;
        rotationColor: Color;
    };
    /**
     * Graphics component debug settings
     */
    graphics: {
        showAll: boolean;
        showBounds: boolean;
        boundsColor: Color;
    };
    /**
     * Collider component debug settings
     */
    collider: {
        showAll: boolean;
        showBounds: boolean;
        boundsColor: Color;
        showOwner: boolean;
        showGeometry: boolean;
        geometryColor: Color;
    };
    /**
     * Physics simulation debug settings
     */
    physics: {
        showAll: boolean;
        showBroadphaseSpacePartitionDebug: boolean;
        showCollisionNormals: boolean;
        collisionNormalColor: Color;
        showCollisionContacts: boolean;
        collisionContactColor: Color;
    };
    /**
     * Motion component debug settings
     */
    motion: {
        showAll: boolean;
        showVelocity: boolean;
        velocityColor: Color;
        showAcceleration: boolean;
        accelerationColor: Color;
    };
    /**
     * Body component debug settings
     */
    body: {
        showAll: boolean;
        showCollisionGroup: boolean;
        showCollisionType: boolean;
        showSleeping: boolean;
        showMotion: boolean;
        showMass: boolean;
    };
    /**
     * Camera debug settings
     */
    camera: {
        showAll: boolean;
        showFocus: boolean;
        focusColor: Color;
        showZoom: boolean;
    };
}
/**
 * Implementation of a frame's stats. Meant to have values copied via [[FrameStats.reset]], avoid
 * creating instances of this every frame.
 */
export declare class FrameStats implements FrameStatistics {
    private _id;
    private _delta;
    private _fps;
    private _actorStats;
    private _durationStats;
    private _physicsStats;
    private _graphicsStats;
    /**
     * Zero out values or clone other IFrameStat stats. Allows instance reuse.
     *
     * @param [otherStats] Optional stats to clone
     */
    reset(otherStats?: FrameStatistics): void;
    /**
     * Provides a clone of this instance.
     */
    clone(): FrameStats;
    /**
     * Gets the frame's id
     */
    get id(): number;
    /**
     * Sets the frame's id
     */
    set id(value: number);
    /**
     * Gets the frame's delta (time since last frame)
     */
    get delta(): number;
    /**
     * Sets the frame's delta (time since last frame). Internal use only.
     * @internal
     */
    set delta(value: number);
    /**
     * Gets the frame's frames-per-second (FPS)
     */
    get fps(): number;
    /**
     * Sets the frame's frames-per-second (FPS). Internal use only.
     * @internal
     */
    set fps(value: number);
    /**
     * Gets the frame's actor statistics
     */
    get actors(): FrameActorStats;
    /**
     * Gets the frame's duration statistics
     */
    get duration(): FrameDurationStats;
    /**
     * Gets the frame's physics statistics
     */
    get physics(): PhysicsStats;
    /**
     * Gets the frame's graphics statistics
     */
    get graphics(): GraphicsStatistics;
}
export declare class PhysicsStats implements PhysicsStatistics {
    private _pairs;
    private _collisions;
    private _contacts;
    private _fastBodies;
    private _fastBodyCollisions;
    private _broadphase;
    private _narrowphase;
    /**
     * Zero out values or clone other IPhysicsStats stats. Allows instance reuse.
     *
     * @param [otherStats] Optional stats to clone
     */
    reset(otherStats?: PhysicsStatistics): void;
    /**
     * Provides a clone of this instance.
     */
    clone(): PhysicsStatistics;
    get pairs(): number;
    set pairs(value: number);
    get collisions(): number;
    set collisions(value: number);
    get contacts(): Map<string, CollisionContact>;
    set contacts(contacts: Map<string, CollisionContact>);
    get fastBodies(): number;
    set fastBodies(value: number);
    get fastBodyCollisions(): number;
    set fastBodyCollisions(value: number);
    get broadphase(): number;
    set broadphase(value: number);
    get narrowphase(): number;
    set narrowphase(value: number);
}
