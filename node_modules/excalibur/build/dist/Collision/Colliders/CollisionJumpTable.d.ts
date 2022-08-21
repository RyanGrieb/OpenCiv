import { CircleCollider } from './CircleCollider';
import { CollisionContact } from '../Detection/CollisionContact';
import { PolygonCollider } from './PolygonCollider';
import { EdgeCollider } from './EdgeCollider';
import { Vector } from '../../Math/vector';
export declare const CollisionJumpTable: {
    CollideCircleCircle(circleA: CircleCollider, circleB: CircleCollider): CollisionContact[];
    CollideCirclePolygon(circle: CircleCollider, polygon: PolygonCollider): CollisionContact[];
    CollideCircleEdge(circle: CircleCollider, edge: EdgeCollider): CollisionContact[];
    CollideEdgeEdge(): CollisionContact[];
    CollidePolygonEdge(polygon: PolygonCollider, edge: EdgeCollider): CollisionContact[];
    CollidePolygonPolygon(polyA: PolygonCollider, polyB: PolygonCollider): CollisionContact[];
    FindContactSeparation(contact: CollisionContact, localPoint: Vector): number;
};
