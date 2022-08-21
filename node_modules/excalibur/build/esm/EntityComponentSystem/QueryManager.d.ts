import { Entity } from './Entity';
import { Query } from './Query';
import { Component } from './Component';
import { World } from './World';
/**
 * The query manager is responsible for updating all queries when entities/components change
 */
export declare class QueryManager {
    private _world;
    private _queries;
    constructor(_world: World<any>);
    /**
     * Adds a query to the manager and populates with any entities that match
     * @param query
     */
    private _addQuery;
    /**
     * Removes the query if there are no observers left
     * @param query
     */
    maybeRemoveQuery(query: Query): void;
    /**
     * Adds the entity to any matching query in the query manage
     * @param entity
     */
    addEntity(entity: Entity): void;
    /**
     * Removes an entity from queries if the removed component disqualifies it
     * @param entity
     * @param component
     */
    removeComponent(entity: Entity, component: Component): void;
    /**
     * Removes an entity from all queries it is currently a part of
     * @param entity
     */
    removeEntity(entity: Entity): void;
    /**
     * Creates a populated query and returns, if the query already exists that will be returned instead of a new instance
     * @param types
     */
    createQuery<T extends Component = Component>(types: readonly string[]): Query<T>;
    /**
     * Retrieves an existing query by types if it exists otherwise returns null
     * @param types
     */
    getQuery<T extends Component = Component>(types: readonly string[]): Query<T>;
}
