import { Entity } from '../EntityComponentSystem';
import { MotionComponent } from '../EntityComponentSystem/Components/MotionComponent';
import { TransformComponent } from '../EntityComponentSystem/Components/TransformComponent';
import { AddedEntity, RemovedEntity, System, SystemType } from '../EntityComponentSystem/System';
import { CollisionSolver } from './Solver/Solver';
import { ColliderComponent } from './ColliderComponent';
import { ExcaliburGraphicsContext, Scene } from '..';
export declare class CollisionSystem extends System<TransformComponent | MotionComponent | ColliderComponent> {
    readonly types: readonly ["ex.transform", "ex.motion", "ex.collider"];
    systemType: SystemType;
    priority: number;
    private _engine;
    private _realisticSolver;
    private _arcadeSolver;
    private _processor;
    private _lastFrameContacts;
    private _currentFrameContacts;
    private _trackCollider;
    private _untrackCollider;
    notify(message: AddedEntity | RemovedEntity): void;
    initialize(scene: Scene): void;
    update(entities: Entity[], elapsedMs: number): void;
    getSolver(): CollisionSolver;
    debug(ex: ExcaliburGraphicsContext): void;
    runContactStartEnd(): void;
}
