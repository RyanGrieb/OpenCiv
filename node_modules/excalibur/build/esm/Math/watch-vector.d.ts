import { Vector } from './vector';
/**
 * Wraps a vector and watches for changes in the x/y, modifies the original vector.
 */
export declare class WatchVector extends Vector {
    original: Vector;
    change: (x: number, y: number) => any;
    constructor(original: Vector, change: (x: number, y: number) => any);
    get x(): number;
    set x(newX: number);
    get y(): number;
    set y(newY: number);
}
