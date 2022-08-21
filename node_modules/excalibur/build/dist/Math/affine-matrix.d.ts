import { Matrix } from './matrix';
import { Vector } from './vector';
export declare class AffineMatrix {
    /**
     * |         |         |          |
     * | ------- | ------- | -------- |
     * | data[0] | data[2] | data[4]  |
     * | data[1] | data[3] | data[5]  |
     * |   0     |    0    |    1     |
     */
    data: Float64Array;
    /**
     * Converts the current matrix into a DOMMatrix
     *
     * This is useful when working with the browser Canvas context
     * @returns {DOMMatrix} DOMMatrix
     */
    toDOMMatrix(): DOMMatrix;
    static identity(): AffineMatrix;
    /**
     * Creates a brand new translation matrix at the specified 3d point
     * @param x
     * @param y
     */
    static translation(x: number, y: number): AffineMatrix;
    /**
     * Creates a brand new scaling matrix with the specified scaling factor
     * @param sx
     * @param sy
     */
    static scale(sx: number, sy: number): AffineMatrix;
    /**
     * Creates a brand new rotation matrix with the specified angle
     * @param angleRadians
     */
    static rotation(angleRadians: number): AffineMatrix;
    setPosition(x: number, y: number): void;
    getPosition(): Vector;
    /**
     * Applies rotation to the current matrix mutating it
     * @param angle in Radians
     */
    rotate(angle: number): this;
    /**
     * Applies translation to the current matrix mutating it
     * @param x
     * @param y
     */
    translate(x: number, y: number): this;
    /**
     * Applies scaling to the current matrix mutating it
     * @param x
     * @param y
     */
    scale(x: number, y: number): this;
    determinant(): number;
    /**
     * Return the affine inverse, optionally store it in a target matrix.
     *
     * It's recommended you call .reset() the target unless you know what you're doing
     * @param target
     */
    inverse(target?: AffineMatrix): AffineMatrix;
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
    multiply(matrix: AffineMatrix, dest?: AffineMatrix): AffineMatrix;
    to4x4(): Matrix;
    setRotation(angle: number): void;
    getRotation(): number;
    getScaleX(): number;
    getScaleY(): number;
    /**
     * Get the scale of the matrix
     */
    getScale(): Vector;
    private _scale;
    private _scaleSignX;
    setScaleX(val: number): void;
    private _scaleSignY;
    setScaleY(val: number): void;
    setScale(scale: Vector): void;
    isIdentity(): boolean;
    /**
     * Resets the current matrix to the identity matrix, mutating it
     * @returns {AffineMatrix} Current matrix as identity
     */
    reset(): AffineMatrix;
    /**
     * Creates a new Matrix with the same data as the current 4x4
     */
    clone(dest?: AffineMatrix): AffineMatrix;
    toString(): string;
}
