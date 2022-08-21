import { BoundingBox } from '../BoundingBox';
import { CollisionContact } from '../Detection/CollisionContact';
import { Projection } from '../../Math/projection';
import { LineSegment } from '../../Math/line-segment';
import { Vector } from '../../Math/vector';
import { Ray } from '../../Math/ray';
import { Color } from '../../Color';
import { Collider } from './Collider';
import { ExcaliburGraphicsContext } from '../../Graphics/Context/ExcaliburGraphicsContext';
import { Transform } from '../../Math/transform';
export interface EdgeColliderOptions {
    /**
     * The beginning of the edge defined in local coordinates to the collider
     */
    begin: Vector;
    /**
     * The ending of the edge defined in local coordinates to the collider
     */
    end: Vector;
    /**
     * Optionally specify an offset
     */
    offset?: Vector;
}
/**
 * Edge is a single line collider to create collisions with a single line.
 */
export declare class EdgeCollider extends Collider {
    offset: Vector;
    begin: Vector;
    end: Vector;
    private _transform;
    private _globalMatrix;
    constructor(options: EdgeColliderOptions);
    /**
     * Returns a clone of this Edge, not associated with any collider
     */
    clone(): EdgeCollider;
    get worldPos(): Vector;
    /**
     * Get the center of the collision area in world coordinates
     */
    get center(): Vector;
    private _getTransformedBegin;
    private _getTransformedEnd;
    /**
     * Returns the slope of the line in the form of a vector
     */
    getSlope(): Vector;
    /**
     * Returns the length of the line segment in pixels
     */
    getLength(): number;
    /**
     * Tests if a point is contained in this collision area
     */
    contains(): boolean;
    /**
     * @inheritdoc
     */
    rayCast(ray: Ray, max?: number): Vector;
    /**
     * Returns the closes line between this and another collider, from this -> collider
     * @param shape
     */
    getClosestLineBetween(shape: Collider): LineSegment;
    /**
     * @inheritdoc
     */
    collide(shape: Collider): CollisionContact[];
    /**
     * Find the point on the collider furthest in the direction specified
     */
    getFurthestPoint(direction: Vector): Vector;
    private _boundsFromBeginEnd;
    /**
     * Get the axis aligned bounding box for the edge collider in world space
     */
    get bounds(): BoundingBox;
    /**
     * Get the axis aligned bounding box for the edge collider in local space
     */
    get localBounds(): BoundingBox;
    /**
     * Returns this edge represented as a line in world coordinates
     */
    asLine(): LineSegment;
    /**
     * Return this edge as a line in local line coordinates (relative to the position)
     */
    asLocalLine(): LineSegment;
    /**
     * Get the axis associated with the edge
     */
    get axes(): Vector[];
    /**
     * Get the moment of inertia for an edge
     * https://en.wikipedia.org/wiki/List_of_moments_of_inertia
     */
    getInertia(mass: number): number;
    /**
     * @inheritdoc
     */
    update(transform: Transform): void;
    /**
     * Project the edge along a specified axis
     */
    project(axis: Vector): Projection;
    debug(ex: ExcaliburGraphicsContext, color: Color): void;
}
