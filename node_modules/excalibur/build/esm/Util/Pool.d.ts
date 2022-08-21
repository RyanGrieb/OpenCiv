export declare class Pool<Type> {
    builder: (...args: any[]) => Type;
    recycler: (instance: Type, ...args: any[]) => Type;
    maxObjects: number;
    totalAllocations: number;
    index: number;
    objects: Type[];
    disableWarnings: boolean;
    private _logger;
    constructor(builder: (...args: any[]) => Type, recycler: (instance: Type, ...args: any[]) => Type, maxObjects?: number);
    preallocate(): void;
    /**
     * Use many instances out of the in the context and return all to the pool.
     *
     * By returning values out of the context they will be un-hooked from the pool and are free to be passed to consumers
     * @param context
     */
    using(context: (pool: Pool<Type>) => Type[] | void): Type[];
    /**
     * Use a single instance out of th pool and immediately return it to the pool
     * @param context
     */
    borrow(context: (object: Type) => void): void;
    /**
     * Retrieve a value from the pool, will allocate a new instance if necessary or recycle from the pool
     * @param args
     */
    get(...args: any[]): Type;
    /**
     * Signals we are done with the pool objects for now, Reclaims all objects in the pool.
     *
     * If a list of pooled objects is passed to done they are un-hooked from the pool and are free
     * to be passed to consumers
     * @param objects A list of object to separate from the pool
     */
    done(...objects: Type[]): Type[];
    done(): void;
}
