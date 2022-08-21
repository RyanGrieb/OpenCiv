import { Vector } from '../../../Math/vector';
import { Color } from '../../../Color';
import { ExcaliburGraphicsContextWebGL } from '../ExcaliburGraphicsContextWebGL';
import { RendererPlugin } from '../renderer';
export declare class LineRenderer implements RendererPlugin {
    readonly type = "ex.line";
    priority: number;
    private _context;
    private _gl;
    private _shader;
    private _maxLines;
    private _vertexBuffer;
    private _layout;
    private _vertexIndex;
    private _lineCount;
    initialize(gl: WebGLRenderingContext, context: ExcaliburGraphicsContextWebGL): void;
    draw(start: Vector, end: Vector, color: Color): void;
    private _isFull;
    hasPendingDraws(): boolean;
    flush(): void;
}
