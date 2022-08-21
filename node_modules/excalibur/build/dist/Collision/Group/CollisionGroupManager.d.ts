import { CollisionGroup } from './CollisionGroup';
/**
 * Static class for managing collision groups in excalibur, there is a maximum of 32 collision groups possible in excalibur
 */
export declare class CollisionGroupManager {
    private static _STARTING_BIT;
    private static _MAX_GROUPS;
    private static _CURRENT_GROUP;
    private static _CURRENT_BIT;
    private static _GROUPS;
    /**
     * Create a new named collision group up to a max of 32.
     * @param name Name for the collision group
     * @param mask Optionally provide your own 32-bit mask, if none is provide the manager will generate one
     */
    static create(name: string, mask?: number): CollisionGroup;
    /**
     * Get all collision groups currently tracked by excalibur
     */
    static get groups(): CollisionGroup[];
    /**
     * Get a collision group by it's name
     * @param name
     */
    static groupByName(name: string): CollisionGroup;
    /**
     * Resets the managers internal group management state
     */
    static reset(): void;
}
