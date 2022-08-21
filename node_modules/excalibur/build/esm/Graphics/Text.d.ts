import { ExcaliburGraphicsContext } from './Context/ExcaliburGraphicsContext';
import { BoundingBox } from '../Collision/BoundingBox';
import { SpriteFont } from './SpriteFont';
import { Graphic, GraphicOptions } from './Graphic';
import { Color } from '../Color';
import { Font } from './Font';
export interface TextOptions {
    /**
     * Text to draw
     */
    text: string;
    /**
     * Optionally override the font color, currently unsupported by SpriteFont
     */
    color?: Color;
    /**
     * Optionally specify a font, if none specified a default font is used (System sans-serif 10 pixel)
     */
    font?: Font | SpriteFont;
}
/**
 * Represent Text graphics in excalibur
 *
 * Useful for in game labels, ui, or overlays
 */
export declare class Text extends Graphic {
    color?: Color;
    constructor(options: TextOptions & GraphicOptions);
    clone(): Text;
    private _text;
    get text(): string;
    set text(value: string);
    private _font;
    get font(): Font | SpriteFont;
    set font(font: Font | SpriteFont);
    private _textWidth;
    get width(): number;
    private _textHeight;
    get height(): number;
    private _calculateDimension;
    get localBounds(): BoundingBox;
    protected _rotate(_ex: ExcaliburGraphicsContext): void;
    protected _flip(_ex: ExcaliburGraphicsContext): void;
    protected _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void;
}
