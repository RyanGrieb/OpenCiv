/**
 * Flags is a feature flag implementation for Excalibur. They can only be operated **before [[Engine]] construction**
 * after which they are frozen and are read-only.
 *
 * Flags are used to enable experimental or preview features in Excalibur.
 */
export declare class Flags {
    private static _FROZEN;
    private static _FLAGS;
    /**
     * Force excalibur to load the Canvas 2D graphics context fallback
     *
     * @warning not all features of excalibur are supported in the Canvas 2D fallback
     */
    static useCanvasGraphicsContext(): void;
    /**
     * Freeze all flag modifications making them readonly
     */
    static freeze(): void;
    /**
     * Resets internal flag state, not meant to be called by users. Only used for testing.
     *
     * Calling this in your game is UNSUPPORTED
     * @internal
     */
    static _reset(): void;
    /**
     * Enable a specific feature flag by name. **Note: can only be set before [[Engine]] constructor time**
     * @param flagName
     */
    static enable(flagName: string): void;
    /**
     * Disable a specific feature flag by name. **Note: can only be set before [[Engine]] constructor time**
     * @param flagName
     */
    static disable(flagName: string): void;
    /**
     * Check if a flag is enabled. If the flag is disabled or does not exist `false` is returned
     * @param flagName
     */
    static isEnabled(flagName: string): boolean;
    /**
     * Show a list of currently known flags
     */
    static show(): string[];
}
