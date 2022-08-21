import { Entity } from '../EntityComponentSystem';
import { MotionComponent } from '../EntityComponentSystem/Components/MotionComponent';
import { TransformComponent } from '../EntityComponentSystem/Components/TransformComponent';
import { System, SystemType } from '../EntityComponentSystem/System';
export declare class MotionSystem extends System<TransformComponent | MotionComponent> {
    readonly types: readonly ["ex.transform", "ex.motion"];
    systemType: SystemType;
    priority: number;
    update(entities: Entity[], elapsedMs: number): void;
}
