import { Scene } from '../Scene';
import { GraphicsComponent } from './GraphicsComponent';
import { TransformComponent } from '../EntityComponentSystem/Components/TransformComponent';
import { Entity } from '../EntityComponentSystem/Entity';
import { AddedEntity, RemovedEntity, System, SystemType } from '../EntityComponentSystem';
export declare class GraphicsSystem extends System<TransformComponent | GraphicsComponent> {
    readonly types: readonly ["ex.transform", "ex.graphics"];
    readonly systemType = SystemType.Draw;
    priority: number;
    private _token;
    private _graphicsContext;
    private _camera;
    private _engine;
    private _sortedTransforms;
    get sortedTransforms(): TransformComponent[];
    initialize(scene: Scene): void;
    private _zHasChanged;
    private _zIndexUpdate;
    preupdate(): void;
    notify(entityAddedOrRemoved: AddedEntity | RemovedEntity): void;
    update(_entities: Entity[], delta: number): void;
    private _drawGraphicsComponent;
    /**
     * This applies the current entity transform to the graphics context
     * @param entity
     */
    private _applyTransform;
}
