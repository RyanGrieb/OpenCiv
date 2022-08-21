import { ImageFiltering } from '../Filtering';
import { HTMLImageSource } from './ExcaliburGraphicsContext';
/**
 * Manages loading image sources into webgl textures, a unique id is associated with all sources
 */
export declare class TextureLoader {
    private static _LOGGER;
    /**
     * Sets the default filtering for the Excalibur texture loader, default [[ImageFiltering.Blended]]
     */
    static filtering: ImageFiltering;
    private static _GL;
    private static _TEXTURE_MAP;
    private static _MAX_TEXTURE_SIZE;
    static register(context: WebGLRenderingContext): void;
    /**
     * Get the WebGL Texture from a source image
     * @param image
     */
    static get(image: HTMLImageSource): WebGLTexture;
    /**
     * Returns whether a source image has been loaded as a texture
     * @param image
     */
    static has(image: HTMLImageSource): boolean;
    /**
     * Loads a graphic into webgl and returns it's texture info, a webgl context must be previously registered
     * @param image Source graphic
     * @param filtering {ImageFiltering} The ImageFiltering mode to apply to the loaded texture
     * @param forceUpdate Optionally force a texture to be reloaded, useful if the source graphic has changed
     */
    static load(image: HTMLImageSource, filtering?: ImageFiltering, forceUpdate?: boolean): WebGLTexture;
    static delete(image: HTMLImageSource): void;
    /**
     * Takes an image and returns if it meets size criteria for hardware
     * @param image
     * @returns if the image will be supported at runtime
     */
    static checkImageSizeSupportedAndLog(image: HTMLImageSource): boolean;
}
