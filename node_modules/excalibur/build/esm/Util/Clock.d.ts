import { FpsSampler } from './Fps';
export interface ClockOptions {
    /**
     * Define the function you'd like the clock to tick when it is started
     */
    tick: (elapsedMs: number) => any;
    /**
     * Optionally define the fatal exception handler, used if an error is thrown in tick
     */
    onFatalException?: (e: unknown) => any;
    /**
     * Optionally limit the maximum FPS of the clock
     */
    maxFps?: number;
}
/**
 * Abstract Clock is the base type of all Clocks
 *
 * It has a few opinions
 * 1. It manages the calculation of what "elapsed" time means and thus maximum fps
 * 2. The default timing api is implemented in now()
 *
 * To implement your own clock, extend Clock and override start/stop to start and stop the clock, then call update() with whatever
 * method is unique to your clock implementation.
 */
export declare abstract class Clock {
    protected tick: (elapsedMs: number) => any;
    private _onFatalException;
    private _maxFps;
    private _lastTime;
    fpsSampler: FpsSampler;
    private _options;
    private _elapsed;
    private _scheduledCbs;
    private _totalElapsed;
    constructor(options: ClockOptions);
    /**
     * Get the elapsed time for the last completed frame
     */
    elapsed(): number;
    /**
     * Get the current time in milliseconds
     */
    now(): number;
    toTestClock(): TestClock;
    toStandardClock(): StandardClock;
    setFatalExceptionHandler(handler: (e: unknown) => any): void;
    /**
     * Schedule a callback to fire given a timeout in milliseconds using the excalibur [[Clock]]
     *
     * This is useful to use over the built in browser `setTimeout` because callbacks will be tied to the
     * excalibur update clock, instead of browser time, this means that callbacks wont fire if the game is
     * stopped or paused.
     *
     * @param cb callback to fire
     * @param timeoutMs Optionally specify a timeout in milliseconds from now, default is 0ms which means the next possible tick
     */
    schedule(cb: () => any, timeoutMs?: number): void;
    private _runScheduledCbs;
    protected update(overrideUpdateMs?: number): void;
    /**
     * Returns if the clock is currently running
     */
    abstract isRunning(): boolean;
    /**
     * Start the clock, it will then periodically call the tick(elapsedMilliseconds) since the last tick
     */
    abstract start(): void;
    /**
     * Stop the clock, tick() is no longer called
     */
    abstract stop(): void;
}
/**
 * The [[StandardClock]] implements the requestAnimationFrame browser api to run the tick()
 */
export declare class StandardClock extends Clock {
    private _running;
    private _requestId;
    constructor(options: ClockOptions);
    isRunning(): boolean;
    start(): void;
    stop(): void;
}
export interface TestClockOptions {
    /**
     * Specify the update milliseconds to use for each manual step()
     */
    defaultUpdateMs: number;
}
/**
 * The TestClock is meant for debugging interactions in excalibur that require precise timing to replicate or test
 */
export declare class TestClock extends Clock {
    private _logger;
    private _updateMs;
    private _running;
    private _currentTime;
    constructor(options: ClockOptions & TestClockOptions);
    /**
     * Get the current time in milliseconds
     */
    now(): number;
    isRunning(): boolean;
    start(): void;
    stop(): void;
    /**
     * Manually step the clock forward 1 tick, optionally specify an elapsed time in milliseconds
     * @param overrideUpdateMs
     */
    step(overrideUpdateMs?: number): void;
    /**
     * Run a number of steps that tick the clock, optionally specify an elapsed time in milliseconds
     * @param numberOfSteps
     * @param overrideUpdateMs
     */
    run(numberOfSteps: number, overrideUpdateMs?: number): void;
}
