import { Scene } from '../Scene';
import { Entity, TransformComponent } from '../EntityComponentSystem';
import { System, SystemType } from '../EntityComponentSystem/System';
export declare class DebugSystem extends System<TransformComponent> {
    readonly types: readonly ["ex.transform"];
    readonly systemType = SystemType.Draw;
    priority: number;
    private _graphicsContext;
    private _collisionSystem;
    private _camera;
    private _engine;
    initialize(scene: Scene): void;
    update(entities: Entity[], _delta: number): void;
    /**
     * This applies the current entity transform to the graphics context
     * @param entity
     */
    private _applyTransform;
    /**
     * Applies the current camera transform if in world coordinates
     * @param transform
     */
    private _pushCameraTransform;
    /**
     * Resets the current camera transform if in world coordinates
     * @param transform
     */
    private _popCameraTransform;
}
