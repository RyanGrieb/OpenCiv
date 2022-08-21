import { Clonable } from '../Interfaces/Clonable';
/**
 * A 2D vector on a plane.
 */
export declare class Vector implements Clonable<Vector> {
    /**
     * A (0, 0) vector
     */
    static get Zero(): Vector;
    /**
     * A (1, 1) vector
     */
    static get One(): Vector;
    /**
     * A (0.5, 0.5) vector
     */
    static get Half(): Vector;
    /**
     * A unit vector pointing up (0, -1)
     */
    static get Up(): Vector;
    /**
     * A unit vector pointing down (0, 1)
     */
    static get Down(): Vector;
    /**
     * A unit vector pointing left (-1, 0)
     */
    static get Left(): Vector;
    /**
     * A unit vector pointing right (1, 0)
     */
    static get Right(): Vector;
    /**
     * Returns a vector of unit length in the direction of the specified angle in Radians.
     * @param angle The angle to generate the vector
     */
    static fromAngle(angle: number): Vector;
    /**
     * Checks if vector is not null, undefined, or if any of its components are NaN or Infinity.
     */
    static isValid(vec: Vector): boolean;
    /**
     * Calculates distance between two Vectors
     * @param vec1
     * @param vec2
     */
    static distance(vec1: Vector, vec2: Vector): number;
    static min(vec1: Vector, vec2: Vector): Vector;
    static max(vec1: Vector, vec2: Vector): Vector;
    /**
     * @param x  X component of the Vector
     * @param y  Y component of the Vector
     */
    constructor(x: number, y: number);
    protected _x: number;
    /**
     * Get the x component of the vector
     */
    get x(): number;
    /**
     * Set the x component, THIS MUTATES the current vector. It is usually better to create a new vector.
     * @warning **Be very careful setting components on shared vectors, mutating shared vectors can cause hard to find bugs**
     */
    set x(val: number);
    protected _y: number;
    /**
     * Get the y component of the vector
     */
    get y(): number;
    /**
     * Set the y component, THIS MUTATES the current vector. It is usually better to create a new vector.
     * @warning **Be very careful setting components on shared vectors, mutating shared vectors can cause hard to find bugs**
     */
    set y(val: number);
    /**
     * Sets the x and y components at once, THIS MUTATES the current vector. It is usually better to create a new vector.
     *
     * @warning **Be very careful using this, mutating vectors can cause hard to find bugs**
     */
    setTo(x: number, y: number): void;
    /**
     * Compares this point against another and tests for equality
     * @param vector The other point to compare to
     * @param tolerance Amount of euclidean distance off we are willing to tolerate
     */
    equals(vector: Vector, tolerance?: number): boolean;
    /**
     * The distance to another vector. If no other Vector is specified, this will return the [[magnitude]].
     * @param v  The other vector. Leave blank to use origin vector.
     */
    distance(v?: Vector): number;
    squareDistance(v?: Vector): number;
    /**
     * Clamps the current vector's magnitude mutating it
     * @param magnitude
     */
    clampMagnitude(magnitude: number): Vector;
    /**
     * The size (magnitude) of the Vector
     */
    get size(): number;
    /**
     * Setting the size mutates the current vector
     *
     * @warning Can be used to set the size of the vector, **be very careful using this, mutating vectors can cause hard to find bugs**
     */
    set size(newLength: number);
    /**
     * Normalizes a vector to have a magnitude of 1.
     */
    normalize(): Vector;
    /**
     * Returns the average (midpoint) between the current point and the specified
     */
    average(vec: Vector): Vector;
    /**
     * Scales a vector's by a factor of size
     * @param size  The factor to scale the magnitude by
     * @param dest  Optionally provide a destination vector for the result
     */
    scale(scale: Vector, dest?: Vector): Vector;
    scale(size: number, dest?: Vector): Vector;
    /**
     * Adds one vector to another
     * @param v The vector to add
     * @param dest Optionally copy the result into a provided vector
     */
    add(v: Vector, dest?: Vector): Vector;
    /**
     * Subtracts a vector from another, if you subtract vector `B.sub(A)` the resulting vector points from A -> B
     * @param v The vector to subtract
     */
    sub(v: Vector): Vector;
    /**
     * Adds one vector to this one modifying the original
     * @param v The vector to add
     * @warning Be very careful using this, mutating vectors can cause hard to find bugs
     */
    addEqual(v: Vector): Vector;
    /**
     * Subtracts a vector from this one modifying the original
     * @param v The vector to subtract
     * @warning Be very careful using this, mutating vectors can cause hard to find bugs
     */
    subEqual(v: Vector): Vector;
    /**
     * Scales this vector by a factor of size and modifies the original
     * @warning Be very careful using this, mutating vectors can cause hard to find bugs
     */
    scaleEqual(size: number): Vector;
    /**
     * Performs a dot product with another vector
     * @param v  The vector to dot
     */
    dot(v: Vector): number;
    /**
     * Performs a 2D cross product with scalar. 2D cross products with a scalar return a vector.
     * @param v  The scalar to cross
     */
    cross(v: number): Vector;
    /**
     * Performs a 2D cross product with another vector. 2D cross products return a scalar value not a vector.
     * @param v  The vector to cross
     */
    cross(v: Vector): number;
    static cross(num: number, vec: Vector): Vector;
    /**
     * Returns the perpendicular vector to this one
     */
    perpendicular(): Vector;
    /**
     * Returns the normal vector to this one, same as the perpendicular of length 1
     */
    normal(): Vector;
    /**
     * Negate the current vector
     */
    negate(): Vector;
    /**
     * Returns the angle of this vector.
     */
    toAngle(): number;
    /**
     * Rotates the current vector around a point by a certain number of
     * degrees in radians
     */
    rotate(angle: number, anchor?: Vector): Vector;
    /**
     * Creates new vector that has the same values as the previous.
     */
    clone(dest?: Vector): Vector;
    /**
     * Returns a string representation of the vector.
     */
    toString(fixed?: number): string;
}
/**
 * Shorthand for creating new Vectors - returns a new Vector instance with the
 * provided X and Y components.
 *
 * @param x  X component of the Vector
 * @param y  Y component of the Vector
 */
export declare function vec(x: number, y: number): Vector;
