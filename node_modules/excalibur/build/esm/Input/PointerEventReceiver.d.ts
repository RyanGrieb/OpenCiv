import { Class } from '../Class';
import { Engine } from '../Engine';
import { GlobalCoordinates } from '../Math/global-coordinates';
import { Vector } from '../Math/vector';
import { PointerEvent } from './PointerEvent';
import { WheelEvent } from './WheelEvent';
import { PointerAbstraction } from './PointerAbstraction';
export declare type NativePointerEvent = globalThis.PointerEvent;
export declare type NativeMouseEvent = globalThis.MouseEvent;
export declare type NativeTouchEvent = globalThis.TouchEvent;
export declare type NativeWheelEvent = globalThis.WheelEvent;
/**
 * The PointerEventProcessor is responsible for collecting all the events from the canvas and transforming them into GlobalCoordinates
 */
export declare class PointerEventReceiver extends Class {
    readonly target: GlobalEventHandlers & EventTarget;
    engine: Engine;
    primary: PointerAbstraction;
    private _activeNativePointerIdsToNormalized;
    lastFramePointerCoords: Map<number, GlobalCoordinates>;
    currentFramePointerCoords: Map<number, GlobalCoordinates>;
    currentFramePointerDown: Map<number, boolean>;
    lastFramePointerDown: Map<number, boolean>;
    currentFrameDown: PointerEvent[];
    currentFrameUp: PointerEvent[];
    currentFrameMove: PointerEvent[];
    currentFrameCancel: PointerEvent[];
    currentFrameWheel: WheelEvent[];
    constructor(target: GlobalEventHandlers & EventTarget, engine: Engine);
    /**
     * Creates a new PointerEventReceiver with a new target and engine while preserving existing pointer event
     * handlers.
     * @param target
     * @param engine
     */
    recreate(target: GlobalEventHandlers & EventTarget, engine: Engine): PointerEventReceiver;
    private _pointers;
    /**
     * Locates a specific pointer by id, creates it if it doesn't exist
     * @param index
     */
    at(index: number): PointerAbstraction;
    /**
     * The number of pointers currently being tracked by excalibur
     */
    count(): number;
    /**
     * Is the specified pointer id down this frame
     * @param pointerId
     */
    isDown(pointerId: number): boolean;
    /**
     * Was the specified pointer id down last frame
     * @param pointerId
     */
    wasDown(pointerId: number): boolean;
    /**
     * Whether the Pointer is currently dragging.
     */
    isDragging(pointerId: number): boolean;
    /**
     * Whether the Pointer just started dragging.
     */
    isDragStart(pointerId: number): boolean;
    /**
     * Whether the Pointer just ended dragging.
     */
    isDragEnd(pointerId: number): boolean;
    on(event: 'move', handler: (event: PointerEvent) => void): void;
    on(event: 'down', handler: (event: PointerEvent) => void): void;
    on(event: 'up', handler: (event: PointerEvent) => void): void;
    on(event: 'wheel', handler: (event: WheelEvent) => void): void;
    once(event: 'move', handler: (event: PointerEvent) => void): void;
    once(event: 'down', handler: (event: PointerEvent) => void): void;
    once(event: 'up', handler: (event: PointerEvent) => void): void;
    once(event: 'wheel', handler: (event: WheelEvent) => void): void;
    off(event: 'move', handler?: (event: PointerEvent) => void): void;
    off(event: 'down', handler?: (event: PointerEvent) => void): void;
    off(event: 'up', handler?: (event: PointerEvent) => void): void;
    off(event: 'wheel', handler?: (event: WheelEvent) => void): void;
    /**
     * Called internally by excalibur
     *
     * Updates the current frame pointer info and emits raw pointer events
     *
     * This does not emit events to entities, see PointerSystem
     */
    update(): void;
    /**
     * Clears the current frame event and pointer data
     */
    clear(): void;
    private _boundHandle;
    private _boundWheel;
    /**
     * Initializes the pointer event receiver so that it can start listening to native
     * browser events.
     */
    init(): void;
    detach(): void;
    /**
     * Take native pointer id and map it to index in active pointers
     * @param nativePointerId
     */
    private _normalizePointerId;
    /**
     * Responsible for handling and parsing pointer events
     */
    private _handle;
    private _handleWheel;
    /**
     * Triggers an excalibur pointer event in a world space pos
     *
     * Useful for testing pointers in excalibur
     * @param type
     * @param pos
     */
    triggerEvent(type: 'down' | 'up' | 'move' | 'cancel', pos: Vector): void;
    private _nativeButtonToPointerButton;
    private _stringToPointerType;
}
