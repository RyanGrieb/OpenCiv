export declare type Id<T extends string> = {
    type: T;
    value: number;
};
/**
 * Create a branded ID type from a number
 */
export declare function createId<T extends string>(type: T, value: number): Id<T>;
