import { Entity } from '../EntityComponentSystem';
import { AddedEntity, RemovedEntity, System, SystemType } from '../EntityComponentSystem/System';
import { ActionsComponent } from './ActionsComponent';
export declare class ActionsSystem extends System<ActionsComponent> {
    readonly types: readonly ["ex.actions"];
    systemType: SystemType;
    priority: number;
    private _actions;
    notify(entityAddedOrRemoved: AddedEntity | RemovedEntity): void;
    update(_entities: Entity[], delta: number): void;
}
