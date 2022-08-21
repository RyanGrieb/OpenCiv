import { ImageSource } from './ImageSource';
import { SourceView, Sprite } from './Sprite';
/**
 * Specify sprite sheet spacing options, useful if your sprites are not tightly packed
 * and have space between them.
 */
export interface SpriteSheetSpacingDimensions {
    /**
     * The starting point to offset and start slicing the sprite sheet from the top left of the image.
     * Default is (0, 0)
     */
    originOffset?: {
        x?: number;
        y?: number;
    };
    /**
     * The margin between sprites.
     * Default is (0, 0)
     */
    margin?: {
        x?: number;
        y?: number;
    };
}
/**
 * Sprite sheet options for slicing up images
 */
export interface SpriteSheetGridOptions {
    /**
     * Source image to use for each sprite
     */
    image: ImageSource;
    /**
     * Grid definition for the sprite sheet
     */
    grid: {
        /**
         * Number of rows in the sprite sheet
         */
        rows: number;
        /**
         * Number of columns in the sprite sheet
         */
        columns: number;
        /**
         * Width of each individual sprite
         */
        spriteWidth: number;
        /**
         * Height of each individual sprite
         */
        spriteHeight: number;
    };
    /**
     * Optionally specify any spacing information between sprites
     */
    spacing?: SpriteSheetSpacingDimensions;
}
export interface SpriteSheetSparseOptions {
    /**
     * Source image to use for each sprite
     */
    image: ImageSource;
    /**
     * List of source view rectangles to create a sprite sheet from
     */
    sourceViews: SourceView[];
}
export interface SpriteSheetOptions {
    /**
     * Source sprites for the sprite sheet
     */
    sprites: Sprite[];
    /**
     * Optionally specify the number of rows in a sprite sheet (default 1 row)
     */
    rows?: number;
    /**
     * Optionally specify the number of columns in a sprite sheet (default sprites.length)
     */
    columns?: number;
}
/**
 * Represents a collection of sprites from a source image with some organization in a grid
 */
export declare class SpriteSheet {
    private _logger;
    readonly sprites: Sprite[];
    readonly rows: number;
    readonly columns: number;
    /**
     * Build a new sprite sheet from a list of sprites
     *
     * Use [[SpriteSheet.fromImageSource]] to create a SpriteSheet from an [[ImageSource]] organized in a grid
     * @param options
     */
    constructor(options: SpriteSheetOptions);
    /**
     * Find a sprite by their x/y position in the SpriteSheet, for example `getSprite(0, 0)` is the [[Sprite]] in the top-left
     * @param x
     * @param y
     */
    getSprite(x: number, y: number): Sprite | null;
    /**
     * Create a sprite sheet from a sparse set of [[SourceView]] rectangles
     * @param options
     */
    static fromImageSourceWithSourceViews(options: SpriteSheetSparseOptions): SpriteSheet;
    /**
     * Create a SpriteSheet from an [[ImageSource]] organized in a grid
     *
     * Example:
     * ```
     * const spriteSheet = SpriteSheet.fromImageSource({
     *   image: imageSource,
     *   grid: {
     *     rows: 5,
     *     columns: 2,
     *     spriteWidth: 32, // pixels
     *     spriteHeight: 32 // pixels
     *   },
     *   // Optionally specify spacing
     *   spacing: {
     *     // pixels from the top left to start the sprite parsing
     *     originOffset: {
     *       x: 5,
     *       y: 5
     *     },
     *     // pixels between each sprite while parsing
     *     margin: {
     *       x: 1,
     *       y: 1
     *     }
     *   }
     * })
     * ```
     *
     * @param options
     */
    static fromImageSource(options: SpriteSheetGridOptions): SpriteSheet;
}
