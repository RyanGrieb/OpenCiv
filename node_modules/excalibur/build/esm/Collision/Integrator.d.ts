import { Vector } from '../Math/vector';
import { TransformComponent } from '../EntityComponentSystem';
import { MotionComponent } from '../EntityComponentSystem/Components/MotionComponent';
export declare class EulerIntegrator {
    private static _POS;
    private static _SCALE;
    private static _ACC;
    private static _VEL;
    private static _VEL_ACC;
    private static _SCALE_FACTOR;
    static integrate(transform: TransformComponent, motion: MotionComponent, totalAcc: Vector, elapsedMs: number): void;
}
