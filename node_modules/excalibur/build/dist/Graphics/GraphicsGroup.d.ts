import { Vector } from '../Math/vector';
import { Graphic, GraphicOptions } from './Graphic';
import { HasTick } from './Animation';
import { ExcaliburGraphicsContext } from './Context/ExcaliburGraphicsContext';
import { BoundingBox } from '../Collision/Index';
export interface GraphicsGroupingOptions {
    members: GraphicsGrouping[];
}
export interface GraphicsGrouping {
    pos: Vector;
    graphic: Graphic;
}
export declare class GraphicsGroup extends Graphic implements HasTick {
    members: GraphicsGrouping[];
    constructor(options: GraphicsGroupingOptions & GraphicOptions);
    clone(): GraphicsGroup;
    private _updateDimensions;
    get localBounds(): BoundingBox;
    private _isAnimationOrGroup;
    tick(elapsedMilliseconds: number, idempotencyToken?: number): void;
    reset(): void;
    protected _preDraw(ex: ExcaliburGraphicsContext, x: number, y: number): void;
    protected _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void;
}
