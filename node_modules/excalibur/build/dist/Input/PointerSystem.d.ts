import { System, TransformComponent, SystemType, Entity, AddedEntity, RemovedEntity } from '../EntityComponentSystem';
import { Scene } from '../Scene';
import { PointerComponent } from './PointerComponent';
/**
 * The PointerSystem is responsible for dispatching pointer events to entities
 * that need them.
 *
 * The PointerSystem can be optionally configured by the [[PointerComponent]], by default Entities use
 * the [[Collider]]'s shape for pointer events.
 */
export declare class PointerSystem extends System<TransformComponent | PointerComponent> {
    readonly types: readonly ["ex.transform", "ex.pointer"];
    readonly systemType = SystemType.Update;
    priority: number;
    private _engine;
    private _receiver;
    /**
     * Optionally override component configuration for all entities
     */
    overrideUseColliderShape: boolean;
    /**
     * Optionally override component configuration for all entities
     */
    overrideUseGraphicsBounds: boolean;
    lastFrameEntityToPointers: Map<number, number[]>;
    currentFrameEntityToPointers: Map<number, number[]>;
    initialize(scene: Scene): void;
    private _sortedTransforms;
    private _sortedEntities;
    private _zHasChanged;
    private _zIndexUpdate;
    preupdate(): void;
    notify(entityAddedOrRemoved: AddedEntity | RemovedEntity): void;
    entityCurrentlyUnderPointer(entity: Entity, pointerId: number): boolean;
    entityWasUnderPointer(entity: Entity, pointerId: number): boolean;
    entered(entity: Entity, pointerId: number): boolean;
    left(entity: Entity, pointerId: number): boolean;
    addPointerToEntity(entity: Entity, pointerId: number): void;
    update(_entities: Entity[]): void;
    private _processPointerToEntity;
    private _processDownAndEmit;
    private _processUpAndEmit;
    private _processMoveAndEmit;
    private _processEnterLeaveAndEmit;
    private _processCancelAndEmit;
    private _processWheelAndEmit;
    private _dispatchEvents;
}
