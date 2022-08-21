import { AffineMatrix } from '../../Math/affine-matrix';
export declare class TransformStack {
    private _transforms;
    private _currentTransform;
    save(): void;
    restore(): void;
    translate(x: number, y: number): AffineMatrix;
    rotate(angle: number): AffineMatrix;
    scale(x: number, y: number): AffineMatrix;
    set current(matrix: AffineMatrix);
    get current(): AffineMatrix;
}
