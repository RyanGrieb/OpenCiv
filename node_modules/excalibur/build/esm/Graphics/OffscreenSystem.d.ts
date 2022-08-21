import { GraphicsComponent } from './GraphicsComponent';
import { Scene } from '../Scene';
import { Entity } from '../EntityComponentSystem/Entity';
import { TransformComponent } from '../EntityComponentSystem/Components/TransformComponent';
import { System, SystemType } from '../EntityComponentSystem/System';
export declare class OffscreenSystem extends System<TransformComponent | GraphicsComponent> {
    readonly types: readonly ["ex.transform", "ex.graphics"];
    systemType: SystemType;
    priority: number;
    private _camera;
    initialize(scene: Scene): void;
    update(entities: Entity[]): void;
    private _isOffscreen;
}
