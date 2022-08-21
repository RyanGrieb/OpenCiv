import { Vector } from './vector';
/**
 * A 2D line segment
 */
export declare class LineSegment {
    readonly begin: Vector;
    readonly end: Vector;
    /**
     * @param begin  The starting point of the line segment
     * @param end  The ending point of the line segment
     */
    constructor(begin: Vector, end: Vector);
    /**
     * Gets the raw slope (m) of the line. Will return (+/-)Infinity for vertical lines.
     */
    get slope(): number;
    /**
     * Gets the Y-intercept (b) of the line. Will return (+/-)Infinity if there is no intercept.
     */
    get intercept(): number;
    private _normal;
    /**
     * Gets the normal of the line
     */
    normal(): Vector;
    private _dir;
    dir(): Vector;
    getPoints(): Vector[];
    private _slope;
    /**
     * Returns the slope of the line in the form of a vector of length 1
     */
    getSlope(): Vector;
    /**
     * Returns the edge of the line as vector, the length of the vector is the length of the edge
     */
    getEdge(): Vector;
    private _length;
    /**
     * Returns the length of the line segment in pixels
     */
    getLength(): number;
    /**
     * Returns the midpoint of the edge
     */
    get midpoint(): Vector;
    /**
     * Flips the direction of the line segment
     */
    flip(): LineSegment;
    /**
     * Tests if a given point is below the line, points in the normal direction above the line are considered above.
     * @param point
     */
    below(point: Vector): boolean;
    /**
     * Returns the clip point
     * @param sideVector Vector that traces the line
     * @param length Length to clip along side
     */
    clip(sideVector: Vector, length: number): LineSegment;
    /**
     * Find the perpendicular distance from the line to a point
     * https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line
     * @param point
     */
    distanceToPoint(point: Vector, signed?: boolean): number;
    /**
     * Find the perpendicular line from the line to a point
     * https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line
     * (a - p) - ((a - p) * n)n
     * a is a point on the line
     * p is the arbitrary point above the line
     * n is a unit vector in direction of the line
     * @param point
     */
    findVectorToPoint(point: Vector): Vector;
    /**
     * Finds a point on the line given only an X or a Y value. Given an X value, the function returns
     * a new point with the calculated Y value and vice-versa.
     *
     * @param x The known X value of the target point
     * @param y The known Y value of the target point
     * @returns A new point with the other calculated axis value
     */
    findPoint(x?: number, y?: number): Vector;
    /**
     * Whether or not the given point lies on this line. This method is precise by default
     * meaning the point must lie exactly on the line. Adjust threshold to
     * loosen the strictness of the check for floating-point calculations.
     */
    hasPoint(x: number, y: number, threshold?: number): boolean;
    /**
     * Whether or not the given point lies on this line. This method is precise by default
     * meaning the point must lie exactly on the line. Adjust threshold to
     * loosen the strictness of the check for floating-point calculations.
     */
    hasPoint(v: Vector, threshold?: number): boolean;
}
