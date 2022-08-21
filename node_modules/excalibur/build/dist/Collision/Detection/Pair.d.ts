import { CollisionContact } from './CollisionContact';
import { Id } from '../../Id';
import { Collider } from '../Colliders/Collider';
/**
 * Models a potential collision between 2 colliders
 */
export declare class Pair {
    colliderA: Collider;
    colliderB: Collider;
    id: string;
    constructor(colliderA: Collider, colliderB: Collider);
    /**
     * Returns whether a it is allowed for 2 colliders in a Pair to collide
     * @param colliderA
     * @param colliderB
     */
    static canCollide(colliderA: Collider, colliderB: Collider): boolean;
    /**
     * Returns whether or not it is possible for the pairs to collide
     */
    get canCollide(): boolean;
    /**
     * Runs the collision intersection logic on the members of this pair
     */
    collide(): CollisionContact[];
    /**
     * Check if the collider is part of the pair
     * @param collider
     */
    hasCollider(collider: Collider): boolean;
    /**
     * Calculates the unique pair hash id for this collision pair (owning id)
     */
    static calculatePairHash(idA: Id<'collider'>, idB: Id<'collider'>): string;
}
