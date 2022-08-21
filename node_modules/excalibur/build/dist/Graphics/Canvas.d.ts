import { GraphicOptions } from './Graphic';
import { Raster, RasterOptions } from './Raster';
export interface CanvasOptions {
    draw?: (ctx: CanvasRenderingContext2D) => void;
    cache?: boolean;
}
/**
 * A canvas [[Graphic]] to provide an adapter between the 2D Canvas API and the [[ExcaliburGraphicsContext]].
 *
 * The [[Canvas]] works by re-rastering a draw handler to a HTMLCanvasElement for every draw which is then passed
 * to the [[ExcaliburGraphicsContext]] implementation as a rendered image.
 *
 * **Low performance API**
 */
export declare class Canvas extends Raster {
    private _options;
    /**
     * Return the 2D graphics context of this canvas
     */
    get ctx(): CanvasRenderingContext2D;
    constructor(_options: GraphicOptions & RasterOptions & CanvasOptions);
    clone(): Canvas;
    execute(ctx: CanvasRenderingContext2D): void;
}
