import { AffineMatrix } from '../../Math/affine-matrix';
import { ExcaliburGraphicsContextState } from './ExcaliburGraphicsContext';
export declare class DrawCall {
    z: number;
    priority: number;
    renderer: string;
    transform: AffineMatrix;
    state: ExcaliburGraphicsContextState;
    args: any[];
}
