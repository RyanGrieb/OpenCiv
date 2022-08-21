import { Scene } from './Scene';
import * as ex from './index';
export interface TimerOptions {
    repeats?: boolean;
    numberOfRepeats?: number;
    fcn?: () => void;
    interval: number;
    randomRange?: [number, number];
    random?: ex.Random;
}
/**
 * The Excalibur timer hooks into the internal timer and fires callbacks,
 * after a certain interval, optionally repeating.
 */
export declare class Timer {
    private _logger;
    private static _MAX_ID;
    id: number;
    private _elapsedTime;
    private _totalTimeAlive;
    private _running;
    private _numberOfTicks;
    private _callbacks;
    interval: number;
    repeats: boolean;
    maxNumberOfRepeats: number;
    randomRange: [number, number];
    random: ex.Random;
    private _baseInterval;
    private _generateRandomInterval;
    private _complete;
    get complete(): boolean;
    scene: Scene;
    /**
     * @param options    Options - repeats, numberOfRepeats, fcn, interval
     * @param repeats    Indicates whether this call back should be fired only once, or repeat after every interval as completed.
     * @param numberOfRepeats Specifies a maximum number of times that this timer will execute.
     * @param fcn        The callback to be fired after the interval is complete.
     * @param randomRange Indicates a range to select a random number to be added onto the interval
     */
    constructor(options: TimerOptions);
    /**
     * Adds a new callback to be fired after the interval is complete
     * @param fcn The callback to be added to the callback list, to be fired after the interval is complete.
     */
    on(fcn: () => void): void;
    /**
     * Removes a callback from the callback list to be fired after the interval is complete.
     * @param fcn The callback to be removed from the callback list, to be fired after the interval is complete.
     */
    off(fcn: () => void): void;
    /**
     * Updates the timer after a certain number of milliseconds have elapsed. This is used internally by the engine.
     * @param delta  Number of elapsed milliseconds since the last update.
     */
    update(delta: number): void;
    /**
     * Resets the timer so that it can be reused, and optionally reconfigure the timers interval.
     *
     * Warning** you may need to call `timer.start()` again if the timer had completed
     * @param newInterval If specified, sets a new non-negative interval in milliseconds to refire the callback
     * @param newNumberOfRepeats If specified, sets a new non-negative upper limit to the number of time this timer executes
     */
    reset(newInterval?: number, newNumberOfRepeats?: number): void;
    get timesRepeated(): number;
    getTimeRunning(): number;
    /**
     * @returns milliseconds until the next action callback, if complete will return 0
     */
    get timeToNextAction(): number;
    /**
     * @returns milliseconds elapsed toward the next action
     */
    get timeElapsedTowardNextAction(): number;
    get isRunning(): boolean;
    /**
     * Pauses the timer, time will no longer increment towards the next call
     */
    pause(): Timer;
    /**
     * Resumes the timer, time will now increment towards the next call.
     */
    resume(): Timer;
    /**
     * Starts the timer, if the timer was complete it will restart the timer and reset the elapsed time counter
     */
    start(): Timer;
    /**
     * Stops the timer and resets the elapsed time counter towards the next action invocation
     */
    stop(): Timer;
    /**
     * Cancels the timer, preventing any further executions.
     */
    cancel(): void;
}
