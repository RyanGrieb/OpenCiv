/**
 * Interface for detected browser features matrix
 */
export interface DetectedFeatures {
    readonly canvas: boolean;
    readonly arraybuffer: boolean;
    readonly dataurl: boolean;
    readonly objecturl: boolean;
    readonly rgba: boolean;
    readonly webaudio: boolean;
    readonly webgl: boolean;
    readonly gamepadapi: boolean;
}
/**
 * Excalibur internal feature detection helper class
 */
export declare class Detector {
    private _features;
    failedTests: string[];
    constructor();
    /**
     * Returns a map of currently supported browser features. This method
     * treats the features as a singleton and will only calculate feature
     * support if it has not previously been done.
     */
    getBrowserFeatures(): DetectedFeatures;
    /**
     * Report on non-critical browser support for debugging purposes.
     * Use native browser console colors for visibility.
     */
    logBrowserFeatures(): void;
    /**
     * Executes several IIFE's to get a constant reference to supported
     * features within the current execution context.
     */
    private _loadBrowserFeatures;
    private _criticalTests;
    private _warningTest;
    test(): boolean;
}
