import { ExcaliburGraphicsContext, LineGraphicsOptions, RectGraphicsOptions, PointGraphicsOptions, ExcaliburGraphicsContextOptions, DebugDraw, HTMLImageSource } from './ExcaliburGraphicsContext';
import { Matrix } from '../../Math/matrix';
import { TransformStack } from './transform-stack';
import { Vector } from '../../Math/vector';
import { Color } from '../../Color';
import { StateStack } from './state-stack';
import { ScreenDimension } from '../../Screen';
import { PostProcessor } from '../PostProcessor/PostProcessor';
import { RendererPlugin } from './renderer';
import { AffineMatrix } from '../../Math/affine-matrix';
export declare const pixelSnapEpsilon = 0.0001;
declare class ExcaliburGraphicsContextWebGLDebug implements DebugDraw {
    private _webglCtx;
    private _debugText;
    constructor(_webglCtx: ExcaliburGraphicsContextWebGL);
    /**
     * Draw a debugging rectangle to the context
     * @param x
     * @param y
     * @param width
     * @param height
     */
    drawRect(x: number, y: number, width: number, height: number, rectOptions?: RectGraphicsOptions): void;
    /**
     * Draw a debugging line to the context
     * @param start
     * @param end
     * @param lineOptions
     */
    drawLine(start: Vector, end: Vector, lineOptions?: LineGraphicsOptions): void;
    /**
     * Draw a debugging point to the context
     * @param point
     * @param pointOptions
     */
    drawPoint(point: Vector, pointOptions?: PointGraphicsOptions): void;
    drawText(text: string, pos: Vector): void;
}
export interface WebGLGraphicsContextInfo {
    transform: TransformStack;
    state: StateStack;
    ortho: Matrix;
    context: ExcaliburGraphicsContextWebGL;
}
export declare class ExcaliburGraphicsContextWebGL implements ExcaliburGraphicsContext {
    private _logger;
    private _renderers;
    private _isDrawLifecycle;
    useDrawSorting: boolean;
    private _drawCallPool;
    private _drawCalls;
    private _renderTarget;
    private _postProcessTargets;
    private _screenRenderer;
    private _postprocessors;
    /**
     * Meant for internal use only. Access the internal context at your own risk and no guarantees this will exist in the future.
     * @internal
     */
    __gl: WebGL2RenderingContext;
    private _transform;
    private _state;
    private _ortho;
    snapToPixel: boolean;
    smoothing: boolean;
    backgroundColor: Color;
    get z(): number;
    set z(value: number);
    get opacity(): number;
    set opacity(value: number);
    get tint(): Color;
    set tint(color: Color);
    get width(): number;
    get height(): number;
    get ortho(): Matrix;
    /**
     * Checks the underlying webgl implementation if the requested internal resolution is supported
     * @param dim
     */
    checkIfResolutionSupported(dim: ScreenDimension): boolean;
    constructor(options: ExcaliburGraphicsContextOptions);
    private _init;
    register<T extends RendererPlugin>(renderer: T): void;
    get(rendererName: string): RendererPlugin;
    private _currentRenderer;
    private _isCurrentRenderer;
    beginDrawLifecycle(): void;
    endDrawLifecycle(): void;
    private _alreadyWarnedDrawLifecycle;
    draw<TRenderer extends RendererPlugin>(rendererName: TRenderer['type'], ...args: Parameters<TRenderer['draw']>): void;
    resetTransform(): void;
    updateViewport(resolution: ScreenDimension): void;
    drawImage(image: HTMLImageSource, x: number, y: number): void;
    drawImage(image: HTMLImageSource, x: number, y: number, width: number, height: number): void;
    drawImage(image: HTMLImageSource, sx: number, sy: number, swidth?: number, sheight?: number, dx?: number, dy?: number, dwidth?: number, dheight?: number): void;
    drawLine(start: Vector, end: Vector, color: Color, thickness?: number): void;
    drawRectangle(pos: Vector, width: number, height: number, color: Color, stroke?: Color, strokeThickness?: number): void;
    drawCircle(pos: Vector, radius: number, color: Color, stroke?: Color, thickness?: number): void;
    debug: ExcaliburGraphicsContextWebGLDebug;
    save(): void;
    restore(): void;
    translate(x: number, y: number): void;
    rotate(angle: number): void;
    scale(x: number, y: number): void;
    transform(matrix: AffineMatrix): void;
    getTransform(): AffineMatrix;
    multiply(m: AffineMatrix): void;
    addPostProcessor(postprocessor: PostProcessor): void;
    removePostProcessor(postprocessor: PostProcessor): void;
    clearPostProcessors(): void;
    clear(): void;
    /**
     * Flushes all batched rendering to the screen
     */
    flush(): void;
}
export {};
