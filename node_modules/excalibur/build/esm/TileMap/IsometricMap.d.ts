import { Collider, ColliderComponent, Vector } from '..';
import { TransformComponent } from '../EntityComponentSystem/Components/TransformComponent';
import { Entity } from '../EntityComponentSystem/Entity';
import { ExcaliburGraphicsContext, Graphic } from '../Graphics';
export declare class IsometricTile extends Entity {
    /**
     * Indicates whether this tile is solid
     */
    solid: boolean;
    private _gfx;
    private _tileBounds;
    private _graphics;
    getGraphics(): readonly Graphic[];
    /**
     * Tile graphics
     */
    addGraphic(graphic: Graphic): void;
    private _recalculateBounds;
    removeGraphic(graphic: Graphic): void;
    clearGraphics(): void;
    /**
     * Tile colliders
     */
    private _colliders;
    getColliders(): readonly Collider[];
    /**
     * Adds a collider to the IsometricTile
     *
     * **Note!** the [[Tile.solid]] must be set to true for it to act as a "fixed" collider
     * @param collider
     */
    addCollider(collider: Collider): void;
    /**
     * Removes a collider from the IsometricTile
     * @param collider
     */
    removeCollider(collider: Collider): void;
    /**
     * Clears all colliders from the IsometricTile
     */
    clearColliders(): void;
    /**
     * Integer tile x coordinate
     */
    readonly x: number;
    /**
     * Integer tile y coordinate
     */
    readonly y: number;
    /**
     * Reference to the [[IsometricMap]] this tile is part of
     */
    readonly map: IsometricMap;
    private _transform;
    private _isometricEntityComponent;
    /**
     * Returns the top left corner of the [[IsometricTile]] in world space
     */
    get pos(): Vector;
    /**
     * Returns the center of the [[IsometricTile]]
     */
    get center(): Vector;
    /**
     * Construct a new IsometricTile
     * @param x tile coordinate in x (not world position)
     * @param y tile coordinate in y (not world position)
     * @param graphicsOffset offset that tile should be shifted by (default (0, 0))
     * @param map reference to owning IsometricMap
     */
    constructor(x: number, y: number, graphicsOffset: Vector | null, map: IsometricMap);
    draw(gfx: ExcaliburGraphicsContext, _elapsed: number): void;
}
export interface IsometricMapOptions {
    /**
     * Optionally name the isometric tile map
     */
    name?: string;
    /**
     * Optionally specify the position of the isometric tile map
     */
    pos?: Vector;
    /**
     * Optionally render from the top of the graphic, by default tiles are rendered from the bottom
     */
    renderFromTopOfGraphic?: boolean;
    /**
     * Optionally present a graphics offset, this can be useful depending on your tile graphics
     */
    graphicsOffset?: Vector;
    /**
     * Width of an individual tile in pixels, this should be the width of the parallelogram of the base of the tile art asset.
     */
    tileWidth: number;
    /**
     * Height of an individual tile in pixels, this should be the height of the parallelogram of the base of the tile art asset.
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
}
/**
 * The IsometricMap is a special tile map that provides isometric rendering support to Excalibur
 *
 * The tileWidth and tileHeight should be the height and width in pixels of the parallelogram of the base of the tile art asset.
 * The tileWidth and tileHeight is not necessarily the same as your graphic pixel width and height.
 *
 * Please refer to the docs https://excaliburjs.com for more details calculating what your tile width and height should be given
 * your art assets.
 */
export declare class IsometricMap extends Entity {
    /**
     * Width of individual tile in pixels
     */
    readonly tileWidth: number;
    /**
     * Height of individual tile in pixels
     */
    readonly tileHeight: number;
    /**
     * Number of tiles wide
     */
    readonly columns: number;
    /**
     * Number of tiles high
     */
    readonly rows: number;
    /**
     * List containing all of the tiles in IsometricMap
     */
    readonly tiles: IsometricTile[];
    /**
     * Render the tile graphic from the top instead of the bottom
     *
     * default is `false` meaning rendering from the bottom
     */
    renderFromTopOfGraphic: boolean;
    graphicsOffset: Vector;
    /**
     * Isometric map [[TransformComponent]]
     */
    transform: TransformComponent;
    /**
     * Isometric map [[ColliderComponent]]
     */
    collider: ColliderComponent;
    private _composite;
    constructor(options: IsometricMapOptions);
    update(): void;
    private _collidersDirty;
    flagCollidersDirty(): void;
    private _originalOffsets;
    private _getOrSetColliderOriginalOffset;
    updateColliders(): void;
    /**
     * Convert world space coordinates to the tile x, y coordinate
     * @param worldCoordinate
     */
    worldToTile(worldCoordinate: Vector): Vector;
    /**
     * Given a tile coordinate, return the top left corner in world space
     * @param tileCoordinate
     */
    tileToWorld(tileCoordinate: Vector): Vector;
    /**
     * Returns the [[IsometricTile]] by its x and y coordinates
     */
    getTile(x: number, y: number): IsometricTile | null;
    /**
     * Returns the [[IsometricTile]] by testing a point in world coordinates,
     * returns `null` if no Tile was found.
     */
    getTileByPoint(point: Vector): IsometricTile | null;
    private _getMaxZIndex;
    /**
     * Debug draw for IsometricMap, called internally by excalibur when debug mode is toggled on
     * @param gfx
     */
    debug(gfx: ExcaliburGraphicsContext): void;
}
