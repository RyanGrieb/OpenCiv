import { BoundingBox } from '../Collision/BoundingBox';
import { Engine } from '../Engine';
import { Vector } from '../Math/vector';
import { Logger } from '../Util/Log';
import * as Events from '../Events';
import { Entity } from '../EntityComponentSystem/Entity';
import { ExcaliburGraphicsContext, Graphic } from '../Graphics';
import { Collider } from '../Collision/Colliders/Collider';
export interface TileMapOptions {
    /**
     * Optionally name the isometric tile map
     */
    name?: string;
    /**
     * Optionally specify the position of the isometric tile map
     */
    pos?: Vector;
    /**
     * Width of an individual tile in pixels
     */
    tileWidth: number;
    /**
     * Height of an individual tile in pixels
     */
    tileHeight: number;
    /**
     * The number of tile columns, or the number of tiles wide
     */
    columns: number;
    /**
     * The number of tile  rows, or the number of tiles high
     */
    rows: number;
    /**
     * Optionally render from the top of the graphic, by default tiles are rendered from the bottom
     */
    renderFromTopOfGraphic?: boolean;
}
/**
 * The TileMap provides a mechanism for doing flat 2D tiles rendered in a grid.
 *
 * TileMaps are useful for top down or side scrolling grid oriented games.
 */
export declare class TileMap extends Entity {
    private _token;
    private _onScreenXStart;
    private _onScreenXEnd;
    private _onScreenYStart;
    private _onScreenYEnd;
    logger: Logger;
    readonly tiles: Tile[];
    private _rows;
    private _cols;
    readonly tileWidth: number;
    readonly tileHeight: number;
    readonly rows: number;
    readonly columns: number;
    renderFromTopOfGraphic: boolean;
    private _collidersDirty;
    flagCollidersDirty(): void;
    private _transform;
    private _motion;
    private _graphics;
    private _collider;
    private _composite;
    get x(): number;
    set x(val: number);
    get y(): number;
    set y(val: number);
    get z(): number;
    set z(val: number);
    get rotation(): number;
    set rotation(val: number);
    get scale(): Vector;
    set scale(val: Vector);
    private _oldPos;
    get pos(): Vector;
    set pos(val: Vector);
    get vel(): Vector;
    set vel(val: Vector);
    on(eventName: Events.preupdate, handler: (event: Events.PreUpdateEvent<TileMap>) => void): void;
    on(eventName: Events.postupdate, handler: (event: Events.PostUpdateEvent<TileMap>) => void): void;
    on(eventName: Events.predraw, handler: (event: Events.PreDrawEvent) => void): void;
    on(eventName: Events.postdraw, handler: (event: Events.PostDrawEvent) => void): void;
    on(eventName: string, handler: (event: Events.GameEvent<any>) => void): void;
    /**
     * @param options
     */
    constructor(options: TileMapOptions);
    _initialize(engine: Engine): void;
    private _originalOffsets;
    private _getOrSetColliderOriginalOffset;
    /**
     * Tiles colliders based on the solid tiles in the tilemap.
     */
    private _updateColliders;
    /**
     * Returns the [[Tile]] by index (row major order)
     */
    getTileByIndex(index: number): Tile;
    /**
     * Returns the [[Tile]] by its x and y integer coordinates
     */
    getTile(x: number, y: number): Tile;
    /**
     * Returns the [[Tile]] by testing a point in world coordinates,
     * returns `null` if no Tile was found.
     */
    getTileByPoint(point: Vector): Tile;
    getRows(): readonly Tile[][];
    getColumns(): readonly Tile[][];
    update(engine: Engine, delta: number): void;
    /**
     * Draws the tile map to the screen. Called by the [[Scene]].
     * @param ctx ExcaliburGraphicsContext
     * @param delta  The number of milliseconds since the last draw
     */
    draw(ctx: ExcaliburGraphicsContext, delta: number): void;
    debug(gfx: ExcaliburGraphicsContext): void;
}
export interface TileOptions {
    /**
     * Integer tile x coordinate
     */
    x: number;
    /**
     * Integer tile y coordinate
     */
    y: number;
    map: TileMap;
    solid?: boolean;
    graphics?: Graphic[];
}
/**
 * TileMap Tile
 *
 * A light-weight object that occupies a space in a collision map. Generally
 * created by a [[TileMap]].
 *
 * Tiles can draw multiple sprites. Note that the order of drawing is the order
 * of the sprites in the array so the last one will be drawn on top. You can
 * use transparency to create layers this way.
 */
export declare class Tile extends Entity {
    private _bounds;
    private _pos;
    private _posDirty;
    /**
     * Return the world position of the top left corner of the tile
     */
    get pos(): Vector;
    /**
     * Integer x coordinate of the tile
     */
    readonly x: number;
    /**
     * Integer y coordinate of the tile
     */
    readonly y: number;
    /**
     * Width of the tile in pixels
     */
    readonly width: number;
    /**
     * Height of the tile in pixels
     */
    readonly height: number;
    /**
     * Reference to the TileMap this tile is associated with
     */
    map: TileMap;
    private _solid;
    /**
     * Wether this tile should be treated as solid by the tilemap
     */
    get solid(): boolean;
    /**
     * Wether this tile should be treated as solid by the tilemap
     */
    set solid(val: boolean);
    private _graphics;
    /**
     * Current list of graphics for this tile
     */
    getGraphics(): readonly Graphic[];
    /**
     * Add another [[Graphic]] to this TileMap tile
     * @param graphic
     */
    addGraphic(graphic: Graphic): void;
    /**
     * Remove an instance of a [[Graphic]] from this tile
     */
    removeGraphic(graphic: Graphic): void;
    /**
     * Clear all graphics from this tile
     */
    clearGraphics(): void;
    /**
     * Current list of colliders for this tile
     */
    private _colliders;
    /**
     * Returns the list of colliders
     */
    getColliders(): readonly Collider[];
    /**
     * Adds a custom collider to the [[Tile]] to use instead of it's bounds
     *
     * If no collider is set but [[Tile.solid]] is set, the tile bounds are used as a collider.
     *
     * **Note!** the [[Tile.solid]] must be set to true for it to act as a "fixed" collider
     * @param collider
     */
    addCollider(collider: Collider): void;
    /**
     * Removes a collider from the [[Tile]]
     * @param collider
     */
    removeCollider(collider: Collider): void;
    /**
     * Clears all colliders from the [[Tile]]
     */
    clearColliders(): void;
    /**
     * Arbitrary data storage per tile, useful for any game specific data
     */
    data: Map<string, any>;
    constructor(options: TileOptions);
    flagDirty(): boolean;
    private _recalculate;
    get bounds(): BoundingBox;
    get center(): Vector;
}
