import { Vector } from '../Math/vector';
import { ExcaliburGraphicsContext } from './Context/ExcaliburGraphicsContext';
import { BoundingBox } from '../Collision/BoundingBox';
import { Color } from '../Color';
import { AffineMatrix } from '../Math/affine-matrix';
export interface GraphicOptions {
    /**
     * The width of the graphic
     */
    width?: number;
    /**
     * The height of the graphic
     */
    height?: number;
    /**
     * Should the graphic be flipped horizontally
     */
    flipHorizontal?: boolean;
    /**
     * Should the graphic be flipped vertically
     */
    flipVertical?: boolean;
    /**
     * The rotation of the graphic
     */
    rotation?: number;
    /**
     * The scale of the graphic
     */
    scale?: Vector;
    /**
     * The opacity of the graphic
     */
    opacity?: number;
    /**
     * The tint of the graphic, this color will be multiplied by the original pixel colors
     */
    tint?: Color;
    /**
     * The origin of the drawing in pixels to use when applying transforms, by default it will be the center of the image
     */
    origin?: Vector;
}
/**
 * A Graphic is the base Excalibur primitive for something that can be drawn to the [[ExcaliburGraphicsContext]].
 * [[Sprite]], [[Animation]], [[GraphicsGroup]], [[Canvas]], [[Rectangle]], [[Circle]], and [[Polygon]] all derive from the
 * [[Graphic]] abstract class.
 *
 * Implementors of a Graphic must override the abstract [[Graphic._drawImage]] method to render an image to the graphics context. Graphic
 * handles all the position, rotation, and scale transformations in [[Graphic._preDraw]] and [[Graphic._postDraw]]
 */
export declare abstract class Graphic {
    private static _ID;
    readonly id: number;
    transform: AffineMatrix;
    tint: Color;
    private _transformStale;
    isStale(): boolean;
    /**
     * Gets or sets wether to show debug information about the graphic
     */
    showDebug: boolean;
    private _flipHorizontal;
    /**
     * Gets or sets the flipHorizontal, which will flip the graphic horizontally (across the y axis)
     */
    get flipHorizontal(): boolean;
    set flipHorizontal(value: boolean);
    private _flipVertical;
    /**
     * Gets or sets the flipVertical, which will flip the graphic vertically (across the x axis)
     */
    get flipVertical(): boolean;
    set flipVertical(value: boolean);
    private _rotation;
    /**
     * Gets or sets the rotation of the graphic
     */
    get rotation(): number;
    set rotation(value: number);
    /**
     * Gets or sets the opacity of the graphic, 0 is transparent, 1 is solid (opaque).
     */
    opacity: number;
    private _scale;
    /**
     * Gets or sets the scale of the graphic, this affects the width and
     */
    get scale(): Vector;
    set scale(value: Vector);
    private _origin;
    /**
     * Gets or sets the origin of the graphic, if not set the center of the graphic is the origin
     */
    get origin(): Vector | null;
    set origin(value: Vector | null);
    constructor(options?: GraphicOptions);
    cloneGraphicOptions(): GraphicOptions;
    private _width;
    /**
     * Gets or sets the width of the graphic (always positive)
     */
    get width(): number;
    private _height;
    /**
     * Gets or sets the height of the graphic (always positive)
     */
    get height(): number;
    set width(value: number);
    set height(value: number);
    /**
     * Gets a copy of the bounds in pixels occupied by the graphic on the the screen. This includes scale.
     */
    get localBounds(): BoundingBox;
    /**
     * Draw the whole graphic to the context including transform
     * @param ex The excalibur graphics context
     * @param x
     * @param y
     */
    draw(ex: ExcaliburGraphicsContext, x: number, y: number): void;
    /**
     * Meant to be overridden by the graphic implementation to draw the underlying image (HTMLCanvasElement or HTMLImageElement)
     * to the graphics context without transform. Transformations like position, rotation, and scale are handled by [[Graphic._preDraw]]
     * and [[Graphic._postDraw]]
     * @param ex The excalibur graphics context
     * @param x
     * @param y
     */
    protected abstract _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void;
    /**
     * Apply affine transformations to the graphics context to manipulate the graphic before [[Graphic._drawImage]]
     * @param ex
     * @param x
     * @param y
     */
    protected _preDraw(ex: ExcaliburGraphicsContext, x: number, y: number): void;
    protected _rotate(ex: ExcaliburGraphicsContext | AffineMatrix): void;
    protected _flip(ex: ExcaliburGraphicsContext | AffineMatrix): void;
    /**
     * Apply any additional work after [[Graphic._drawImage]] and restore the context state.
     * @param ex
     */
    protected _postDraw(ex: ExcaliburGraphicsContext): void;
    /**
     * Returns a new instance of the graphic that has the same properties
     */
    abstract clone(): Graphic;
}
