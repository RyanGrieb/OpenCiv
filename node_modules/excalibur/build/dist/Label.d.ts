import { Engine } from './Engine';
import { Color } from './Color';
import { Vector } from './Math/vector';
import { SpriteFont } from './Graphics';
import { Font } from './Graphics/Font';
import { Actor } from './Actor';
import { ActorArgs } from '.';
/**
 * Option for creating a label
 */
export interface LabelOptions {
    /**
     * Specify the label text
     */
    text?: string;
    /**
     * Specify the color of the text (does not apply to SpriteFonts)
     */
    color?: Color;
    x?: number;
    y?: number;
    pos?: Vector;
    /**
     * Optionally specify a sprite font, will take precedence over any other [[Font]]
     */
    spriteFont?: SpriteFont;
    /**
     * Specify a custom font
     */
    font?: Font;
}
/**
 * Labels are the way to draw small amounts of text to the screen. They are
 * actors and inherit all of the benefits and capabilities.
 */
export declare class Label extends Actor {
    private _font;
    private _text;
    get font(): Font;
    set font(newFont: Font);
    /**
     * The text to draw.
     */
    get text(): string;
    set text(text: string);
    get color(): Color;
    set color(color: Color);
    get opacity(): number;
    set opacity(opacity: number);
    private _spriteFont;
    /**
     * The [[SpriteFont]] to use, if any. Overrides [[Font|font]] if present.
     */
    get spriteFont(): SpriteFont;
    set spriteFont(sf: SpriteFont);
    /**
     * Build a new label
     * @param options
     */
    constructor(options?: LabelOptions & ActorArgs);
    _initialize(engine: Engine): void;
    /**
     * Returns the width of the text in the label (in pixels);
     */
    getTextWidth(): number;
}
