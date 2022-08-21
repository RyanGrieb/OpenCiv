/**
 * Obsolete decorator options
 */
export interface ObsoleteOptions {
    message?: string;
    alternateMethod?: string;
    showStackTrace?: boolean;
}
export declare const maxMessages = 5;
export declare const resetObsoleteCounter: () => void;
/**
 * Obsolete decorator for marking Excalibur methods obsolete, you can optionally specify a custom message and/or alternate replacement
 * method do the deprecated one. Inspired by https://github.com/jayphelps/core-decorators.js
 */
export declare function obsolete(options?: ObsoleteOptions): any;
