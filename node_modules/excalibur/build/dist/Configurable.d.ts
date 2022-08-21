export declare type Constructor<T> = {
    new (...args: any[]): T;
};
/**
 * Configurable helper extends base type and makes all properties available as option bag arguments
 * @internal
 * @param base
 */
export declare function Configurable<T extends Constructor<{}>>(base: T): T;
