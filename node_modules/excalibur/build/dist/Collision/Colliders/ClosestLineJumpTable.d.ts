import { LineSegment } from '../../Math/line-segment';
import { Vector } from '../../Math/vector';
import { PolygonCollider } from './PolygonCollider';
import { EdgeCollider } from './EdgeCollider';
import { CircleCollider } from './CircleCollider';
/**
 * Finds the closes line between 2 line segments, were the magnitude of u, v are the lengths of each segment
 * L1 = P(s) = p0 + s * u, where s is time and p0 is the start of the line
 * L2 = Q(t) = q0 + t * v, where t is time and q0 is the start of the line
 * @param p0 Point where L1 begins
 * @param u Direction and length of L1
 * @param q0 Point were L2 begins
 * @param v Direction and length of L2
 */
export declare function ClosestLine(p0: Vector, u: Vector, q0: Vector, v: Vector): LineSegment;
export declare const ClosestLineJumpTable: {
    PolygonPolygonClosestLine(polygonA: PolygonCollider, polygonB: PolygonCollider): LineSegment;
    PolygonEdgeClosestLine(polygon: PolygonCollider, edge: EdgeCollider): LineSegment;
    PolygonCircleClosestLine(polygon: PolygonCollider, circle: CircleCollider): LineSegment;
    CircleCircleClosestLine(circleA: CircleCollider, circleB: CircleCollider): LineSegment;
    CircleEdgeClosestLine(circle: CircleCollider, edge: EdgeCollider): LineSegment;
    EdgeEdgeClosestLine(edgeA: EdgeCollider, edgeB: EdgeCollider): LineSegment;
};
