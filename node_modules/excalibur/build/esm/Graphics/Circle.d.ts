import { Raster, RasterOptions } from './Raster';
export interface CircleOptions {
    radius: number;
}
/**
 * A circle [[Graphic]] for drawing circles to the [[ExcaliburGraphicsContext]]
 *
 * Circles default to [[ImageFiltering.Blended]]
 */
export declare class Circle extends Raster {
    private _radius;
    get radius(): number;
    set radius(value: number);
    constructor(options: RasterOptions & CircleOptions);
    clone(): Circle;
    execute(ctx: CanvasRenderingContext2D): void;
}
