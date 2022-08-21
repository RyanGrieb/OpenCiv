import { Vector } from '../../Math/vector';
import { Collider } from '../Colliders/Collider';
import { SeparationInfo } from '../Colliders/SeparatingAxis';
/**
 * Collision contacts are used internally by Excalibur to resolve collision between colliders. This
 * Pair prevents collisions from being evaluated more than one time
 */
export declare class CollisionContact {
    private _canceled;
    /**
     * Currently the ids between colliders
     */
    readonly id: string;
    /**
     * The first collider in the collision
     */
    colliderA: Collider;
    /**
     * The second collider in the collision
     */
    colliderB: Collider;
    /**
     * The minimum translation vector to resolve overlap, pointing away from colliderA
     */
    mtv: Vector;
    /**
     * World space contact points between colliderA and colliderB
     */
    points: Vector[];
    /**
     * Local space contact points between colliderA and colliderB
     */
    localPoints: Vector[];
    /**
     * The collision normal, pointing away from colliderA
     */
    normal: Vector;
    /**
     * The collision tangent
     */
    tangent: Vector;
    /**
     * Information about the specifics of the collision contact separation
     */
    info: SeparationInfo;
    constructor(colliderA: Collider, colliderB: Collider, mtv: Vector, normal: Vector, tangent: Vector, points: Vector[], localPoints: Vector[], info: SeparationInfo);
    /**
     * Match contact awake state, except if body's are Fixed
     */
    matchAwake(): void;
    isCanceled(): boolean;
    cancel(): void;
}
