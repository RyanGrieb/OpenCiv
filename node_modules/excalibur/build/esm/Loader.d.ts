import { Color } from './Color';
import { Engine } from './Engine';
import { Loadable } from './Interfaces/Loadable';
import { Class } from './Class';
import { Canvas } from './Graphics/Canvas';
import { Vector } from './Math/vector';
/**
 * Pre-loading assets
 *
 * The loader provides a mechanism to preload multiple resources at
 * one time. The loader must be passed to the engine in order to
 * trigger the loading progress bar.
 *
 * The [[Loader]] itself implements [[Loadable]] so you can load loaders.
 *
 * ## Example: Pre-loading resources for a game
 *
 * ```js
 * // create a loader
 * var loader = new ex.Loader();
 *
 * // create a resource dictionary (best practice is to keep a separate file)
 * var resources = {
 *   TextureGround: new ex.Texture("/images/textures/ground.png"),
 *   SoundDeath: new ex.Sound("/sound/death.wav", "/sound/death.mp3")
 * };
 *
 * // loop through dictionary and add to loader
 * for (var loadable in resources) {
 *   if (resources.hasOwnProperty(loadable)) {
 *     loader.addResource(resources[loadable]);
 *   }
 * }
 *
 * // start game
 * game.start(loader).then(function () {
 *   console.log("Game started!");
 * });
 * ```
 *
 * ## Customize the Loader
 *
 * The loader can be customized to show different, text, logo, background color, and button.
 *
 * ```typescript
 * const loader = new ex.Loader([playerTexture]);
 *
 * // The loaders button text can simply modified using this
 * loader.playButtonText = 'Start the best game ever';
 *
 * // The logo can be changed by inserting a base64 image string here
 *
 * loader.logo = 'data:image/png;base64,iVBORw...';
 * loader.logoWidth = 15;
 * loader.logoHeight = 14;
 *
 * // The background color can be changed like so by supplying a valid CSS color string
 *
 * loader.backgroundColor = 'red'
 * loader.backgroundColor = '#176BAA'
 *
 * // To build a completely new button
 * loader.startButtonFactory = () => {
 *     let myButton = document.createElement('button');
 *     myButton.textContent = 'The best button';
 *     return myButton;
 * };
 *
 * engine.start(loader).then(() => {});
 * ```
 */
export declare class Loader extends Class implements Loadable<Loadable<any>[]> {
    canvas: Canvas;
    private _resourceList;
    private _index;
    private _playButtonShown;
    private _resourceCount;
    private _numLoaded;
    private _progressCounts;
    private _totalCounts;
    private _engine;
    logo: string;
    logoWidth: number;
    logoHeight: number;
    /**
     * Positions the top left corner of the logo image
     * If not set, the loader automatically positions the logo
     */
    logoPosition: Vector | null;
    /**
     * Positions the top left corner of the play button.
     * If not set, the loader automatically positions the play button
     */
    playButtonPosition: Vector | null;
    /**
     * Positions the top left corner of the loading bar
     * If not set, the loader automatically positions the loading bar
     */
    loadingBarPosition: Vector | null;
    /**
     * Gets or sets the color of the loading bar, default is [[Color.White]]
     */
    loadingBarColor: Color;
    /**
     * Gets or sets the background color of the loader as a hex string
     */
    backgroundColor: string;
    protected _imageElement: HTMLImageElement;
    protected get _image(): HTMLImageElement;
    suppressPlayButton: boolean;
    get playButtonRootElement(): HTMLElement | null;
    get playButtonElement(): HTMLButtonElement | null;
    protected _playButtonRootElement: HTMLElement;
    protected _playButtonElement: HTMLButtonElement;
    protected _styleBlock: HTMLStyleElement;
    /** Loads the css from Loader.css */
    protected _playButtonStyles: string;
    protected get _playButton(): HTMLButtonElement;
    /**
     * Get/set play button text
     */
    playButtonText: string;
    /**
     * Return a html button element for excalibur to use as a play button
     */
    startButtonFactory: () => HTMLButtonElement;
    /**
     * @param loadables  Optionally provide the list of resources you want to load at constructor time
     */
    constructor(loadables?: Loadable<any>[]);
    wireEngine(engine: Engine): void;
    /**
     * Add a resource to the loader to load
     * @param loadable  Resource to add
     */
    addResource(loadable: Loadable<any>): void;
    /**
     * Add a list of resources to the loader to load
     * @param loadables  The list of resources to load
     */
    addResources(loadables: Loadable<any>[]): void;
    /**
     * Returns true if the loader has completely loaded all resources
     */
    isLoaded(): boolean;
    /**
     * Shows the play button and returns a promise that resolves when clicked
     */
    showPlayButton(): Promise<void>;
    hidePlayButton(): void;
    /**
     * Clean up generated elements for the loader
     */
    dispose(): void;
    update(_engine: Engine, _delta: number): void;
    data: Loadable<any>[];
    private _loadingFuture;
    areResourcesLoaded(): Promise<void>;
    /**
     * Begin loading all of the supplied resources, returning a promise
     * that resolves when loading of all is complete AND the user has clicked the "Play button"
     */
    load(): Promise<Loadable<any>[]>;
    markResourceComplete(): void;
    /**
     * Returns the progress of the loader as a number between [0, 1] inclusive.
     */
    get progress(): number;
    private _positionPlayButton;
    /**
     * Loader draw function. Draws the default Excalibur loading screen.
     * Override `logo`, `logoWidth`, `logoHeight` and `backgroundColor` properties
     * to customize the drawing, or just override entire method.
     */
    draw(ctx: CanvasRenderingContext2D): void;
}
