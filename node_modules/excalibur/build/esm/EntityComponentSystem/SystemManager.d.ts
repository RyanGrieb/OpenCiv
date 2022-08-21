import { System, SystemType } from './System';
import { World } from './World';
export interface SystemCtor<T extends System> {
    new (): T;
}
/**
 * The SystemManager is responsible for keeping track of all systems in a scene.
 * Systems are scene specific
 */
export declare class SystemManager<ContextType> {
    private _world;
    /**
     * List of systems, to add a new system call [[SystemManager.addSystem]]
     */
    systems: System<any, ContextType>[];
    _keyToSystem: {
        [key: string]: System<any, ContextType>;
    };
    initialized: boolean;
    constructor(_world: World<ContextType>);
    /**
     * Get a system registered in the manager by type
     * @param systemType
     */
    get<T extends System>(systemType: SystemCtor<T>): T | null;
    /**
     * Adds a system to the manager, it will now be updated every frame
     * @param system
     */
    addSystem(system: System<any, ContextType>): void;
    /**
     * Removes a system from the manager, it will no longer be updated
     * @param system
     */
    removeSystem(system: System<any, ContextType>): void;
    /**
     * Initialize all systems in the manager
     *
     * Systems added after initialize() will be initialized on add
     */
    initialize(): void;
    /**
     * Updates all systems
     * @param type whether this is an update or draw system
     * @param context context reference
     * @param delta time in milliseconds
     */
    updateSystems(type: SystemType, context: ContextType, delta: number): void;
    clear(): void;
}
