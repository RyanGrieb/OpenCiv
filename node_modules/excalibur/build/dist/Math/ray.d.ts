import { LineSegment } from './line-segment';
import { Vector } from './vector';
/**
 * A 2D ray that can be cast into the scene to do collision detection
 */
export declare class Ray {
    pos: Vector;
    dir: Vector;
    /**
     * @param pos The starting position for the ray
     * @param dir The vector indicating the direction of the ray
     */
    constructor(pos: Vector, dir: Vector);
    /**
     * Tests a whether this ray intersects with a line segment. Returns a number greater than or equal to 0 on success.
     * This number indicates the mathematical intersection time.
     * @param line  The line to test
     */
    intersect(line: LineSegment): number;
    intersectPoint(line: LineSegment): Vector;
    /**
     * Returns the point of intersection given the intersection time
     */
    getPoint(time: number): Vector;
}
