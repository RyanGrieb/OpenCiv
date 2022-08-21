import { Graphic, GraphicOptions } from './Graphic';
import { ExcaliburGraphicsContext } from './Context/ExcaliburGraphicsContext';
import { Color } from '../Color';
import { BoundingBox } from '../Collision/BoundingBox';
import { ImageFiltering } from './Filtering';
export interface RasterOptions {
    /**
     * Optionally specify a quality number, which is how much to scale the internal Raster. Default is 1.
     *
     * For example if the quality is set to 2, it doubles the internal raster bitmap in memory.
     *
     * Adjusting this value can be useful if you are working with small rasters.
     */
    quality?: number;
    /**
     * Optionally specify "smoothing" if you want antialiasing to apply to the raster's bitmap context, by default `false`
     */
    smoothing?: boolean;
    /**
     * Optionally specify the color of the raster's bitmap context, by default [[Color.Black]]
     */
    color?: Color;
    /**
     * Optionally specify the stroke color of the raster's bitmap context, by default undefined
     */
    strokeColor?: Color;
    /**
     * Optionally specify the line width of the raster's bitmap, by default 1 pixel
     */
    lineWidth?: number;
    /**
     * Optionally specify the line dash of the raster's bitmap, by default `[]` which means none
     */
    lineDash?: number[];
    /**
     * Optionally specify the line end style, default is "butt".
     */
    lineCap?: 'butt' | 'round' | 'square';
    /**
     * Optionally specify the padding to apply to the bitmap
     */
    padding?: number;
    /**
     * Optionally specify what image filtering mode should be used, [[ImageFiltering.Pixel]] for pixel art,
     * [[ImageFiltering.Blended]] for hi-res art
     *
     * By default unset, rasters defer to the engine antialiasing setting
     */
    filtering?: ImageFiltering;
}
/**
 * A Raster is a Graphic that needs to be first painted to a HTMLCanvasElement before it can be drawn to the
 * [[ExcaliburGraphicsContext]]. This is useful for generating custom images using the 2D canvas api.
 *
 * Implementors must implement the [[Raster.execute]] method to rasterize their drawing.
 */
export declare abstract class Raster extends Graphic {
    filtering: ImageFiltering;
    lineCap: 'butt' | 'round' | 'square';
    quality: number;
    _bitmap: HTMLCanvasElement;
    protected _ctx: CanvasRenderingContext2D;
    private _dirty;
    constructor(options?: GraphicOptions & RasterOptions);
    cloneRasterOptions(): RasterOptions;
    /**
     * Gets whether the graphic is dirty, this means there are changes that haven't been re-rasterized
     */
    get dirty(): boolean;
    /**
     * Flags the graphic as dirty, meaning it must be re-rasterized before draw.
     * This should be called any time the graphics state changes such that it affects the outputted drawing
     */
    flagDirty(): void;
    private _originalWidth;
    /**
     * Gets or sets the current width of the Raster graphic. Setting the width will cause the raster
     * to be flagged dirty causing a re-raster on the next draw.
     *
     * Any `padding`s or `quality` set will be factored into the width
     */
    get width(): number;
    set width(value: number);
    private _originalHeight;
    /**
     * Gets or sets the current height of the Raster graphic. Setting the height will cause the raster
     * to be flagged dirty causing a re-raster on the next draw.
     *
     * Any `padding` or `quality` set will be factored into the height
     */
    get height(): number;
    set height(value: number);
    private _getTotalWidth;
    private _getTotalHeight;
    /**
     * Returns the local bounds of the Raster including the padding
     */
    get localBounds(): BoundingBox;
    private _smoothing;
    /**
     * Gets or sets the smoothing (anti-aliasing of the graphic). Setting the height will cause the raster
     * to be flagged dirty causing a re-raster on the next draw.
     */
    get smoothing(): boolean;
    set smoothing(value: boolean);
    private _color;
    /**
     * Gets or sets the fillStyle of the Raster graphic. Setting the fillStyle will cause the raster to be
     * flagged dirty causing a re-raster on the next draw.
     */
    get color(): Color;
    set color(value: Color);
    private _strokeColor;
    /**
     * Gets or sets the strokeStyle of the Raster graphic. Setting the strokeStyle will cause the raster to be
     * flagged dirty causing a re-raster on the next draw.
     */
    get strokeColor(): Color;
    set strokeColor(value: Color);
    private _lineWidth;
    /**
     * Gets or sets the line width of the Raster graphic. Setting the lineWidth will cause the raster to be
     * flagged dirty causing a re-raster on the next draw.
     */
    get lineWidth(): number;
    set lineWidth(value: number);
    private _lineDash;
    get lineDash(): number[];
    set lineDash(value: number[]);
    private _padding;
    get padding(): number;
    set padding(value: number);
    /**
     * Rasterize the graphic to a bitmap making it usable as in excalibur. Rasterize is called automatically if
     * the graphic is [[Raster.dirty]] on the next [[Graphic.draw]] call
     */
    rasterize(): void;
    protected _applyRasterProperties(ctx: CanvasRenderingContext2D): void;
    protected _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void;
    /**
     * Executes drawing implementation of the graphic, this is where the specific drawing code for the graphic
     * should be implemented. Once `rasterize()` the graphic can be drawn to the [[ExcaliburGraphicsContext]] via `draw(...)`
     * @param ctx Canvas to draw the graphic to
     */
    abstract execute(ctx: CanvasRenderingContext2D): void;
}
