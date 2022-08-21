import { Raster, RasterOptions } from './Raster';
export interface RectangleOptions {
    width: number;
    height: number;
}
/**
 * A Rectangle [[Graphic]] for drawing rectangles to the [[ExcaliburGraphicsContext]]
 */
export declare class Rectangle extends Raster {
    constructor(options: RasterOptions & RectangleOptions);
    clone(): Rectangle;
    execute(ctx: CanvasRenderingContext2D): void;
}
