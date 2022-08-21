import { Vector } from '../Math/vector';
import { Raster, RasterOptions } from './Raster';
export interface PolygonOptions {
    points: Vector[];
}
/**
 * A polygon [[Graphic]] for drawing arbitrary polygons to the [[ExcaliburGraphicsContext]]
 *
 * Polygons default to [[ImageFiltering.Blended]]
 */
export declare class Polygon extends Raster {
    private _points;
    get points(): Vector[];
    set points(points: Vector[]);
    get minPoint(): Vector;
    constructor(options: RasterOptions & PolygonOptions);
    clone(): Polygon;
    execute(ctx: CanvasRenderingContext2D): void;
}
