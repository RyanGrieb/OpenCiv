import { Class } from '../Class';
import { Vector } from '../Math/vector';
import { WheelEvent } from './WheelEvent';
import { PointerEvent } from './PointerEvent';
export declare class PointerAbstraction extends Class {
    /**
     * The last position on the document this pointer was at. Can be `null` if pointer was never active.
     */
    lastPagePos: Vector;
    /**
     * The last position on the screen this pointer was at. Can be `null` if pointer was never active.
     */
    lastScreenPos: Vector;
    /**
     * The last position in the game world coordinates this pointer was at. Can be `null` if pointer was never active.
     */
    lastWorldPos: Vector;
    constructor();
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
    private _onPointerMove;
    private _onPointerDown;
}
