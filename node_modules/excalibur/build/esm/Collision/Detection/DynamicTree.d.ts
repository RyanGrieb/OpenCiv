import { BoundingBox } from '../BoundingBox';
import { Ray } from '../../Math/ray';
import { Id } from '../../Id';
import { Entity } from '../../EntityComponentSystem/Entity';
import { ExcaliburGraphicsContext } from '../..';
/**
 * Dynamic Tree Node used for tracking bounds within the tree
 */
export declare class TreeNode<T> {
    parent?: TreeNode<T>;
    left: TreeNode<T>;
    right: TreeNode<T>;
    bounds: BoundingBox;
    height: number;
    data: T;
    constructor(parent?: TreeNode<T>);
    isLeaf(): boolean;
}
export interface ColliderProxy<T> {
    id: Id<'collider'>;
    owner: T;
    bounds: BoundingBox;
}
/**
 * The DynamicTrees provides a spatial partitioning data structure for quickly querying for overlapping bounding boxes for
 * all tracked bodies. The worst case performance of this is O(n*log(n)) where n is the number of bodies in the tree.
 *
 * Internally the bounding boxes are organized as a balanced binary tree of bounding boxes, where the leaf nodes are tracked bodies.
 * Every non-leaf node is a bounding box that contains child bounding boxes.
 */
export declare class DynamicTree<T extends ColliderProxy<Entity>> {
    worldBounds: BoundingBox;
    root: TreeNode<T>;
    nodes: {
        [key: number]: TreeNode<T>;
    };
    constructor(worldBounds?: BoundingBox);
    /**
     * Inserts a node into the dynamic tree
     */
    private _insert;
    /**
     * Removes a node from the dynamic tree
     */
    private _remove;
    /**
     * Tracks a body in the dynamic tree
     */
    trackCollider(collider: T): void;
    /**
     * Updates the dynamic tree given the current bounds of each body being tracked
     */
    updateCollider(collider: T): boolean;
    /**
     * Untracks a body from the dynamic tree
     */
    untrackCollider(collider: T): void;
    /**
     * Balances the tree about a node
     */
    private _balance;
    /**
     * Returns the internal height of the tree, shorter trees are better. Performance drops as the tree grows
     */
    getHeight(): number;
    /**
     * Queries the Dynamic Axis Aligned Tree for bodies that could be colliding with the provided body.
     *
     * In the query callback, it will be passed a potential collider. Returning true from this callback indicates
     * that you are complete with your query and you do not want to continue. Returning false will continue searching
     * the tree until all possible colliders have been returned.
     */
    query(collider: T, callback: (other: T) => boolean): void;
    /**
     * Queries the Dynamic Axis Aligned Tree for bodies that could be intersecting. By default the raycast query uses an infinitely
     * long ray to test the tree specified by `max`.
     *
     * In the query callback, it will be passed a potential body that intersects with the raycast. Returning true from this
     * callback indicates that your are complete with your query and do not want to continue. Return false will continue searching
     * the tree until all possible bodies that would intersect with the ray have been returned.
     */
    rayCastQuery(ray: Ray, max: number, callback: (other: T) => boolean): void;
    getNodes(): TreeNode<T>[];
    debug(ex: ExcaliburGraphicsContext): void;
}
