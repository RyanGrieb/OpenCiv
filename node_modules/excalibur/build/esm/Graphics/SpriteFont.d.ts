import { Vector } from '../Math/vector';
import { ExcaliburGraphicsContext } from './Context/ExcaliburGraphicsContext';
import { FontRenderer } from './FontCommon';
import { Graphic, GraphicOptions } from './Graphic';
import { SpriteSheet } from './SpriteSheet';
import { BoundingBox, Color } from '..';
export interface SpriteFontOptions {
    /**
     * Alphabet string in spritesheet order (default is row column order)
     * example: 'abcdefghijklmnopqrstuvwxyz'
     */
    alphabet: string;
    /**
     * [[SpriteSheet]] to source character sprites from
     */
    spriteSheet: SpriteSheet;
    /**
     * Optionally ignore case in the supplied text;
     */
    caseInsensitive?: boolean;
    /**
     * Optionally adjust the spacing between character sprites
     */
    spacing?: number;
    /**
     * Optionally specify a "shadow"
     */
    shadow?: {
        offset: Vector;
    };
}
export declare class SpriteFont extends Graphic implements FontRenderer {
    private _text;
    alphabet: string;
    spriteSheet: SpriteSheet;
    shadow: {
        offset: Vector;
    };
    caseInsensitive: boolean;
    spacing: number;
    private _logger;
    constructor(options: SpriteFontOptions & GraphicOptions);
    private _alreadyWarnedAlphabet;
    private _alreadyWarnedSpriteSheet;
    private _getCharacterSprites;
    measureText(text: string): BoundingBox;
    protected _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void;
    render(ex: ExcaliburGraphicsContext, text: string, _color: Color, x: number, y: number): void;
    clone(): SpriteFont;
}
