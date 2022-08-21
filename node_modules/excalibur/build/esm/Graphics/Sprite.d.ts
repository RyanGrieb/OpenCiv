import { Graphic, GraphicOptions } from './Graphic';
import { ImageSource } from './ImageSource';
import { ExcaliburGraphicsContext } from './Context/ExcaliburGraphicsContext';
export declare type SourceView = {
    x: number;
    y: number;
    width: number;
    height: number;
};
export declare type DestinationSize = {
    width: number;
    height: number;
};
export interface SpriteOptions {
    /**
     * Image to create a sprite from
     */
    image: ImageSource;
    /**
     * By default the source is the entire dimension of the [[ImageSource]]
     */
    sourceView?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    /**
     * By default the size of the final sprite is the size of the [[ImageSource]]
     */
    destSize?: {
        width: number;
        height: number;
    };
}
export declare class Sprite extends Graphic {
    private _logger;
    image: ImageSource;
    sourceView: SourceView;
    destSize: DestinationSize;
    private _dirty;
    static from(image: ImageSource): Sprite;
    constructor(options: GraphicOptions & SpriteOptions);
    get width(): number;
    get height(): number;
    set width(newWidth: number);
    set height(newHeight: number);
    private _updateSpriteDimensions;
    protected _preDraw(ex: ExcaliburGraphicsContext, x: number, y: number): void;
    private _logNotLoadedWarning;
    _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void;
    clone(): Sprite;
}
