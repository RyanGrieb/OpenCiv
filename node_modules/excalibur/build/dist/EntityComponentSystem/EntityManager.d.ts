import { Entity, RemovedComponent, AddedComponent } from './Entity';
import { Observer } from '../Util/Observable';
import { World } from './World';
export declare class EntityManager<ContextType = any> implements Observer<RemovedComponent | AddedComponent> {
    private _world;
    entities: Entity[];
    _entityIndex: {
        [entityId: string]: Entity;
    };
    constructor(_world: World<ContextType>);
    /**
     * Runs the entity lifecycle
     * @param _context
     */
    updateEntities(_context: ContextType, elapsed: number): void;
    findEntitiesForRemoval(): void;
    /**
     * EntityManager observes changes on entities
     * @param message
     */
    notify(message: RemovedComponent | AddedComponent): void;
    /**
     * Adds an entity to be tracked by the EntityManager
     * @param entity
     */
    addEntity(entity: Entity): void;
    removeEntity(entity: Entity, deferred?: boolean): void;
    removeEntity(id: number, deferred?: boolean): void;
    private _entitiesToRemove;
    processEntityRemovals(): void;
    processComponentRemovals(): void;
    getById(id: number): Entity;
    getByName(name: string): Entity[];
    clear(): void;
}
