import { ExcaliburGraphicsContext } from '..';
import { Vector } from '../..';
/**
 * Internal debugtext helper
 */
export declare class DebugText {
    constructor();
    /**
     * base64 font
     */
    readonly fontSheet: string;
    size: number;
    private _imageSource;
    private _spriteSheet;
    private _spriteFont;
    load(): Promise<void>;
    /**
     * Writes debug text using the built in sprint font
     * @param ctx
     * @param text
     * @param pos
     */
    write(ctx: ExcaliburGraphicsContext, text: string, pos: Vector): void;
}
