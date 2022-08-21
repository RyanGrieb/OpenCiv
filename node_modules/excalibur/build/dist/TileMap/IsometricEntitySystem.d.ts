import { System, SystemType } from '../EntityComponentSystem/System';
import { Entity } from '../EntityComponentSystem/Entity';
import { TransformComponent } from '../EntityComponentSystem/Components/TransformComponent';
import { IsometricEntityComponent } from './IsometricEntityComponent';
export declare class IsometricEntitySystem extends System<TransformComponent | IsometricEntityComponent> {
    readonly types: readonly ["ex.transform", "ex.isometricentity"];
    readonly systemType = SystemType.Update;
    priority: number;
    update(entities: Entity[], _delta: number): void;
}
