import { CollisionProcessor } from './CollisionProcessor';
import { Pair } from './Pair';
import { FrameStats } from '../../Debug';
import { Collider } from '../Colliders/Collider';
import { CollisionContact } from '../Detection/CollisionContact';
import { ExcaliburGraphicsContext } from '../..';
/**
 * Responsible for performing the collision broadphase (locating potential collisions) and
 * the narrowphase (actual collision contacts)
 */
export declare class DynamicTreeCollisionProcessor implements CollisionProcessor {
    private _dynamicCollisionTree;
    private _pairs;
    private _collisionPairCache;
    private _colliders;
    getColliders(): readonly Collider[];
    /**
     * Tracks a physics body for collisions
     */
    track(target: Collider): void;
    /**
     * Untracks a physics body
     */
    untrack(target: Collider): void;
    private _pairExists;
    /**
     * Detects potential collision pairs in a broadphase approach with the dynamic AABB tree strategy
     */
    broadphase(targets: Collider[], delta: number, stats?: FrameStats): Pair[];
    /**
     * Applies narrow phase on collision pairs to find actual area intersections
     * Adds actual colliding pairs to stats' Frame data
     */
    narrowphase(pairs: Pair[], stats?: FrameStats): CollisionContact[];
    /**
     * Update the dynamic tree positions
     */
    update(targets: Collider[]): number;
    debug(ex: ExcaliburGraphicsContext): void;
}
