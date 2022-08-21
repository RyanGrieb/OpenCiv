import { CollisionContact } from '../Detection/CollisionContact';
import { CollisionSolver } from './Solver';
/**
 * ArcadeSolver is the default in Excalibur. It solves collisions so that there is no overlap between contacts,
 * and negates velocity along the collision normal.
 *
 * This is usually the type of collisions used for 2D games that don't need a more realistic collision simulation.
 *
 */
export declare class ArcadeSolver implements CollisionSolver {
    directionMap: Map<string, string>;
    distanceMap: Map<string, number>;
    solve(contacts: CollisionContact[]): CollisionContact[];
    preSolve(contacts: CollisionContact[]): void;
    postSolve(contacts: CollisionContact[]): void;
    solvePosition(contact: CollisionContact): void;
    solveVelocity(contact: CollisionContact): void;
}
