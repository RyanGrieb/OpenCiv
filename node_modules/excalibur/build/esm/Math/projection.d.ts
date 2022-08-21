/**
 * A 1 dimensional projection on an axis, used to test overlaps
 */
export declare class Projection {
    min: number;
    max: number;
    constructor(min: number, max: number);
    overlaps(projection: Projection): boolean;
    getOverlap(projection: Projection): number;
}
