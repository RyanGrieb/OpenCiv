import { Vector } from './vector';
export declare enum MatrixLocations {
    X = 12,
    Y = 13
}
/**
 * Excalibur Matrix helper for 4x4 matrices
 *
 * Useful for webgl 4x4 matrices
 */
export declare class Matrix {
    /**
     *  4x4 matrix in column major order
     *
     * |         |         |          |          |
     * | ------- | ------- | -------- | -------- |
     * | data[0] | data[4] | data[8]  | data[12] |
     * | data[1] | data[5] | data[9]  | data[13] |
     * | data[2] | data[6] | data[10] | data[14] |
     * | data[3] | data[7] | data[11] | data[15] |
     *
     */
    data: Float32Array;
    /**
     * Creates an orthographic (flat non-perspective) projection
     * https://en.wikipedia.org/wiki/Orthographic_projection
     * @param left
     * @param right
     * @param bottom
     * @param top
     * @param near
     * @param far
     */
    static ortho(left: number, right: number, bottom: number, top: number, near: number, far: number): Matrix;
    /**
     * Creates a new Matrix with the same data as the current 4x4
     */
    clone(dest?: Matrix): Matrix;
    /**
     * Converts the current matrix into a DOMMatrix
     *
     * This is useful when working with the browser Canvas context
     * @returns {DOMMatrix} DOMMatrix
     */
    toDOMMatrix(): DOMMatrix;
    static fromFloat32Array(data: Float32Array): Matrix;
    /**
     * Creates a new identity matrix (a matrix that when applied does nothing)
     */
    static identity(): Matrix;
    /**
     * Resets the current matrix to the identity matrix, mutating it
     * @returns {Matrix} Current matrix as identity
     */
    reset(): Matrix;
    /**
     * Creates a brand new translation matrix at the specified 3d point
     * @param x
     * @param y
     */
    static translation(x: number, y: number): Matrix;
    /**
     * Creates a brand new scaling matrix with the specified scaling factor
     * @param sx
     * @param sy
     */
    static scale(sx: number, sy: number): Matrix;
    /**
     * Creates a brand new rotation matrix with the specified angle
     * @param angleRadians
     */
    static rotation(angleRadians: number): Matrix;
    /**
     * Multiply the current matrix by a vector producing a new vector
     * @param vector
     * @param dest
     */
    multiply(vector: Vector, dest?: Vector): Vector;
    /**
     * Multiply the current matrix by another matrix producing a new matrix
     * @param matrix
     * @param dest
     */
    multiply(matrix: Matrix, dest?: Matrix): Matrix;
    /**
     * Applies translation to the current matrix mutating it
     * @param x
     * @param y
     */
    translate(x: number, y: number): this;
    setPosition(x: number, y: number): void;
    getPosition(): Vector;
    /**
     * Applies rotation to the current matrix mutating it
     * @param angle in Radians
     */
    rotate(angle: number): this;
    /**
     * Applies scaling to the current matrix mutating it
     * @param x
     * @param y
     */
    scale(x: number, y: number): this;
    setRotation(angle: number): void;
    getRotation(): number;
    getScaleX(): number;
    getScaleY(): number;
    /**
     * Get the scale of the matrix
     */
    getScale(): Vector;
    private _scaleX;
    private _scaleSignX;
    setScaleX(val: number): void;
    private _scaleY;
    private _scaleSignY;
    setScaleY(val: number): void;
    setScale(scale: Vector): void;
    /**
     * Determinant of the upper left 2x2 matrix
     */
    getBasisDeterminant(): number;
    /**
     * Return the affine inverse, optionally store it in a target matrix.
     *
     * It's recommended you call .reset() the target unless you know what you're doing
     * @param target
     */
    getAffineInverse(target?: Matrix): Matrix;
    isIdentity(): boolean;
    toString(): string;
}
