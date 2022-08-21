import { Vector } from '../Math/vector';
import { Ray } from '../Math/ray';
import { Color } from '../Color';
import { Side } from './Side';
import { ExcaliburGraphicsContext } from '../Graphics/Context/ExcaliburGraphicsContext';
import { AffineMatrix } from '../Math/affine-matrix';
export interface BoundingBoxOptions {
    left: number;
    right: number;
    top: number;
    bottom: number;
}
/**
 * Axis Aligned collision primitive for Excalibur.
 */
export declare class BoundingBox {
    top: number;
    right: number;
    bottom: number;
    left: number;
    /**
     * Constructor allows passing of either an object with all coordinate components,
     * or the coordinate components passed separately.
     * @param leftOrOptions    Either x coordinate of the left edge or an options object
     * containing the four coordinate components.
     * @param top     y coordinate of the top edge
     * @param right   x coordinate of the right edge
     * @param bottom  y coordinate of the bottom edge
     */
    constructor(leftOrOptions?: number | BoundingBoxOptions, top?: number, right?: number, bottom?: number);
    /**
     * Returns a new instance of [[BoundingBox]] that is a copy of the current instance
     */
    clone(): BoundingBox;
    /**
     * Given bounding box A & B, returns the side relative to A when intersection is performed.
     * @param intersection Intersection vector between 2 bounding boxes
     */
    static getSideFromIntersection(intersection: Vector): Side;
    static fromPoints(points: Vector[]): BoundingBox;
    static fromDimension(width: number, height: number, anchor?: Vector, pos?: Vector): BoundingBox;
    /**
     * Returns the calculated width of the bounding box
     */
    get width(): number;
    /**
     * Returns the calculated height of the bounding box
     */
    get height(): number;
    /**
     * Return whether the bounding box has zero dimensions in height,width or both
     */
    hasZeroDimensions(): boolean;
    /**
     * Returns the center of the bounding box
     */
    get center(): Vector;
    translate(pos: Vector): BoundingBox;
    /**
     * Rotates a bounding box by and angle and around a point, if no point is specified (0, 0) is used by default. The resulting bounding
     * box is also axis-align. This is useful when a new axis-aligned bounding box is needed for rotated geometry.
     */
    rotate(angle: number, point?: Vector): BoundingBox;
    /**
     * Scale a bounding box by a scale factor, optionally provide a point
     * @param scale
     * @param point
     */
    scale(scale: Vector, point?: Vector): BoundingBox;
    /**
     * Transform the axis aligned bounding box by a [[Matrix]], producing a new axis aligned bounding box
     * @param matrix
     */
    transform(matrix: AffineMatrix): BoundingBox;
    /**
     * Returns the perimeter of the bounding box
     */
    getPerimeter(): number;
    getPoints(): Vector[];
    /**
     * Determines whether a ray intersects with a bounding box
     */
    rayCast(ray: Ray, farClipDistance?: number): boolean;
    rayCastTime(ray: Ray, farClipDistance?: number): number;
    /**
     * Tests whether a point is contained within the bounding box
     * @param p  The point to test
     */
    contains(p: Vector): boolean;
    /**
     * Tests whether another bounding box is totally contained in this one
     * @param bb  The bounding box to test
     */
    contains(bb: BoundingBox): boolean;
    /**
     * Combines this bounding box and another together returning a new bounding box
     * @param other  The bounding box to combine
     */
    combine(other: BoundingBox): BoundingBox;
    get dimensions(): Vector;
    /**
     * Returns true if the bounding boxes overlap.
     * @param other
     * @param epsilon Optionally specify a small epsilon (default 0) as amount of overlap to ignore as overlap.
     * This epsilon is useful in stable collision simulations.
     */
    overlaps(other: BoundingBox, epsilon?: number): boolean;
    /**
     * Test wether this bounding box intersects with another returning
     * the intersection vector that can be used to resolve the collision. If there
     * is no intersection null is returned.
     *
     * @param other  Other [[BoundingBox]] to test intersection with
     * @returns A Vector in the direction of the current BoundingBox, this <- other
     */
    intersect(other: BoundingBox): Vector;
    /**
     * Test whether the bounding box has intersected with another bounding box, returns the side of the current bb that intersected.
     * @param bb The other actor to test
     */
    intersectWithSide(bb: BoundingBox): Side;
    /**
     * Draw a debug bounding box
     * @param ex
     * @param color
     */
    draw(ex: ExcaliburGraphicsContext, color?: Color): void;
}
