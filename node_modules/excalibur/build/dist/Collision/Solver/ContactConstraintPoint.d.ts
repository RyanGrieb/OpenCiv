import { Vector } from '../../Math/vector';
import { CollisionContact } from '../Detection/CollisionContact';
/**
 * Holds information about contact points, meant to be reused over multiple frames of contact
 */
export declare class ContactConstraintPoint {
    point: Vector;
    local: Vector;
    contact: CollisionContact;
    constructor(point: Vector, local: Vector, contact: CollisionContact);
    /**
     * Updates the contact information
     */
    update(): this;
    /**
     * Returns the relative velocity between bodyA and bodyB
     */
    getRelativeVelocity(): Vector;
    /**
     * Impulse accumulated over time in normal direction
     */
    normalImpulse: number;
    /**
     * Impulse accumulated over time in the tangent direction
     */
    tangentImpulse: number;
    /**
     * Effective mass seen in the normal direction
     */
    normalMass: number;
    /**
     * Effective mass seen in the tangent direction
     */
    tangentMass: number;
    /**
     * Direction from center of mass of bodyA to contact point
     */
    aToContact: Vector;
    /**
     * Direction from center of mass of bodyB to contact point
     */
    bToContact: Vector;
    /**
     * Original contact velocity combined with bounciness
     */
    originalVelocityAndRestitution: number;
}
