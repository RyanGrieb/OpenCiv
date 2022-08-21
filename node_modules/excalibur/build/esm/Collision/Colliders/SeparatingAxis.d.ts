import { LineSegment } from '../../Math/line-segment';
import { Vector } from '../../Math/vector';
import { Collider } from './Collider';
import { CircleCollider } from './CircleCollider';
import { PolygonCollider } from './PolygonCollider';
/**
 * Specific information about a contact and it's separation
 */
export interface SeparationInfo {
    /**
     * Collider A
     */
    collider: Collider;
    /**
     * Signed value (negative means overlap, positive no overlap)
     */
    separation: number;
    /**
     * Axis of separation from the collider's perspective
     */
    axis: Vector;
    /**
     * Side of separation (reference) from the collider's perspective
     */
    side?: LineSegment;
    /**
     * Local side of separation (reference) from the collider's perspective
     */
    localSide?: LineSegment;
    /**
     * Index of the separation side (reference) from the collider's perspective
     */
    sideId?: number;
    /**
     * Point on collider B (incident point)
     */
    point: Vector;
    /**
     * Local point on collider B (incident point)
     */
    localPoint?: Vector;
}
export declare class SeparatingAxis {
    static findPolygonPolygonSeparation(polyA: PolygonCollider, polyB: PolygonCollider): SeparationInfo;
    static findCirclePolygonSeparation(circle: CircleCollider, polygon: PolygonCollider): Vector | null;
}
