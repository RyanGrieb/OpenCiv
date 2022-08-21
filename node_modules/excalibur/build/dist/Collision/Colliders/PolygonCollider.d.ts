import { Color } from '../../Color';
import { BoundingBox } from '../BoundingBox';
import { CollisionContact } from '../Detection/CollisionContact';
import { Projection } from '../../Math/projection';
import { LineSegment } from '../../Math/line-segment';
import { Vector } from '../../Math/vector';
import { Ray } from '../../Math/ray';
import { Collider } from './Collider';
import { ExcaliburGraphicsContext } from '../..';
import { CompositeCollider } from './CompositeCollider';
import { Transform } from '../../Math/transform';
export interface PolygonColliderOptions {
    /**
     * Pixel offset relative to a collider's body transform position.
     */
    offset?: Vector;
    /**
     * Points in the polygon in order around the perimeter in local coordinates. These are relative from the body transform position.
     */
    points: Vector[];
}
/**
 * Polygon collider for detecting collisions
 */
export declare class PolygonCollider extends Collider {
    private _logger;
    /**
     * Pixel offset relative to a collider's body transform position.
     */
    offset: Vector;
    private _points;
    /**
     * Points in the polygon in order around the perimeter in local coordinates. These are relative from the body transform position.
     * Excalibur stores these in counter-clockwise order
     */
    set points(points: Vector[]);
    /**
     * Points in the polygon in order around the perimeter in local coordinates. These are relative from the body transform position.
     * Excalibur stores these in counter-clockwise order
     */
    get points(): Vector[];
    private _transform;
    private _transformedPoints;
    private _sides;
    private _localSides;
    constructor(options: PolygonColliderOptions);
    private _isCounterClockwiseWinding;
    /**
     * Returns if the polygon collider is convex, Excalibur does not handle non-convex collision shapes.
     * Call [[Polygon.triangulate]] to generate a [[CompositeCollider]] from this non-convex shape
     */
    isConvex(): boolean;
    /**
     * Tessellates the polygon into a triangle fan as a [[CompositeCollider]] of triangle polygons
     */
    tessellate(): CompositeCollider;
    /**
     * Triangulate the polygon collider using the "Ear Clipping" algorithm.
     * Returns a new [[CompositeCollider]] made up of smaller triangles.
     */
    triangulate(): CompositeCollider;
    /**
     * Returns a clone of this ConvexPolygon, not associated with any collider
     */
    clone(): PolygonCollider;
    /**
     * Returns the world position of the collider, which is the current body transform plus any defined offset
     */
    get worldPos(): Vector;
    /**
     * Get the center of the collider in world coordinates
     */
    get center(): Vector;
    private _globalMatrix;
    private _transformedPointsDirty;
    /**
     * Calculates the underlying transformation from the body relative space to world space
     */
    private _calculateTransformation;
    /**
     * Gets the points that make up the polygon in world space, from actor relative space (if specified)
     */
    getTransformedPoints(): Vector[];
    private _sidesDirty;
    /**
     * Gets the sides of the polygon in world space
     */
    getSides(): LineSegment[];
    private _localSidesDirty;
    /**
     * Returns the local coordinate space sides
     */
    getLocalSides(): LineSegment[];
    /**
     * Given a direction vector find the world space side that is most in that direction
     * @param direction
     */
    findSide(direction: Vector): LineSegment;
    /**
     * Given a direction vector find the local space side that is most in that direction
     * @param direction
     */
    findLocalSide(direction: Vector): LineSegment;
    /**
     * Get the axis associated with the convex polygon
     */
    get axes(): Vector[];
    /**
     * Updates the transform for the collision geometry
     *
     * Collision geometry (points/bounds) will not change until this is called.
     * @param transform
     */
    update(transform: Transform): void;
    /**
     * Tests if a point is contained in this collider in world space
     */
    contains(point: Vector): boolean;
    getClosestLineBetween(collider: Collider): LineSegment;
    /**
     * Returns a collision contact if the 2 colliders collide, otherwise collide will
     * return null.
     * @param collider
     */
    collide(collider: Collider): CollisionContact[];
    /**
     * Find the point on the collider furthest in the direction specified
     */
    getFurthestPoint(direction: Vector): Vector;
    /**
     * Find the local point on the collider furthest in the direction specified
     * @param direction
     */
    getFurthestLocalPoint(direction: Vector): Vector;
    /**
     * Finds the closes face to the point using perpendicular distance
     * @param point point to test against polygon
     */
    getClosestFace(point: Vector): {
        distance: Vector;
        face: LineSegment;
    };
    /**
     * Get the axis aligned bounding box for the polygon collider in world coordinates
     */
    get bounds(): BoundingBox;
    private _localBoundsDirty;
    private _localBounds;
    /**
     * Get the axis aligned bounding box for the polygon collider in local coordinates
     */
    get localBounds(): BoundingBox;
    private _cachedMass;
    private _cachedInertia;
    /**
     * Get the moment of inertia for an arbitrary polygon
     * https://en.wikipedia.org/wiki/List_of_moments_of_inertia
     */
    getInertia(mass: number): number;
    /**
     * Casts a ray into the polygon and returns a vector representing the point of contact (in world space) or null if no collision.
     */
    rayCast(ray: Ray, max?: number): Vector;
    /**
     * Project the edges of the polygon along a specified axis
     */
    project(axis: Vector): Projection;
    debug(ex: ExcaliburGraphicsContext, color: Color): void;
}
