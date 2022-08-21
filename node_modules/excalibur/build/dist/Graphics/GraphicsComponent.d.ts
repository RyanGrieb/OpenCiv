import { Vector } from '../Math/vector';
import { Graphic } from './Graphic';
import { HasTick } from './Animation';
import { ExcaliburGraphicsContext } from './Context/ExcaliburGraphicsContext';
import { BoundingBox } from '../Collision/Index';
import { Component } from '../EntityComponentSystem/Component';
/**
 * Type guard for checking if a Graphic HasTick (used for graphics that change over time like animations)
 * @param graphic
 */
export declare function hasGraphicsTick(graphic: Graphic): graphic is Graphic & HasTick;
export interface GraphicsShowOptions {
    offset?: Vector;
    anchor?: Vector;
}
export interface GraphicsComponentOptions {
    onPostDraw?: (ex: ExcaliburGraphicsContext, elapsed: number) => void;
    onPreDraw?: (ex: ExcaliburGraphicsContext, elapsed: number) => void;
    /**
     * Name of current graphic to use
     */
    current?: string;
    /**
     * Optionally copy instances of graphics by calling .clone(), you may set this to false to avoid sharing graphics when added to the
     * component for performance reasons. By default graphics are not copied and are shared when added to the component.
     */
    copyGraphics?: boolean;
    /**
     * Optional visible flag, if the graphics component is not visible it will not be displayed
     */
    visible?: boolean;
    /**
     * Optional opacity
     */
    opacity?: number;
    /**
     * List of graphics
     */
    graphics?: {
        [graphicName: string]: Graphic;
    };
    /**
     * Optional offset in absolute pixels to shift all graphics in this component from each graphic's anchor (default is top left corner)
     */
    offset?: Vector;
    /**
     * Optional anchor
     */
    anchor?: Vector;
}
export interface GraphicsLayerOptions {
    /**
     * Name of the layer required, for example 'background'
     */
    name: string;
    /**
     * Order of the layer, a layer with order -1 will be below a layer with order of 1
     */
    order: number;
    /**
     * Offset to shift the entire layer
     */
    offset?: Vector;
}
export declare class GraphicsLayer {
    private _options;
    private _graphics;
    graphics: {
        graphic: Graphic;
        options: GraphicsShowOptions;
    }[];
    constructor(_options: GraphicsLayerOptions, _graphics: GraphicsComponent);
    get name(): string;
    /**
     * Remove any instance(s) of a graphic currently being shown in this layer
     */
    hide(nameOrGraphic: string | Graphic): void;
    /**
     * Remove all currently shown graphics in this layer
     */
    hide(): void;
    /**
     * Show a graphic by name or instance at an offset, graphics are shown in the order in which `show()` is called.
     *
     * If `show()` is called multiple times for the same graphic it will be shown multiple times.
     * @param nameOrGraphic
     * @param options
     */
    show<T extends Graphic = Graphic>(nameOrGraphic: string | T, options?: GraphicsShowOptions): T;
    /**
     * Use a specific graphic, swap out any current graphics being shown
     * @param nameOrGraphic
     * @param options
     */
    use<T extends Graphic = Graphic>(nameOrGraphic: string | T, options?: GraphicsShowOptions): T;
    /**
     * Current order of the layer, higher numbers are on top, lower numbers are on the bottom.
     *
     * For example a layer with `order = -1` would be under a layer of `order = 1`
     */
    get order(): number;
    /**
     * Set the order of the layer, higher numbers are on top, lower numbers are on the bottom.
     *
     * For example a layer with `order = -1` would be under a layer of `order = 1`
     */
    set order(order: number);
    /**
     * Get or set the pixel offset from the layer anchor for all graphics in the layer
     */
    get offset(): Vector;
    set offset(value: Vector);
    get currentKeys(): string;
}
export declare class GraphicsLayers {
    private _component;
    private _layers;
    private _layerMap;
    default: GraphicsLayer;
    constructor(_component: GraphicsComponent);
    create(options: GraphicsLayerOptions): GraphicsLayer;
    /**
     * Retrieve a single layer by name
     * @param name
     */
    get(name: string): GraphicsLayer;
    /**
     * Retrieve all layers
     */
    get(): readonly GraphicsLayer[];
    currentKeys(): string[];
    has(name: string): boolean;
    private _maybeAddLayer;
    private _getLayer;
}
/**
 * Component to manage drawings, using with the position component
 */
export declare class GraphicsComponent extends Component<'ex.graphics'> {
    readonly type = "ex.graphics";
    private _graphics;
    layers: GraphicsLayers;
    getGraphic(name: string): Graphic | undefined;
    /**
     * Get registered graphics names
     */
    getNames(): string[];
    /**
     * Draws after the entity transform has bene applied, but before graphics component graphics have been drawn
     */
    onPreDraw: (ctx: ExcaliburGraphicsContext, elapsedMilliseconds: number) => void;
    /**
     * Draws after the entity transform has been applied, and after graphics component graphics has been drawn
     */
    onPostDraw: (ctx: ExcaliburGraphicsContext, elapsedMilliseconds: number) => void;
    /**
     * Sets or gets wether any drawing should be visible in this component
     */
    visible: boolean;
    /**
     * Sets or gets wither all drawings should have an opacity applied
     */
    opacity: number;
    /**
     * Offset to apply to graphics by default
     */
    offset: Vector;
    /**
     * Anchor to apply to graphics by default
     */
    anchor: Vector;
    /**
     * If set to true graphics added to the component will be copied. This can affect performance
     */
    copyGraphics: boolean;
    constructor(options?: GraphicsComponentOptions);
    /**
     * Returns the currently displayed graphics and their offsets, empty array if hidden
     */
    get current(): {
        graphic: Graphic;
        options: GraphicsShowOptions;
    }[];
    /**
     * Returns all graphics associated with this component
     */
    get graphics(): {
        [graphicName: string]: Graphic;
    };
    /**
     * Adds a named graphic to this component, if the name is "default" or not specified, it will be shown by default without needing to call
     * `show("default")`
     * @param graphic
     */
    add(graphic: Graphic): Graphic;
    add(name: string, graphic: Graphic): Graphic;
    /**
     * Show a graphic by name on the **default** layer, returns the new [[Graphic]]
     */
    show<T extends Graphic = Graphic>(nameOrGraphic: string | T, options?: GraphicsShowOptions): T;
    /**
     * Use a graphic only, swap out any graphics on the **default** layer, returns the new [[Graphic]]
     * @param nameOrGraphic
     * @param options
     */
    use<T extends Graphic = Graphic>(nameOrGraphic: string | T, options?: GraphicsShowOptions): T;
    /**
     * Remove any instance(s) of a graphic currently being shown in the **default** layer
     */
    hide(nameOrGraphic: string | Graphic): void;
    /**
     * Remove all currently shown graphics in the **default** layer
     */
    hide(): void;
    private _localBounds;
    set localBounds(bounds: BoundingBox);
    recalculateBounds(): void;
    get localBounds(): BoundingBox;
    /**
     * Update underlying graphics if necesary, called internally
     * @param elapsed
     * @internal
     */
    update(elapsed: number, idempotencyToken?: number): void;
}
