import { Vector } from '../../../Math/vector';
import { Color } from '../../../Color';
import { ExcaliburGraphicsContextWebGL } from '../ExcaliburGraphicsContextWebGL';
import { RendererPlugin } from '../renderer';
export declare class PointRenderer implements RendererPlugin {
    readonly type = "ex.point";
    priority: number;
    private _shader;
    private _maxPoints;
    private _buffer;
    private _layout;
    private _gl;
    private _context;
    private _pointCount;
    private _vertexIndex;
    initialize(gl: WebGLRenderingContext, context: ExcaliburGraphicsContextWebGL): void;
    draw(point: Vector, color: Color, size: number): void;
    private _isFull;
    hasPendingDraws(): boolean;
    flush(): void;
}
