import { Vector } from '../../Math/vector';
import { CoordPlane } from '../../Math/coord-plane';
import { Transform } from '../../Math/transform';
import { Component } from '../Component';
import { Entity } from '../Entity';
import { Observable } from '../../Util/Observable';
export declare class TransformComponent extends Component<'ex.transform'> {
    readonly type = "ex.transform";
    private _transform;
    get(): Transform;
    private _addChildTransform;
    onAdd(owner: Entity): void;
    onRemove(_previousOwner: Entity): void;
    /**
     * Observable that emits when the z index changes on this component
     */
    zIndexChanged$: Observable<number>;
    private _z;
    /**
     * The z-index ordering of the entity, a higher values are drawn on top of lower values.
     * For example z=99 would be drawn on top of z=0.
     */
    get z(): number;
    set z(val: number);
    /**
     * The [[CoordPlane|coordinate plane|]] for this transform for the entity.
     */
    coordPlane: CoordPlane;
    get pos(): Vector;
    set pos(v: Vector);
    get globalPos(): Vector;
    set globalPos(v: Vector);
    get rotation(): number;
    set rotation(rotation: number);
    get globalRotation(): number;
    set globalRotation(rotation: number);
    get scale(): Vector;
    set scale(v: Vector);
    get globalScale(): Vector;
    set globalScale(v: Vector);
    applyInverse(v: Vector): Vector;
    apply(v: Vector): Vector;
}
