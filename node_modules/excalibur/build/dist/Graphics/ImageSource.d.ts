import { Sprite } from './Sprite';
import { Loadable } from '../Interfaces/Index';
import { ImageFiltering } from './Filtering';
export declare class ImageSource implements Loadable<HTMLImageElement> {
    readonly path: string;
    private _logger;
    private _resource;
    private _filtering;
    /**
     * The original size of the source image in pixels
     */
    get width(): number;
    /**
     * The original height of the source image in pixels
     */
    get height(): number;
    private _src;
    /**
     * Returns true if the Texture is completely loaded and is ready
     * to be drawn.
     */
    isLoaded(): boolean;
    /**
     * Access to the underlying html image element
     */
    data: HTMLImageElement;
    get image(): HTMLImageElement;
    private _readyFuture;
    /**
     * Promise the resolves when the image is loaded and ready for use, does not initiate loading
     */
    ready: Promise<HTMLImageElement>;
    /**
     * The path to the image, can also be a data url like 'data:image/'
     * @param path {string} Path to the image resource relative from the HTML document hosting the game, or absolute
     * @param bustCache {boolean} Should excalibur add a cache busting querystring?
     * @param filtering {ImageFiltering} Optionally override the image filtering set by [[EngineOptions.antialiasing]]
     */
    constructor(path: string, bustCache?: boolean, filtering?: ImageFiltering);
    /**
     * Begins loading the image and returns a promise that resolves when the image is loaded
     */
    load(): Promise<HTMLImageElement>;
    /**
     * Build a sprite from this ImageSource
     */
    toSprite(): Sprite;
    /**
     * Unload images from memory
     */
    unload(): void;
}
