import { Entity } from './Entity';
import { EntityManager } from './EntityManager';
import { QueryManager } from './QueryManager';
import { System, SystemType } from './System';
import { SystemManager } from './SystemManager';
/**
 * The World is a self-contained entity component system for a particular context.
 */
export declare class World<ContextType> {
    context: ContextType;
    queryManager: QueryManager;
    entityManager: EntityManager<ContextType>;
    systemManager: SystemManager<ContextType>;
    /**
     * The context type is passed to the system updates
     * @param context
     */
    constructor(context: ContextType);
    /**
     * Update systems by type and time elapsed in milliseconds
     */
    update(type: SystemType, delta: number): void;
    /**
     * Add an entity to the ECS world
     * @param entity
     */
    add(entity: Entity): void;
    /**
     * Add a system to the ECS world
     * @param system
     */
    add(system: System<any, ContextType>): void;
    /**
     * Remove an entity from the ECS world
     * @param entity
     */
    remove(entity: Entity, deferred?: boolean): void;
    /**
     * Remove a system from the ECS world
     * @param system
     */
    remove(system: System<any, ContextType>): void;
    clearEntities(): void;
    clearSystems(): void;
}
