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
export interface CircleColliderOptions {
    /**
     * Optional pixel offset to shift the circle relative to the collider, by default (0, 0).
     */
    offset?: Vector;
    /**
     * Required radius of the circle
     */
    radius: number;
}
/**
 * This is a circle collider for the excalibur rigid body physics simulation
 */
export declare class CircleCollider extends Collider {
    /**
     * Position of the circle relative to the collider, by default (0, 0).
     */
    offset: Vector;
    private _globalMatrix;
    get worldPos(): Vector;
    private _naturalRadius;
    /**
     * Get the radius of the circle
     */
    get radius(): number;
    /**
     * Set the radius of the circle
     */
    set radius(val: number);
    private _transform;
    constructor(options: CircleColliderOptions);
    /**
     * Returns a clone of this shape, not associated with any collider
     */
    clone(): CircleCollider;
    /**
     * Get the center of the collider in world coordinates
     */
    get center(): Vector;
    /**
     * Tests if a point is contained in this collider
     */
    contains(point: Vector): boolean;
    /**
     * Casts a ray at the Circle collider and returns the nearest point of collision
     * @param ray
     */
    rayCast(ray: Ray, max?: number): Vector;
    getClosestLineBetween(shape: Collider): LineSegment;
    /**
     * @inheritdoc
     */
    collide(collider: Collider): CollisionContact[];
    /**
     * Find the point on the collider furthest in the direction specified
     */
    getFurthestPoint(direction: Vector): Vector;
    /**
     * Find the local point on the shape in the direction specified
     * @param direction
     */
    getFurthestLocalPoint(direction: Vector): Vector;
    /**
     * Get the axis aligned bounding box for the circle collider in world coordinates
     */
    get bounds(): BoundingBox;
    /**
     * Get the axis aligned bounding box for the circle collider in local coordinates
     */
    get localBounds(): BoundingBox;
    /**
     * Get axis not implemented on circles, since there are infinite axis in a circle
     */
    get axes(): Vector[];
    /**
     * Returns the moment of inertia of a circle given it's mass
     * https://en.wikipedia.org/wiki/List_of_moments_of_inertia
     */
    getInertia(mass: number): number;
    update(transform: Transform): void;
    /**
     * Project the circle along a specified axis
     */
    project(axis: Vector): Projection;
    debug(ex: ExcaliburGraphicsContext, color: Color): void;
}
