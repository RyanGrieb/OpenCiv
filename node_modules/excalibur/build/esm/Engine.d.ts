import { CanUpdate, CanDraw, CanInitialize } from './Interfaces/LifecycleEvents';
import { Loadable } from './Interfaces/Loadable';
import { Vector } from './Math/vector';
import { Screen, DisplayMode, ScreenDimension } from './Screen';
import { ScreenElement } from './ScreenElement';
import { Actor } from './Actor';
import { Timer } from './Timer';
import { TileMap } from './TileMap';
import { Loader } from './Loader';
import { VisibleEvent, HiddenEvent, GameStartEvent, GameStopEvent, PreUpdateEvent, PostUpdateEvent, PreFrameEvent, PostFrameEvent, GameEvent, PreDrawEvent, PostDrawEvent } from './Events';
import { Color } from './Color';
import { Scene } from './Scene';
import { Entity } from './EntityComponentSystem/Entity';
import { Debug, DebugStats } from './Debug/Debug';
import { Class } from './Class';
import * as Input from './Input/Index';
import * as Events from './Events';
import { BrowserEvents } from './Util/Browser';
import { ExcaliburGraphicsContext, ExcaliburGraphicsContext2DCanvas } from './Graphics';
import { Clock } from './Util/Clock';
/**
 * Enum representing the different mousewheel event bubble prevention
 */
export declare enum ScrollPreventionMode {
    /**
     * Do not prevent any page scrolling
     */
    None = 0,
    /**
     * Prevent page scroll if mouse is over the game canvas
     */
    Canvas = 1,
    /**
     * Prevent all page scrolling via mouse wheel
     */
    All = 2
}
/**
 * Defines the available options to configure the Excalibur engine at constructor time.
 */
export interface EngineOptions {
    /**
     * Optionally configure the width of the viewport in css pixels
     */
    width?: number;
    /**
     * Optionally configure the height of the viewport in css pixels
     */
    height?: number;
    /**
     * Optionally configure the width & height of the viewport in css pixels.
     * Use `viewport` instead of [[EngineOptions.width]] and [[EngineOptions.height]], or vice versa.
     */
    viewport?: ScreenDimension;
    /**
     * Optionally specify the size the logical pixel resolution, if not specified it will be width x height.
     * See [[Resolution]] for common presets.
     */
    resolution?: ScreenDimension;
    /**
     * Optionally specify antialiasing (smoothing), by default true (smooth pixels)
     *
     *  * `true` - useful for high resolution art work you would like smoothed, this also hints excalibur to load images
     * with [[ImageFiltering.Blended]]
     *
     *  * `false` - useful for pixel art style art work you would like sharp, this also hints excalibur to load images
     * with [[ImageFiltering.Pixel]]
     */
    antialiasing?: boolean;
    /**
     * Optionally upscale the number of pixels in the canvas. Normally only useful if you need a smoother look to your assets, especially
     * [[Text]].
     *
     * **WARNING** It is recommended you try using `antialiasing: true` before adjusting pixel ratio. Pixel ratio will consume more memory
     * and on mobile may break if the internal size of the canvas exceeds 4k pixels in width or height.
     *
     * Default is based the display's pixel ratio, for example a HiDPI screen might have the value 2;
     */
    pixelRatio?: number;
    /**
     * Optionally configure the native canvas transparent backdrop
     */
    enableCanvasTransparency?: boolean;
    /**
     * Optionally specify the target canvas DOM element to render the game in
     */
    canvasElementId?: string;
    /**
     * Optionally specify the target canvas DOM element directly
     */
    canvasElement?: HTMLCanvasElement;
    /**
     * Optionally snap graphics to nearest pixel, default is false
     */
    snapToPixel?: boolean;
    /**
     * The [[DisplayMode]] of the game, by default [[DisplayMode.FitScreen]] with aspect ratio 4:3 (800x600).
     * Depending on this value, [[width]] and [[height]] may be ignored.
     */
    displayMode?: DisplayMode;
    /**
     * Configures the pointer scope. Pointers scoped to the 'Canvas' can only fire events within the canvas viewport; whereas, 'Document'
     * (default) scoped will fire anywhere on the page.
     */
    pointerScope?: Input.PointerScope;
    /**
     * Suppress boot up console message, which contains the "powered by Excalibur message"
     */
    suppressConsoleBootMessage?: boolean;
    /**
     * Suppress minimum browser feature detection, it is not recommended users of excalibur switch this off. This feature ensures that
     * the currently running browser meets the minimum requirements for running excalibur. This can be useful if running on non-standard
     * browsers or if there is a bug in excalibur preventing execution.
     */
    suppressMinimumBrowserFeatureDetection?: boolean;
    /**
     * Suppress HiDPI auto detection and scaling, it is not recommended users of excalibur switch off this feature. This feature detects
     * and scales the drawing canvas appropriately to accommodate HiDPI screens.
     */
    suppressHiDPIScaling?: boolean;
    /**
     * Suppress play button, it is not recommended users of excalibur switch this feature. Some browsers require a user gesture (like a click)
     * for certain browser features to work like web audio.
     */
    suppressPlayButton?: boolean;
    /**
     * Scroll prevention method.
     */
    scrollPreventionMode?: ScrollPreventionMode;
    /**
     * Optionally set the background color
     */
    backgroundColor?: Color;
    /**
     * Optionally set the maximum fps if not set Excalibur will go as fast as the device allows.
     *
     * You may want to constrain max fps if your game cannot maintain fps consistently, it can look and feel better to have a 30fps game than
     * one that bounces between 30fps and 60fps
     */
    maxFps?: number;
    /**
     * Optionally configure a fixed update fps, this can be desireable if you need the physics simulation to be very stable. When set
     * the update step and physics will use the same elapsed time for each tick even if the graphical framerate drops. In order for the
     * simulation to be correct, excalibur will run multiple updates in a row (at the configured update elapsed) to catch up, for example
     * there could be X updates and 1 draw each clock step.
     *
     * **NOTE:** This does come at a potential perf cost because each catch-up update will need to be run if the fixed rate is greater than
     * the current instantaneous framerate, or perf gain if the fixed rate is less than the current framerate.
     *
     * By default is unset and updates will use the current instantaneous framerate with 1 update and 1 draw each clock step.
     */
    fixedUpdateFps?: number;
    /**
     * Default `true`, optionally configure excalibur to use optimal draw call sorting, to opt out set this to `false`.
     *
     * Excalibur will automatically sort draw calls by z and priority into renderer batches for maximal draw performance,
     * this can disrupt a specific desired painter order.
     */
    useDrawSorting?: boolean;
    /**
     * Optionally configure how excalibur handles poor performance on a player's browser
     */
    configurePerformanceCanvas2DFallback?: {
        /**
         * By default `true`, this will switch the internal graphics context to Canvas2D which can improve performance on non hardware
         * accelerated browsers.
         */
        allow: boolean;
        /**
         * By default `false`, if set to `true` a dialogue will be presented to the player about their browser and how to potentially
         * address any issues.
         */
        showPlayerMessage?: boolean;
        /**
         * Default `{ numberOfFrames: 100, fps: 20 }`, optionally configure excalibur to fallback to the 2D Canvas renderer
         * if bad performance is detected.
         *
         * In this example of the default if excalibur is running at 20fps or less for 100 frames it will trigger the fallback to the 2D
         * Canvas renderer.
         */
        threshold?: {
            numberOfFrames: number;
            fps: number;
        };
    };
}
/**
 * The Excalibur Engine
 *
 * The [[Engine]] is the main driver for a game. It is responsible for
 * starting/stopping the game, maintaining state, transmitting events,
 * loading resources, and managing the scene.
 */
export declare class Engine extends Class implements CanInitialize, CanUpdate, CanDraw {
    /**
     * Excalibur browser events abstraction used for wiring to native browser events safely
     */
    browser: BrowserEvents;
    /**
     * Screen abstraction
     */
    screen: Screen;
    /**
     * Direct access to the engine's canvas element
     */
    canvas: HTMLCanvasElement;
    /**
     * Direct access to the ExcaliburGraphicsContext used for drawing things to the screen
     */
    graphicsContext: ExcaliburGraphicsContext;
    /**
     * Direct access to the canvas element ID, if an ID exists
     */
    canvasElementId: string;
    /**
     * Optionally set the maximum fps if not set Excalibur will go as fast as the device allows.
     *
     * You may want to constrain max fps if your game cannot maintain fps consistently, it can look and feel better to have a 30fps game than
     * one that bounces between 30fps and 60fps
     */
    maxFps: number;
    /**
     * Optionally configure a fixed update fps, this can be desireable if you need the physics simulation to be very stable. When set
     * the update step and physics will use the same elapsed time for each tick even if the graphical framerate drops. In order for the
     * simulation to be correct, excalibur will run multiple updates in a row (at the configured update elapsed) to catch up, for example
     * there could be X updates and 1 draw each clock step.
     *
     * **NOTE:** This does come at a potential perf cost because each catch-up update will need to be run if the fixed rate is greater than
     * the current instantaneous framerate, or perf gain if the fixed rate is less than the current framerate.
     *
     * By default is unset and updates will use the current instantaneous framerate with 1 update and 1 draw each clock step.
     */
    fixedUpdateFps?: number;
    /**
     * Direct access to the excalibur clock
     */
    clock: Clock;
    /**
     * The width of the game canvas in pixels (physical width component of the
     * resolution of the canvas element)
     */
    get canvasWidth(): number;
    /**
     * Returns half width of the game canvas in pixels (half physical width component)
     */
    get halfCanvasWidth(): number;
    /**
     * The height of the game canvas in pixels, (physical height component of
     * the resolution of the canvas element)
     */
    get canvasHeight(): number;
    /**
     * Returns half height of the game canvas in pixels (half physical height component)
     */
    get halfCanvasHeight(): number;
    /**
     * Returns the width of the engine's visible drawing surface in pixels including zoom and device pixel ratio.
     */
    get drawWidth(): number;
    /**
     * Returns half the width of the engine's visible drawing surface in pixels including zoom and device pixel ratio.
     */
    get halfDrawWidth(): number;
    /**
     * Returns the height of the engine's visible drawing surface in pixels including zoom and device pixel ratio.
     */
    get drawHeight(): number;
    /**
     * Returns half the height of the engine's visible drawing surface in pixels including zoom and device pixel ratio.
     */
    get halfDrawHeight(): number;
    /**
     * Returns whether excalibur detects the current screen to be HiDPI
     */
    get isHiDpi(): boolean;
    /**
     * Access engine input like pointer, keyboard, or gamepad
     */
    input: Input.EngineInput;
    /**
     * Access Excalibur debugging functionality.
     *
     * Useful when you want to debug different aspects of built in engine features like
     *   * Transform
     *   * Graphics
     *   * Colliders
     */
    debug: Debug;
    /**
     * Access [[stats]] that holds frame statistics.
     */
    get stats(): DebugStats;
    /**
     * The current [[Scene]] being drawn and updated on screen
     */
    currentScene: Scene;
    /**
     * The default [[Scene]] of the game, use [[Engine.goToScene]] to transition to different scenes.
     */
    readonly rootScene: Scene;
    /**
     * Contains all the scenes currently registered with Excalibur
     */
    readonly scenes: {
        [key: string]: Scene;
    };
    /**
     * Indicates whether the engine is set to fullscreen or not
     */
    get isFullscreen(): boolean;
    /**
     * Indicates the current [[DisplayMode]] of the engine.
     */
    get displayMode(): DisplayMode;
    private _suppressPlayButton;
    /**
     * Returns the calculated pixel ration for use in rendering
     */
    get pixelRatio(): number;
    /**
     * Indicates whether audio should be paused when the game is no longer visible.
     */
    pauseAudioWhenHidden: boolean;
    /**
     * Indicates whether the engine should draw with debug information
     */
    private _isDebug;
    get isDebug(): boolean;
    /**
     * Sets the background color for the engine.
     */
    backgroundColor: Color;
    /**
     * Sets the Transparency for the engine.
     */
    enableCanvasTransparency: boolean;
    /**
     * Hints the graphics context to truncate fractional world space coordinates
     */
    get snapToPixel(): boolean;
    set snapToPixel(shouldSnapToPixel: boolean);
    /**
     * The action to take when a fatal exception is thrown
     */
    onFatalException: (e: any) => void;
    /**
     * The mouse wheel scroll prevention mode
     */
    pageScrollPreventionMode: ScrollPreventionMode;
    private _logger;
    private _toaster;
    private _compatible;
    private _timescale;
    private _loader;
    private _isInitialized;
    private _deferredGoTo;
    on(eventName: 'fallbackgraphicscontext', handler: (event: ExcaliburGraphicsContext2DCanvas) => void): void;
    on(eventName: Events.initialize, handler: (event: Events.InitializeEvent<Engine>) => void): void;
    on(eventName: Events.visible, handler: (event: VisibleEvent) => void): void;
    on(eventName: Events.hidden, handler: (event: HiddenEvent) => void): void;
    on(eventName: Events.start, handler: (event: GameStartEvent) => void): void;
    on(eventName: Events.stop, handler: (event: GameStopEvent) => void): void;
    on(eventName: Events.preupdate, handler: (event: PreUpdateEvent<Engine>) => void): void;
    on(eventName: Events.postupdate, handler: (event: PostUpdateEvent<Engine>) => void): void;
    on(eventName: Events.preframe, handler: (event: PreFrameEvent) => void): void;
    on(eventName: Events.postframe, handler: (event: PostFrameEvent) => void): void;
    on(eventName: Events.predraw, handler: (event: PreDrawEvent) => void): void;
    on(eventName: Events.postdraw, handler: (event: PostDrawEvent) => void): void;
    on(eventName: string, handler: (event: GameEvent<any>) => void): void;
    once(eventName: 'fallbackgraphicscontext', handler: (event: ExcaliburGraphicsContext2DCanvas) => void): void;
    once(eventName: Events.initialize, handler: (event: Events.InitializeEvent<Engine>) => void): void;
    once(eventName: Events.visible, handler: (event: VisibleEvent) => void): void;
    once(eventName: Events.hidden, handler: (event: HiddenEvent) => void): void;
    once(eventName: Events.start, handler: (event: GameStartEvent) => void): void;
    once(eventName: Events.stop, handler: (event: GameStopEvent) => void): void;
    once(eventName: Events.preupdate, handler: (event: PreUpdateEvent<Engine>) => void): void;
    once(eventName: Events.postupdate, handler: (event: PostUpdateEvent<Engine>) => void): void;
    once(eventName: Events.preframe, handler: (event: PreFrameEvent) => void): void;
    once(eventName: Events.postframe, handler: (event: PostFrameEvent) => void): void;
    once(eventName: Events.predraw, handler: (event: PreDrawEvent) => void): void;
    once(eventName: Events.postdraw, handler: (event: PostDrawEvent) => void): void;
    once(eventName: string, handler: (event: GameEvent<any>) => void): void;
    off(eventName: 'fallbackgraphicscontext', handler?: (event: ExcaliburGraphicsContext2DCanvas) => void): void;
    off(eventName: Events.initialize, handler?: (event: Events.InitializeEvent<Engine>) => void): void;
    off(eventName: Events.visible, handler?: (event: VisibleEvent) => void): void;
    off(eventName: Events.hidden, handler?: (event: HiddenEvent) => void): void;
    off(eventName: Events.start, handler?: (event: GameStartEvent) => void): void;
    off(eventName: Events.stop, handler?: (event: GameStopEvent) => void): void;
    off(eventName: Events.preupdate, handler?: (event: PreUpdateEvent<Engine>) => void): void;
    off(eventName: Events.postupdate, handler?: (event: PostUpdateEvent<Engine>) => void): void;
    off(eventName: Events.preframe, handler?: (event: PreFrameEvent) => void): void;
    off(eventName: Events.postframe, handler?: (event: PostFrameEvent) => void): void;
    off(eventName: Events.predraw, handler?: (event: PreDrawEvent) => void): void;
    off(eventName: Events.postdraw, handler?: (event: PostDrawEvent) => void): void;
    off(eventName: string, handler?: (event: GameEvent<any>) => void): void;
    /**
     * Default [[EngineOptions]]
     */
    private static _DEFAULT_ENGINE_OPTIONS;
    private _originalOptions;
    readonly _originalDisplayMode: DisplayMode;
    /**
     * Creates a new game using the given [[EngineOptions]]. By default, if no options are provided,
     * the game will be rendered full screen (taking up all available browser window space).
     * You can customize the game rendering through [[EngineOptions]].
     *
     * Example:
     *
     * ```js
     * var game = new ex.Engine({
     *   width: 0, // the width of the canvas
     *   height: 0, // the height of the canvas
     *   enableCanvasTransparency: true, // the transparencySection of the canvas
     *   canvasElementId: '', // the DOM canvas element ID, if you are providing your own
     *   displayMode: ex.DisplayMode.FullScreen, // the display mode
     *   pointerScope: ex.Input.PointerScope.Document, // the scope of capturing pointer (mouse/touch) events
     *   backgroundColor: ex.Color.fromHex('#2185d0') // background color of the engine
     * });
     *
     * // call game.start, which is a Promise
     * game.start().then(function () {
     *   // ready, set, go!
     * });
     * ```
     */
    constructor(options?: EngineOptions);
    private _performanceThresholdTriggered;
    private _fpsSamples;
    private _monitorPerformanceThresholdAndTriggerFallback;
    /**
     * Switches the engine's graphics context to the 2D Canvas.
     * @warning Some features of Excalibur will not work in this mode.
     */
    useCanvas2DFallback(): void;
    /**
     * Returns a BoundingBox of the top left corner of the screen
     * and the bottom right corner of the screen.
     */
    getWorldBounds(): import("./").BoundingBox;
    /**
     * Gets the current engine timescale factor (default is 1.0 which is 1:1 time)
     */
    get timescale(): number;
    /**
     * Sets the current engine timescale factor. Useful for creating slow-motion effects or fast-forward effects
     * when using time-based movement.
     */
    set timescale(value: number);
    /**
     * Adds a [[Timer]] to the [[currentScene]].
     * @param timer  The timer to add to the [[currentScene]].
     */
    addTimer(timer: Timer): Timer;
    /**
     * Removes a [[Timer]] from the [[currentScene]].
     * @param timer  The timer to remove to the [[currentScene]].
     */
    removeTimer(timer: Timer): Timer;
    /**
     * Adds a [[Scene]] to the engine, think of scenes in Excalibur as you
     * would levels or menus.
     *
     * @param key  The name of the scene, must be unique
     * @param scene The scene to add to the engine
     */
    addScene(key: string, scene: Scene): void;
    /**
     * Removes a [[Scene]] instance from the engine
     * @param scene  The scene to remove
     */
    removeScene(scene: Scene): void;
    /**
     * Removes a scene from the engine by key
     * @param key  The scene key to remove
     */
    removeScene(key: string): void;
    /**
     * Adds a [[Scene]] to the engine, think of scenes in Excalibur as you
     * would levels or menus.
     * @param sceneKey  The key of the scene, must be unique
     * @param scene     The scene to add to the engine
     */
    add(sceneKey: string, scene: Scene): void;
    /**
     * Adds a [[Timer]] to the [[currentScene]].
     * @param timer  The timer to add to the [[currentScene]].
     */
    add(timer: Timer): void;
    /**
     * Adds a [[TileMap]] to the [[currentScene]], once this is done the TileMap
     * will be drawn and updated.
     */
    add(tileMap: TileMap): void;
    /**
     * Adds an actor to the [[currentScene]] of the game. This is synonymous
     * to calling `engine.currentScene.add(actor)`.
     *
     * Actors can only be drawn if they are a member of a scene, and only
     * the [[currentScene]] may be drawn or updated.
     *
     * @param actor  The actor to add to the [[currentScene]]
     */
    add(actor: Actor): void;
    add(entity: Entity): void;
    /**
     * Adds a [[ScreenElement]] to the [[currentScene]] of the game,
     * ScreenElements do not participate in collisions, instead the
     * remain in the same place on the screen.
     * @param screenElement  The ScreenElement to add to the [[currentScene]]
     */
    add(screenElement: ScreenElement): void;
    /**
     * Removes a scene instance from the engine
     * @param scene  The scene to remove
     */
    remove(scene: Scene): void;
    /**
     * Removes a scene from the engine by key
     * @param sceneKey  The scene to remove
     */
    remove(sceneKey: string): void;
    /**
     * Removes a [[Timer]] from the [[currentScene]].
     * @param timer  The timer to remove to the [[currentScene]].
     */
    remove(timer: Timer): void;
    /**
     * Removes a [[TileMap]] from the [[currentScene]], it will no longer be drawn or updated.
     */
    remove(tileMap: TileMap): void;
    /**
     * Removes an actor from the [[currentScene]] of the game. This is synonymous
     * to calling `engine.currentScene.removeChild(actor)`.
     * Actors that are removed from a scene will no longer be drawn or updated.
     *
     * @param actor  The actor to remove from the [[currentScene]].
     */
    remove(actor: Actor): void;
    /**
     * Removes a [[ScreenElement]] to the scene, it will no longer be drawn or updated
     * @param screenElement  The ScreenElement to remove from the [[currentScene]]
     */
    remove(screenElement: ScreenElement): void;
    /**
     * Changes the currently updating and drawing scene to a different,
     * named scene. Calls the [[Scene]] lifecycle events.
     * @param key  The key of the scene to transition to.
     * @param data Optional data to send to the scene's onActivate method
     */
    goToScene<TData = undefined>(key: string, data?: TData): void;
    /**
     * Transforms the current x, y from screen coordinates to world coordinates
     * @param point  Screen coordinate to convert
     */
    screenToWorldCoordinates(point: Vector): Vector;
    /**
     * Transforms a world coordinate, to a screen coordinate
     * @param point  World coordinate to convert
     */
    worldToScreenCoordinates(point: Vector): Vector;
    /**
     * Initializes the internal canvas, rendering context, display mode, and native event listeners
     */
    private _initialize;
    onInitialize(_engine: Engine): void;
    /**
     * If supported by the browser, this will set the antialiasing flag on the
     * canvas. Set this to `false` if you want a 'jagged' pixel art look to your
     * image resources.
     * @param isSmooth  Set smoothing to true or false
     */
    setAntialiasing(isSmooth: boolean): void;
    /**
     * Return the current smoothing status of the canvas
     */
    getAntialiasing(): boolean;
    /**
     * Gets whether the actor is Initialized
     */
    get isInitialized(): boolean;
    private _overrideInitialize;
    /**
     * Updates the entire state of the game
     * @param delta  Number of milliseconds elapsed since the last update.
     */
    private _update;
    /**
     * @internal
     */
    _preupdate(delta: number): void;
    onPreUpdate(_engine: Engine, _delta: number): void;
    /**
     * @internal
     */
    _postupdate(delta: number): void;
    onPostUpdate(_engine: Engine, _delta: number): void;
    /**
     * Draws the entire game
     * @param delta  Number of milliseconds elapsed since the last draw.
     */
    private _draw;
    /**
     * @internal
     */
    _predraw(_ctx: ExcaliburGraphicsContext, delta: number): void;
    onPreDraw(_ctx: ExcaliburGraphicsContext, _delta: number): void;
    /**
     * @internal
     */
    _postdraw(_ctx: ExcaliburGraphicsContext, delta: number): void;
    onPostDraw(_ctx: ExcaliburGraphicsContext, _delta: number): void;
    /**
     * Enable or disable Excalibur debugging functionality.
     * @param toggle a value that debug drawing will be changed to
     */
    showDebug(toggle: boolean): void;
    /**
     * Toggle Excalibur debugging functionality.
     */
    toggleDebug(): boolean;
    private _loadingComplete;
    /**
     * Returns true when loading is totally complete and the player has clicked start
     */
    get loadingComplete(): boolean;
    private _isReady;
    get ready(): boolean;
    private _isReadyResolve;
    private _isReadyPromise;
    isReady(): Promise<void>;
    /**
     * Starts the internal game loop for Excalibur after loading
     * any provided assets.
     * @param loader  Optional [[Loader]] to use to load resources. The default loader is [[Loader]], override to provide your own
     * custom loader.
     *
     * Note: start() only resolves AFTER the user has clicked the play button
     */
    start(loader?: Loader): Promise<void>;
    /**
     * Returns the current frames elapsed milliseconds
     */
    currentFrameElapsedMs: number;
    /**
     * Returns the current frame lag when in fixed update mode
     */
    currentFrameLagMs: number;
    private _lagMs;
    private _mainloop;
    /**
     * Stops Excalibur's main loop, useful for pausing the game.
     */
    stop(): void;
    /**
     * Returns the Engine's running status, Useful for checking whether engine is running or paused.
     */
    isRunning(): boolean;
    private _screenShotRequests;
    /**
     * Takes a screen shot of the current viewport and returns it as an
     * HTML Image Element.
     * @param preserveHiDPIResolution in the case of HiDPI return the full scaled backing image, by default false
     */
    screenshot(preserveHiDPIResolution?: boolean): Promise<HTMLImageElement>;
    private _checkForScreenShots;
    /**
     * Another option available to you to load resources into the game.
     * Immediately after calling this the game will pause and the loading screen
     * will appear.
     * @param loader  Some [[Loadable]] such as a [[Loader]] collection, [[Sound]], or [[Texture]].
     */
    load(loader: Loadable<any>): Promise<void>;
}
