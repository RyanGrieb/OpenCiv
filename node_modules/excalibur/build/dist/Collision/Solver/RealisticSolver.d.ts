import { CollisionContact } from '../Detection/CollisionContact';
import { ContactConstraintPoint } from './ContactConstraintPoint';
import { CollisionSolver } from './Solver';
export declare class RealisticSolver implements CollisionSolver {
    lastFrameContacts: Map<string, CollisionContact>;
    idToContactConstraint: Map<string, ContactConstraintPoint[]>;
    getContactConstraints(id: string): ContactConstraintPoint[];
    solve(contacts: CollisionContact[]): CollisionContact[];
    preSolve(contacts: CollisionContact[]): void;
    postSolve(contacts: CollisionContact[]): void;
    /**
     * Warm up body's based on previous frame contact points
     * @param contacts
     */
    warmStart(contacts: CollisionContact[]): void;
    /**
     * Iteratively solve the position overlap constraint
     * @param contacts
     */
    solvePosition(contacts: CollisionContact[]): void;
    solveVelocity(contacts: CollisionContact[]): void;
}
