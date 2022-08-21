import { Engine } from './Engine';
import { EasingFunction } from './Util/EasingFunctions';
import { Vector } from './Math/vector';
import { Actor } from './Actor';
import { CanUpdate, CanInitialize } from './Interfaces/LifecycleEvents';
import { PreUpdateEvent, PostUpdateEvent, GameEvent, InitializeEvent } from './Events';
import { Class } from './Class';
import { BoundingBox } from './Collision/BoundingBox';
import { ExcaliburGraphicsContext } from './Graphics/Context/ExcaliburGraphicsContext';
import { AffineMatrix } from './Math/affine-matrix';
/**
 * Interface that describes a custom camera strategy for tracking targets
 */
export interface CameraStrategy<T> {
    /**
     * Target of the camera strategy that will be passed to the action
     */
    target: T;
    /**
     * Camera strategies perform an action to calculate a new focus returned out of the strategy
     * @param target The target object to apply this camera strategy (if any)
     * @param camera The current camera implementation in excalibur running the game
     * @param engine The current engine running the game
     * @param delta The elapsed time in milliseconds since the last frame
     */
    action: (target: T, camera: Camera, engine: Engine, delta: number) => Vector;
}
/**
 * Container to house convenience strategy methods
 * @internal
 */
export declare class StrategyContainer {
    camera: Camera;
    constructor(camera: Camera);
    /**
     * Creates and adds the [[LockCameraToActorStrategy]] on the current camera.
     * @param actor The actor to lock the camera to
     */
    lockToActor(actor: Actor): void;
    /**
     * Creates and adds the [[LockCameraToActorAxisStrategy]] on the current camera
     * @param actor The actor to lock the camera to
     * @param axis The axis to follow the actor on
     */
    lockToActorAxis(actor: Actor, axis: Axis): void;
    /**
     * Creates and adds the [[ElasticToActorStrategy]] on the current camera
     * If cameraElasticity < cameraFriction < 1.0, the behavior will be a dampened spring that will slowly end at the target without bouncing
     * If cameraFriction < cameraElasticity < 1.0, the behavior will be an oscillating spring that will over
     * correct and bounce around the target
     *
     * @param actor Target actor to elastically follow
     * @param cameraElasticity [0 - 1.0] The higher the elasticity the more force that will drive the camera towards the target
     * @param cameraFriction [0 - 1.0] The higher the friction the more that the camera will resist motion towards the target
     */
    elasticToActor(actor: Actor, cameraElasticity: number, cameraFriction: number): void;
    /**
     * Creates and adds the [[RadiusAroundActorStrategy]] on the current camera
     * @param actor Target actor to follow when it is "radius" pixels away
     * @param radius Number of pixels away before the camera will follow
     */
    radiusAroundActor(actor: Actor, radius: number): void;
    /**
     * Creates and adds the [[LimitCameraBoundsStrategy]] on the current camera
     * @param box The bounding box to limit the camera to.
     */
    limitCameraBounds(box: BoundingBox): void;
}
/**
 * Camera axis enum
 */
export declare enum Axis {
    X = 0,
    Y = 1
}
/**
 * Lock a camera to the exact x/y position of an actor.
 */
export declare class LockCameraToActorStrategy implements CameraStrategy<Actor> {
    target: Actor;
    constructor(target: Actor);
    action: (target: Actor, _cam: Camera, _eng: Engine, _delta: number) => Vector;
}
/**
 * Lock a camera to a specific axis around an actor.
 */
export declare class LockCameraToActorAxisStrategy implements CameraStrategy<Actor> {
    target: Actor;
    axis: Axis;
    constructor(target: Actor, axis: Axis);
    action: (target: Actor, cam: Camera, _eng: Engine, _delta: number) => Vector;
}
/**
 * Using [Hook's law](https://en.wikipedia.org/wiki/Hooke's_law), elastically move the camera towards the target actor.
 */
export declare class ElasticToActorStrategy implements CameraStrategy<Actor> {
    target: Actor;
    cameraElasticity: number;
    cameraFriction: number;
    /**
     * If cameraElasticity < cameraFriction < 1.0, the behavior will be a dampened spring that will slowly end at the target without bouncing
     * If cameraFriction < cameraElasticity < 1.0, the behavior will be an oscillating spring that will over
     * correct and bounce around the target
     *
     * @param target Target actor to elastically follow
     * @param cameraElasticity [0 - 1.0] The higher the elasticity the more force that will drive the camera towards the target
     * @param cameraFriction [0 - 1.0] The higher the friction the more that the camera will resist motion towards the target
     */
    constructor(target: Actor, cameraElasticity: number, cameraFriction: number);
    action: (target: Actor, cam: Camera, _eng: Engine, _delta: number) => Vector;
}
export declare class RadiusAroundActorStrategy implements CameraStrategy<Actor> {
    target: Actor;
    radius: number;
    /**
     *
     * @param target Target actor to follow when it is "radius" pixels away
     * @param radius Number of pixels away before the camera will follow
     */
    constructor(target: Actor, radius: number);
    action: (target: Actor, cam: Camera, _eng: Engine, _delta: number) => Vector;
}
/**
 * Prevent a camera from going beyond the given camera dimensions.
 */
export declare class LimitCameraBoundsStrategy implements CameraStrategy<BoundingBox> {
    target: BoundingBox;
    /**
     * Useful for limiting the camera to a [[TileMap]]'s dimensions, or a specific area inside the map.
     *
     * Note that this strategy does not perform any movement by itself.
     * It only sets the camera position to within the given bounds when the camera has gone beyond them.
     * Thus, it is a good idea to combine it with other camera strategies and set this strategy as the last one.
     *
     * Make sure that the camera bounds are at least as large as the viewport size.
     *
     * @param target The bounding box to limit the camera to
     */
    boundSizeChecked: boolean;
    constructor(target: BoundingBox);
    action: (target: BoundingBox, cam: Camera, _eng: Engine, _delta: number) => Vector;
}
/**
 * Cameras
 *
 * [[Camera]] is the base class for all Excalibur cameras. Cameras are used
 * to move around your game and set focus. They are used to determine
 * what is "off screen" and can be used to scale the game.
 *
 */
export declare class Camera extends Class implements CanUpdate, CanInitialize {
    transform: AffineMatrix;
    inverse: AffineMatrix;
    protected _follow: Actor;
    private _cameraStrategies;
    strategy: StrategyContainer;
    /**
     * Get or set current zoom of the camera, defaults to 1
     */
    private _z;
    get zoom(): number;
    set zoom(val: number);
    /**
     * Get or set rate of change in zoom, defaults to 0
     */
    dz: number;
    /**
     * Get or set zoom acceleration
     */
    az: number;
    /**
     * Current rotation of the camera
     */
    rotation: number;
    private _angularVelocity;
    /**
     * Get or set the camera's angular velocity
     */
    get angularVelocity(): number;
    set angularVelocity(value: number);
    /**
     * Get or set the camera's position
     */
    private _posChanged;
    private _pos;
    get pos(): Vector;
    set pos(vec: Vector);
    /**
     * Get or set the camera's velocity
     */
    vel: Vector;
    /**
     * Get or set the camera's acceleration
     */
    acc: Vector;
    private _cameraMoving;
    private _currentLerpTime;
    private _lerpDuration;
    private _lerpStart;
    private _lerpEnd;
    private _lerpResolve;
    private _lerpPromise;
    protected _isShaking: boolean;
    private _shakeMagnitudeX;
    private _shakeMagnitudeY;
    private _shakeDuration;
    private _elapsedShakeTime;
    private _xShake;
    private _yShake;
    protected _isZooming: boolean;
    private _zoomStart;
    private _zoomEnd;
    private _currentZoomTime;
    private _zoomDuration;
    private _zoomResolve;
    private _zoomPromise;
    private _zoomEasing;
    private _easing;
    private _halfWidth;
    private _halfHeight;
    /**
     * Get the camera's x position
     */
    get x(): number;
    /**
     * Set the camera's x position (cannot be set when following an [[Actor]] or when moving)
     */
    set x(value: number);
    /**
     * Get the camera's y position
     */
    get y(): number;
    /**
     * Set the camera's y position (cannot be set when following an [[Actor]] or when moving)
     */
    set y(value: number);
    /**
     * Get or set the camera's x velocity
     */
    get dx(): number;
    set dx(value: number);
    /**
     * Get or set the camera's y velocity
     */
    get dy(): number;
    set dy(value: number);
    /**
     * Get or set the camera's x acceleration
     */
    get ax(): number;
    set ax(value: number);
    /**
     * Get or set the camera's y acceleration
     */
    get ay(): number;
    set ay(value: number);
    /**
     * Returns the focal point of the camera, a new point giving the x and y position of the camera
     */
    getFocus(): Vector;
    /**
     * This moves the camera focal point to the specified position using specified easing function. Cannot move when following an Actor.
     *
     * @param pos The target position to move to
     * @param duration The duration in milliseconds the move should last
     * @param [easingFn] An optional easing function ([[ex.EasingFunctions.EaseInOutCubic]] by default)
     * @returns A [[Promise]] that resolves when movement is finished, including if it's interrupted.
     *          The [[Promise]] value is the [[Vector]] of the target position. It will be rejected if a move cannot be made.
     */
    move(pos: Vector, duration: number, easingFn?: EasingFunction): Promise<Vector>;
    /**
     * Sets the camera to shake at the specified magnitudes for the specified duration
     * @param magnitudeX  The x magnitude of the shake
     * @param magnitudeY  The y magnitude of the shake
     * @param duration    The duration of the shake in milliseconds
     */
    shake(magnitudeX: number, magnitudeY: number, duration: number): void;
    /**
     * Zooms the camera in or out by the specified scale over the specified duration.
     * If no duration is specified, it take effect immediately.
     * @param scale    The scale of the zoom
     * @param duration The duration of the zoom in milliseconds
     */
    zoomOverTime(scale: number, duration?: number, easingFn?: EasingFunction): Promise<boolean>;
    private _viewport;
    /**
     * Gets the bounding box of the viewport of this camera in world coordinates
     */
    get viewport(): BoundingBox;
    /**
     * Adds a new camera strategy to this camera
     * @param cameraStrategy Instance of an [[CameraStrategy]]
     */
    addStrategy<T>(cameraStrategy: CameraStrategy<T>): void;
    /**
     * Removes a camera strategy by reference
     * @param cameraStrategy Instance of an [[CameraStrategy]]
     */
    removeStrategy<T>(cameraStrategy: CameraStrategy<T>): void;
    /**
     * Clears all camera strategies from the camera
     */
    clearAllStrategies(): void;
    /**
     * It is not recommended that internal excalibur methods be overridden, do so at your own risk.
     *
     * Internal _preupdate handler for [[onPreUpdate]] lifecycle event
     * @internal
     */
    _preupdate(engine: Engine, delta: number): void;
    /**
     * Safe to override onPreUpdate lifecycle event handler. Synonymous with `.on('preupdate', (evt) =>{...})`
     *
     * `onPreUpdate` is called directly before a scene is updated.
     */
    onPreUpdate(_engine: Engine, _delta: number): void;
    /**
     *  It is not recommended that internal excalibur methods be overridden, do so at your own risk.
     *
     * Internal _preupdate handler for [[onPostUpdate]] lifecycle event
     * @internal
     */
    _postupdate(engine: Engine, delta: number): void;
    /**
     * Safe to override onPostUpdate lifecycle event handler. Synonymous with `.on('preupdate', (evt) =>{...})`
     *
     * `onPostUpdate` is called directly after a scene is updated.
     */
    onPostUpdate(_engine: Engine, _delta: number): void;
    private _engine;
    private _screen;
    private _isInitialized;
    get isInitialized(): boolean;
    _initialize(_engine: Engine): void;
    /**
     * Safe to override onPostUpdate lifecycle event handler. Synonymous with `.on('preupdate', (evt) =>{...})`
     *
     * `onPostUpdate` is called directly after a scene is updated.
     */
    onInitialize(_engine: Engine): void;
    on(eventName: 'initialize', handler: (event: InitializeEvent) => void): void;
    on(eventName: 'preupdate', handler: (event: PreUpdateEvent) => void): void;
    on(eventName: 'postupdate', handler: (event: PostUpdateEvent) => void): void;
    off(eventName: 'initialize', handler?: (event: InitializeEvent) => void): void;
    off(eventName: 'preupdate', handler?: (event: PreUpdateEvent) => void): void;
    off(eventName: 'postupdate', handler?: (event: PostUpdateEvent) => void): void;
    off(eventName: string, handler: (event: GameEvent<Camera>) => void): void;
    once(eventName: 'initialize', handler: (event: InitializeEvent) => void): void;
    once(eventName: 'preupdate', handler: (event: PreUpdateEvent) => void): void;
    once(eventName: 'postupdate', handler: (event: PostUpdateEvent) => void): void;
    once(eventName: string, handler: (event: GameEvent<Camera>) => void): void;
    runStrategies(engine: Engine, delta: number): void;
    updateViewport(): void;
    update(_engine: Engine, delta: number): void;
    /**
     * Applies the relevant transformations to the game canvas to "move" or apply effects to the Camera
     * @param ctx Canvas context to apply transformations
     */
    draw(ctx: ExcaliburGraphicsContext): void;
    updateTransform(): void;
    private _isDoneShaking;
}
