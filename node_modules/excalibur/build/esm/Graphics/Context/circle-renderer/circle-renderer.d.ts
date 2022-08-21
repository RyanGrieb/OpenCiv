import { Color } from '../../../Color';
import { Vector } from '../../../Math/vector';
import { ExcaliburGraphicsContextWebGL } from '../ExcaliburGraphicsContextWebGL';
import { RendererPlugin } from '../renderer';
export declare class CircleRenderer implements RendererPlugin {
    readonly type = "ex.circle";
    priority: number;
    private _maxCircles;
    private _shader;
    private _context;
    private _gl;
    private _buffer;
    private _layout;
    private _quads;
    private _circleCount;
    private _vertexIndex;
    initialize(gl: WebGLRenderingContext, context: ExcaliburGraphicsContextWebGL): void;
    private _isFull;
    draw(pos: Vector, radius: number, color: Color, stroke?: Color, strokeThickness?: number): void;
    hasPendingDraws(): boolean;
    flush(): void;
}
