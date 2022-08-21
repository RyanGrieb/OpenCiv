import { PolygonCollider } from './PolygonCollider';
import { CircleCollider } from './CircleCollider';
import { EdgeCollider } from './EdgeCollider';
import { Vector } from '../../Math/vector';
import { CompositeCollider } from './CompositeCollider';
/**
 * Excalibur helper for defining colliders quickly
 */
export declare class Shape {
    /**
     * Creates a box collider, under the hood defines a [[PolygonCollider]] collider
     * @param width Width of the box
     * @param height Height of the box
     * @param anchor Anchor of the box (default (.5, .5)) which positions the box relative to the center of the collider's position
     * @param offset Optional offset relative to the collider in local coordinates
     */
    static Box(width: number, height: number, anchor?: Vector, offset?: Vector): PolygonCollider;
    /**
     * Creates a new [[PolygonCollider|arbitrary polygon]] collider
     *
     * PolygonColliders are useful for creating convex polygon shapes
     * @param points Points specified in counter clockwise
     * @param offset Optional offset relative to the collider in local coordinates
     */
    static Polygon(points: Vector[], offset?: Vector): PolygonCollider;
    /**
     * Creates a new [[CircleCollider|circle]] collider
     *
     * Circle colliders are useful for balls, or to make collisions more forgiving on sharp edges
     * @param radius Radius of the circle collider
     * @param offset Optional offset relative to the collider in local coordinates
     */
    static Circle(radius: number, offset?: Vector): CircleCollider;
    /**
     * Creates a new [[EdgeCollider|edge]] collider
     *
     * Edge colliders are useful for  floors, walls, and other barriers
     * @param begin Beginning of the edge in local coordinates to the collider
     * @param end Ending of the edge in local coordinates to the collider
     */
    static Edge(begin: Vector, end: Vector): EdgeCollider;
    /**
     * Creates a new capsule shaped [[CompositeCollider]] using 2 circles and a box
     *
     * Capsule colliders are useful for platformers with incline or jagged floors to have a smooth
     * player experience.
     *
     * @param width
     * @param height
     * @param offset Optional offset
     */
    static Capsule(width: number, height: number, offset?: Vector): CompositeCollider;
}
