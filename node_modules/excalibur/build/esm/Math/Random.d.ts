/**
 * @module
 * Pseudo-Random Utility
 *
 * A pseudo-random utility to add seeded random support for help in
 * generating things like terrain or reproducible randomness. Uses the
 * [Mersenne Twister](https://en.wikipedia.org/wiki/Mersenne_Twister) algorithm.
 */
/**
 * Pseudo-random number generator following the Mersenne_Twister algorithm. Given a seed this generator will produce the same sequence
 * of numbers each time it is called.
 * See https://en.wikipedia.org/wiki/Mersenne_Twister for more details.
 * Uses the MT19937-32 (2002) implementation documented here http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/MT2002/emt19937ar.html
 *
 * Api inspired by http://chancejs.com/# https://github.com/chancejs/chancejs
 */
export declare class Random {
    seed?: number;
    private _lowerMask;
    private _upperMask;
    private _w;
    private _n;
    private _m;
    private _a;
    private _u;
    private _s;
    private _b;
    private _t;
    private _c;
    private _l;
    private _f;
    private _mt;
    private _index;
    /**
     * If no seed is specified, the Date.now() is used
     */
    constructor(seed?: number);
    /**
     * Apply the twist
     */
    private _twist;
    /**
     * Return next 32 bit integer number in sequence
     */
    nextInt(): number;
    /**
     * Return a random floating point number between [0, 1)
     */
    next(): number;
    /**
     * Return a random floating point in range [min, max) min is included, max is not included
     */
    floating(min: number, max: number): number;
    /**
     * Return a random integer in range [min, max] min is included, max is included.
     * Implemented with rejection sampling, see https://medium.com/@betable/tifu-by-using-math-random-f1c308c4fd9d#.i13tdiu5a
     */
    integer(min: number, max: number): number;
    /**
     * Returns true or false randomly with 50/50 odds by default.
     * By default the likelihood of returning a true is .5 (50%).
     * @param likelihood takes values between [0, 1]
     */
    bool(likelihood?: number): boolean;
    /**
     * Returns one element from an array at random
     */
    pickOne<T>(array: Array<T>): T;
    /**
     * Returns a new array random picking elements from the original
     * @param array Original array to pick from
     * @param numPicks can be any positive number
     * @param allowDuplicates indicates whether the returned set is allowed duplicates (it does not mean there will always be duplicates
     * just that it is possible)
     */
    pickSet<T>(array: Array<T>, numPicks: number, allowDuplicates?: boolean): Array<T>;
    /**
     * Returns a new array randomly picking elements in the original (not reused)
     * @param array Array to pick elements out of
     * @param numPicks must be less than or equal to the number of elements in the array.
     */
    private _pickSetWithoutDuplicates;
    /**
     * Returns a new array random picking elements from the original allowing duplicates
     * @param array Array to pick elements out of
     * @param numPicks can be any positive number
     */
    private _pickSetWithDuplicates;
    /**
     * Returns a new array that has its elements shuffled. Using the Fisher/Yates method
     * https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
     */
    shuffle<T>(array: Array<T>): Array<T>;
    /**
     * Generate a list of random integer numbers
     * @param length the length of the final array
     * @param min the minimum integer number to generate inclusive
     * @param max the maximum integer number to generate inclusive
     */
    range(length: number, min: number, max: number): Array<number>;
    /**
     * Returns the result of a d4 dice roll
     */
    d4(): number;
    /**
     * Returns the result of a d6 dice roll
     */
    d6(): number;
    /**
     * Returns the result of a d8 dice roll
     */
    d8(): number;
    /**
     * Returns the result of a d10 dice roll
     */
    d10(): number;
    /**
     * Returns the result of a d12 dice roll
     */
    d12(): number;
    /**
     * Returns the result of a d20 dice roll
     */
    d20(): number;
}
