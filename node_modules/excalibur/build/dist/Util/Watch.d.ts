/**
 * Watch an object with a proxy, only fires if property value is different
 */
export declare function watch<T extends object>(type: T, change: (type: T) => any): T;
/**
 * Watch an object with a proxy, fires change on any property value change
 */
export declare function watchAny<T extends object>(type: T, change: (type: T) => any): T;
