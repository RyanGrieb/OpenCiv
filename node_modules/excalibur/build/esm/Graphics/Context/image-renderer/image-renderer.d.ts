import { HTMLImageSource } from '../ExcaliburGraphicsContext';
import { ExcaliburGraphicsContextWebGL } from '../ExcaliburGraphicsContextWebGL';
import { RendererPlugin } from '../renderer';
export declare class ImageRenderer implements RendererPlugin {
    readonly type = "ex.image";
    priority: number;
    private _maxImages;
    private _maxTextures;
    private _context;
    private _gl;
    private _shader;
    private _buffer;
    private _layout;
    private _quads;
    private _imageCount;
    private _textures;
    private _vertexIndex;
    initialize(gl: WebGLRenderingContext, context: ExcaliburGraphicsContextWebGL): void;
    private _transformFragmentSource;
    private _addImageAsTexture;
    private _bindTextures;
    private _getTextureIdForImage;
    private _isFull;
    draw(image: HTMLImageSource, sx: number, sy: number, swidth?: number, sheight?: number, dx?: number, dy?: number, dwidth?: number, dheight?: number): void;
    hasPendingDraws(): boolean;
    flush(): void;
}
