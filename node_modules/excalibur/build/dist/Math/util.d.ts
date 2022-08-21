import { Random } from './Random';
/**
 * Two PI constant
 */
export declare const TwoPI: number;
/**
 * Returns the fractional part of a number
 * @param x
 */
export declare function frac(x: number): number;
/**
 * Returns the sign of a number, if 0 returns 0
 */
export declare function sign(val: number): number;
/**
 * Clamps a value between a min and max inclusive
 */
export declare function clamp(val: number, min: number, max: number): number;
/**
 * Convert an angle to be the equivalent in the range [0, 2PI]
 */
export declare function canonicalizeAngle(angle: number): number;
/**
 * Convert radians to degrees
 */
export declare function toDegrees(radians: number): number;
/**
 * Convert degrees to radians
 */
export declare function toRadians(degrees: number): number;
/**
 * Generate a range of numbers
 * For example: range(0, 5) -> [0, 1, 2, 3, 4, 5]
 * @param from inclusive
 * @param to inclusive
 */
export declare const range: (from: number, to: number) => number[];
/**
 * Find a random floating point number in range
 */
export declare function randomInRange(min: number, max: number, random?: Random): number;
/**
 * Find a random integer in a range
 */
export declare function randomIntInRange(min: number, max: number, random?: Random): number;
