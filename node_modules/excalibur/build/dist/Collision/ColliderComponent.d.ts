import { Vector } from '../Math/vector';
import { Component } from '../EntityComponentSystem/Component';
import { Entity } from '../EntityComponentSystem/Entity';
import { EventDispatcher } from '../EventDispatcher';
import { Observable } from '../Util/Observable';
import { BoundingBox } from './BoundingBox';
import { CollisionContact } from './Detection/CollisionContact';
import { CircleCollider } from './Colliders/CircleCollider';
import { Collider } from './Colliders/Collider';
import { CompositeCollider } from './Colliders/CompositeCollider';
import { PolygonCollider } from './Colliders/PolygonCollider';
import { EdgeCollider } from './Colliders/EdgeCollider';
export declare class ColliderComponent extends Component<'ex.collider'> {
    readonly type = "ex.collider";
    events: EventDispatcher<any>;
    /**
     * Observable that notifies when a collider is added to the body
     */
    $colliderAdded: Observable<Collider>;
    /**
     * Observable that notifies when a collider is removed from the body
     */
    $colliderRemoved: Observable<Collider>;
    constructor(collider?: Collider);
    private _collider;
    /**
     * Get the current collider geometry
     */
    get(): Collider;
    /**
     * Set the collider geometry
     * @param collider
     * @returns the collider you set
     */
    set<T extends Collider>(collider: T): T;
    /**
     * Remove collider geometry from collider component
     */
    clear(): void;
    /**
     * Return world space bounds
     */
    get bounds(): BoundingBox;
    /**
     * Return local space bounds
     */
    get localBounds(): BoundingBox;
    /**
     * Update the collider's transformed geometry
     */
    update(): void;
    /**
     * Collide component with another
     * @param other
     */
    collide(other: ColliderComponent): CollisionContact[];
    onAdd(entity: Entity): void;
    onRemove(): void;
    /**
     * Sets up a box geometry based on the current bounds of the associated actor of this physics body.
     *
     * If no width/height are specified the body will attempt to use the associated actor's width/height.
     *
     * By default, the box is center is at (0, 0) which means it is centered around the actors anchor.
     */
    useBoxCollider(width: number, height: number, anchor?: Vector, center?: Vector): PolygonCollider;
    /**
     * Sets up a [[PolygonCollider|polygon]] collision geometry based on a list of of points relative
     *  to the anchor of the associated actor
     * of this physics body.
     *
     * Only [convex polygon](https://en.wikipedia.org/wiki/Convex_polygon) definitions are supported.
     *
     * By default, the box is center is at (0, 0) which means it is centered around the actors anchor.
     */
    usePolygonCollider(points: Vector[], center?: Vector): PolygonCollider;
    /**
     * Sets up a [[Circle|circle collision geometry]] as the only collider with a specified radius in pixels.
     *
     * By default, the box is center is at (0, 0) which means it is centered around the actors anchor.
     */
    useCircleCollider(radius: number, center?: Vector): CircleCollider;
    /**
     * Sets up an [[Edge|edge collision geometry]] with a start point and an end point relative to the anchor of the associated actor
     * of this physics body.
     *
     * By default, the box is center is at (0, 0) which means it is centered around the actors anchor.
     */
    useEdgeCollider(begin: Vector, end: Vector): EdgeCollider;
    /**
     * Setups up a [[CompositeCollider]] which can define any arbitrary set of excalibur colliders
     * @param colliders
     */
    useCompositeCollider(colliders: Collider[]): CompositeCollider;
}
