import { Vector } from '../Math/vector';
import { Clock } from './Clock';
/**
 * Find the screen position of an HTML element
 */
export declare function getPosition(el: HTMLElement): Vector;
/**
 * Add an item to an array list if it doesn't already exist. Returns true if added, false if not and already exists in the array.
 * @deprecated Will be removed in v0.26.0
 */
export declare function addItemToArray<T>(item: T, array: T[]): boolean;
/**
 * Remove an item from an list
 * @deprecated Will be removed in v0.26.0
 */
export declare function removeItemFromArray<T>(item: T, array: T[]): boolean;
/**
 * See if an array contains something
 */
export declare function contains(array: Array<any>, obj: any): boolean;
/**
 * Used for exhaustive checks at compile time
 */
export declare function fail(message: never): never;
/**
 * Create a promise that resolves after a certain number of milliseconds
 *
 * It is strongly recommended you pass the excalibur clock so delays are bound to the
 * excalibur clock which would be unaffected by stop/pause.
 * @param milliseconds
 * @param clock
 */
export declare function delay(milliseconds: number, clock?: Clock): Promise<void>;
