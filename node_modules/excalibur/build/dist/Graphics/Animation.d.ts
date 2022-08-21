import { Graphic, GraphicOptions } from './Graphic';
import { ExcaliburGraphicsContext } from './Context/ExcaliburGraphicsContext';
import { EventDispatcher } from '../EventDispatcher';
import { SpriteSheet } from './SpriteSheet';
export interface HasTick {
    /**
     *
     * @param elapsedMilliseconds The amount of real world time in milliseconds that has elapsed that must be updated in the animation
     * @param idempotencyToken Optional idempotencyToken prevents a ticking animation from updating twice per frame
     */
    tick(elapsedMilliseconds: number, idempotencyToken?: number): void;
}
export declare enum AnimationDirection {
    /**
     * Animation is playing forwards
     */
    Forward = "forward",
    /**
     * Animation is play backwards
     */
    Backward = "backward"
}
export declare enum AnimationStrategy {
    /**
     * Animation ends without displaying anything
     */
    End = "end",
    /**
     * Animation loops to the first frame after the last frame
     */
    Loop = "loop",
    /**
     * Animation plays to the last frame, then backwards to the first frame, then repeats
     */
    PingPong = "pingpong",
    /**
     * Animation ends stopping on the last frame
     */
    Freeze = "freeze"
}
/**
 * Frame of animation
 */
export interface Frame {
    /**
     * Optionally specify a graphic to show, no graphic shows an empty frame
     */
    graphic?: Graphic;
    /**
     * Optionally specify the number of ms the frame should be visible, overrides the animation duration (default 100 ms)
     */
    duration?: number;
}
/**
 * Animation options for building an animation via constructor.
 */
export interface AnimationOptions {
    /**
     * List of frames in the order you wish to play them
     */
    frames: Frame[];
    /**
     * Optionally reverse the direction of play
     */
    reverse?: boolean;
    /**
     * Optionally specify a default frame duration in ms (Default is 1000)
     */
    frameDuration?: number;
    /**
     * Optionally specify a total duration of the animation in ms to calculate each frame's duration
     */
    totalDuration?: number;
    /**
     * Optionally specify the [[AnimationStrategy]] for the Animation
     */
    strategy?: AnimationStrategy;
}
export declare type AnimationEvents = {
    frame: Frame;
    loop: Animation;
    ended: Animation;
};
/**
 * Create an Animation given a list of [[Frame|frames]] in [[AnimationOptions]]
 *
 * To create an Animation from a [[SpriteSheet]], use [[Animation.fromSpriteSheet]]
 */
export declare class Animation extends Graphic implements HasTick {
    private static _LOGGER;
    events: EventDispatcher<any>;
    frames: Frame[];
    strategy: AnimationStrategy;
    frameDuration: number;
    timeScale: number;
    private _idempotencyToken;
    private _firstTick;
    private _currentFrame;
    private _timeLeftInFrame;
    private _direction;
    private _done;
    private _playing;
    constructor(options: GraphicOptions & AnimationOptions);
    clone(): Animation;
    get width(): number;
    get height(): number;
    /**
     * Create an Animation from a [[SpriteSheet]], a list of indices into the sprite sheet, a duration per frame
     * and optional [[AnimationStrategy]]
     *
     * Example:
     * ```typescript
     * const spriteSheet = SpriteSheet.fromImageSource({...});
     *
     * const anim = Animation.fromSpriteSheet(spriteSheet, range(0, 5), 200, AnimationStrategy.Loop);
     * ```
     *
     * @param spriteSheet
     * @param frameIndices
     * @param durationPerFrameMs
     * @param strategy
     */
    static fromSpriteSheet(spriteSheet: SpriteSheet, frameIndices: number[], durationPerFrameMs: number, strategy?: AnimationStrategy): Animation;
    /**
     * Returns the current Frame of the animation
     */
    get currentFrame(): Frame | null;
    /**
     * Returns the current frame index of the animation
     */
    get currentFrameIndex(): number;
    /**
     * Returns `true` if the animation is playing
     */
    get isPlaying(): boolean;
    private _reversed;
    /**
     * Reverses the play direction of the Animation, this preserves the current frame
     */
    reverse(): void;
    /**
     * Returns the current play direction of the animation
     */
    get direction(): AnimationDirection;
    /**
     * Plays or resumes the animation from the current frame
     */
    play(): void;
    /**
     * Pauses the animation on the current frame
     */
    pause(): void;
    /**
     * Reset the animation back to the beginning, including if the animation were done
     */
    reset(): void;
    /**
     * Returns `true` if the animation can end
     */
    get canFinish(): boolean;
    /**
     * Returns `true` if the animation is done, for looping type animations
     * `ex.AnimationStrategy.PingPong` and `ex.AnimationStrategy.Loop` this will always return `false`
     *
     * See the `ex.Animation.canFinish()` method to know if an animation type can end
     */
    get done(): boolean;
    /**
     * Jump the animation immediately to a specific frame if it exists
     * @param frameNumber
     */
    goToFrame(frameNumber: number): void;
    private _nextFrame;
    /**
     * Called internally by Excalibur to update the state of the animation potential update the current frame
     * @param elapsedMilliseconds Milliseconds elapsed
     * @param idempotencyToken Prevents double ticking in a frame by passing a unique token to the frame
     */
    tick(elapsedMilliseconds: number, idempotencyToken?: number): void;
    protected _drawImage(ctx: ExcaliburGraphicsContext, x: number, y: number): void;
}
