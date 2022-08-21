import { ExcaliburGraphicsContext, LineGraphicsOptions, PointGraphicsOptions, ExcaliburGraphicsContextOptions, DebugDraw, HTMLImageSource } from './ExcaliburGraphicsContext';
import { Vector } from '../../Math/vector';
import { Color } from '../../Color';
import { ScreenDimension } from '../../Screen';
import { PostProcessor } from '../PostProcessor/PostProcessor';
import { AffineMatrix } from '../../Math/affine-matrix';
declare class ExcaliburGraphicsContext2DCanvasDebug implements DebugDraw {
    private _ex;
    private _debugText;
    constructor(_ex: ExcaliburGraphicsContext2DCanvas);
    /**
     * Draw a debug rectangle to the context
     * @param x
     * @param y
     * @param width
     * @param height
     */
    drawRect(x: number, y: number, width: number, height: number): void;
    drawLine(start: Vector, end: Vector, lineOptions?: LineGraphicsOptions): void;
    drawPoint(point: Vector, pointOptions?: PointGraphicsOptions): void;
    drawText(text: string, pos: Vector): void;
}
export declare class ExcaliburGraphicsContext2DCanvas implements ExcaliburGraphicsContext {
    /**
     * Meant for internal use only. Access the internal context at your own risk and no guarantees this will exist in the future.
     * @internal
     */
    __ctx: CanvasRenderingContext2D;
    get width(): number;
    get height(): number;
    /**
     * Unused in Canvas implementation
     */
    readonly useDrawSorting: boolean;
    /**
     * Unused in Canvas implementation
     */
    z: number;
    backgroundColor: Color;
    private _state;
    get opacity(): number;
    set opacity(value: number);
    get tint(): Color;
    set tint(color: Color);
    snapToPixel: boolean;
    get smoothing(): boolean;
    set smoothing(value: boolean);
    constructor(options: ExcaliburGraphicsContextOptions);
    resetTransform(): void;
    updateViewport(_resolution: ScreenDimension): void;
    /**
     * Draw an image to the Excalibur Graphics context at an x and y coordinate using the images width and height
     */
    drawImage(image: HTMLImageSource, x: number, y: number): void;
    /**
     *
     * Draw an image to the Excalibur Graphics context at an x and y coordinate with a specific width and height
     */
    drawImage(image: HTMLImageSource, x: number, y: number, width: number, height: number): void;
    /**
     *
     * Draw an image to the Excalibur Graphics context specifying the source image coordinates (sx, sy, swidth, sheight)
     * and to a specific destination on the context (dx, dy, dwidth, dheight)
     */
    drawImage(image: HTMLImageSource, sx: number, sy: number, swidth?: number, sheight?: number, dx?: number, dy?: number, dwidth?: number, dheight?: number): void;
    drawLine(start: Vector, end: Vector, color: Color, thickness?: number): void;
    drawRectangle(pos: Vector, width: number, height: number, color: Color): void;
    drawCircle(pos: Vector, radius: number, color: Color, stroke?: Color, thickness?: number): void;
    debug: ExcaliburGraphicsContext2DCanvasDebug;
    /**
     * Save the current state of the canvas to the stack (transforms and opacity)
     */
    save(): void;
    /**
     * Restore the state of the canvas from the stack
     */
    restore(): void;
    /**
     * Translate the origin of the context by an x and y
     * @param x
     * @param y
     */
    translate(x: number, y: number): void;
    /**
     * Rotate the context about the current origin
     */
    rotate(angle: number): void;
    /**
     * Scale the context by an x and y factor
     * @param x
     * @param y
     */
    scale(x: number, y: number): void;
    getTransform(): AffineMatrix;
    multiply(_m: AffineMatrix): void;
    addPostProcessor(_postprocessor: PostProcessor): void;
    removePostProcessor(_postprocessor: PostProcessor): void;
    clearPostProcessors(): void;
    beginDrawLifecycle(): void;
    endDrawLifecycle(): void;
    clear(): void;
    /**
     * Flushes the batched draw calls to the screen
     */
    flush(): void;
}
export {};
