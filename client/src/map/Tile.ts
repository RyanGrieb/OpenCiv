import { GameImage, resolveSpriteRegion } from "../Assets";
import { Game } from "../Game";
import { Unit } from "../Unit";
import { City } from "../city/City";
import { Actor } from "../scene/Actor";
import { Vector } from "../util/Vector";
import { GameMap } from "./GameMap";
import { MapWrap } from "./MapWrap";
import { SpriteAtlas } from "../SpriteAtlas";
import { Strings } from "../util/Strings";
import { AbstractPlayer } from "../player/AbstractPlayer";
import { Diplomacy } from "../player/Diplomacy";

// Keyed by tile-type name (upper/lower-case variants both used); see Tile.getTileYield().
export type TileYieldsData = Record<string, { name?: string; stats: Record<string, number>[] }>;

export interface TileOptions {
  tileTypes: string[];
  x: number;
  y: number;
  z?: number;
  gridX: number;
  gridY: number;
  movementCost: number;
  riverSides?: boolean[];
  width?: number;
  height?: number;
  color?: string;
  yields?: any[];
  // Draws the sprites flipped left-right - see isOverlayMirrored().
  mirrored?: boolean;
}

export class Tile extends Actor {
  public static WIDTH = 32;
  public static HEIGHT = 32;
  // Mirrors server/src/map/Tile.ts's ROAD_MOVEMENT_COST.
  public static readonly ROAD_MOVEMENT_COST = 1 / 3;
  // Improvements that cover the ground, so a road through the tile is drawn on top of them.
  public static readonly UNDER_ROAD_TILE_TYPES = ["farm"];
  // Tile types drawn some other way than their own sprite - roads connect to their neighbors (see
  // Road.createActors).
  private static readonly UNSPRITED_TILE_TYPES = ["road"];
  // How many look-only variant sprites (TILE_<TYPE>_2, _3, ...) each base terrain has on top of its
  // plain one - see getVariantTileType().
  private static readonly TILE_VARIANT_COUNTS: Record<string, number> = {
    grass: 4,
    // Plains' tufted variant became the wheat resource's sprite, so plains keeps only its dry one.
    plains: 1,
    tundra: 2,
    desert: 2,
    mountain: 2,
    ocean: 2,
    shallow_ocean: 2,
    freshwater: 2,
    grass_hill: 2,
    plains_hill: 2,
    desert_hill: 2,
    tundra_hill: 2,
    snow_hill: 2,
    // Features, drawn over the terrain - see getVariantFeatureType().
    forest: 2,
    jungle: 2
  };
  // Forests on these terrains always wear autumn colors, in one of two looks.
  private static readonly AUTUMN_FOREST_TERRAINS = ["tundra", "tundra_hill"];
  private static readonly AUTUMN_FOREST_TYPES = ["forest_autumn", "forest_autumn_2"];
  // Offsets the coordinates a feature's look is hashed from, so it doesn't follow the terrain's.
  private static readonly FEATURE_HASH_OFFSET = 7919;
  // Offsets the coordinates a tile's mirroring is hashed from, so it doesn't follow its look.
  private static readonly MIRROR_HASH_OFFSET = 104729;

  private static loadedTileImages = new Map<string, HTMLImageElement>();
  private static allTileStats: TileYieldsData;

  private tileTypes: string[];
  private adjacentTiles: Tile[];
  private vectors: Vector[];
  private riverSides: boolean[];
  private units: Unit[];
  private movementCost: number; // Default movement cost of the tile (e.g., Hill=2, Mountain=999)

  private gridX: number;
  private gridY: number;

  private city: City;
  private territoryCity: City | undefined;
  private yields: any[];
  private mirrored: boolean;
  // Whether this player currently sees this tile, vs. only remembering it from earlier - see
  // PlayerVisibility on the server. Defaults true: a Tile is only ever constructed once discovered.
  private visible: boolean = true;

  constructor(options: TileOptions) {
    super({
      x: options.x,
      y: options.y,
      z: options.z || 0,
      width: options.width ?? Tile.WIDTH,
      height: options.height ?? Tile.HEIGHT,
      color: options.color
    });
    this.tileTypes = options.tileTypes;
    this.adjacentTiles = [];
    this.vectors = [];
    this.riverSides = options.riverSides ?? Array(6).fill(false);
    this.units = [];
    this.movementCost = options.movementCost;
    this.yields = options.yields;
    this.mirrored = options.mirrored ?? false;

    this.gridX = options.gridX;
    this.gridY = options.gridY;

    this.initializeVectors();
  }

  public static gridDistance(tile1: Tile, tile2: Tile) {
    // The short way round, or the A* heuristic overestimates and paths near the seam go non-optimal.
    const dx = MapWrap.shortestGridDeltaX(tile2.getGridX() - tile1.getGridX());

    return Math.sqrt(Math.pow(dx, 2) + Math.pow(tile2.getGridY() - tile1.getGridY(), 2));
  }

  public static riverCrosses(tile1: Tile, tile2: Tile) {
    let tile1RiverSide = -1;
    for (let i = 0; i < tile1.getAdjacentTiles().length; i++) {
      if (tile2 === tile1.getAdjacentTiles()[i]) {
        tile1RiverSide = i;
      }
    }

    if (tile1.getRiverSides()[tile1RiverSide]) {
      return true;
    }

    return false;
  }

  // Mirrors server/src/map/Tile.ts's roadConnects() - keep both in sync.
  public static roadConnects(tile1: Tile, tile2: Tile): boolean {
    return tile1.hasRoad() && tile2.hasRoad();
  }

  /**
   * The tile type whose sprite draws this base terrain at (gridX, gridY): either the terrain itself
   * or one of its look-only variants ("grass_2" -> TILE_GRASS_2). Picked from a hash of the
   * coordinates, so it's the same on every reload and for every player, with no server involvement.
   * The plain sprite keeps half the tiles, so the variants read as accents.
   */
  public static getVariantTileType(tileType: string, gridX: number, gridY: number): string {
    return Tile.pickVariant(tileType, Tile.hashCoordinates(gridX, gridY));
  }

  /**
   * The tile type whose sprite draws an overlay (forest, jungle) standing on the given terrain at
   * (gridX, gridY): like getVariantTileType(), but forests on tundra always take one of the autumn
   * looks. Types without variants (resources, improvements) come back unchanged.
   */
  public static getVariantFeatureType(featureType: string, terrainType: string, gridX: number, gridY: number): string {
    const hash = Tile.hashCoordinates(gridX + Tile.FEATURE_HASH_OFFSET, gridY);
    if (featureType === "forest" && Tile.AUTUMN_FOREST_TERRAINS.includes(terrainType)) {
      return Tile.AUTUMN_FOREST_TYPES[hash % Tile.AUTUMN_FOREST_TYPES.length];
    }
    return Tile.pickVariant(featureType, hash);
  }

  /**
   * Whether the overlays (forests, resources, improvements) standing on (gridX, gridY) are drawn
   * flipped left-right, which doubles their looks without new art. Half the tiles are, picked from
   * a hash of the coordinates like getVariantTileType(). Never flipped upside down, and the terrain
   * underneath is left alone: its hex outline isn't quite symmetric, so a flip would open seams.
   */
  public static isOverlayMirrored(gridX: number, gridY: number): boolean {
    return Tile.hashCoordinates(gridX + Tile.MIRROR_HASH_OFFSET, gridY) % 2 === 1;
  }

  // One of tileType's sprites for a coordinate hash: the plain one for half the hashes, else a variant.
  private static pickVariant(tileType: string, hash: number): string {
    const variantCount = Tile.TILE_VARIANT_COUNTS[tileType];
    if (!variantCount) return tileType;

    const roll = hash % (variantCount * 2);
    if (roll < variantCount) return tileType;

    // Variants are numbered from 2, the plain sprite being the first.
    return `${tileType}_${roll - variantCount + 2}`;
  }

  // A well-mixed, non-negative integer from a pair of grid coordinates (a small integer hash), so
  // neighboring tiles don't fall into visible stripes or checkerboards.
  private static hashCoordinates(x: number, y: number): number {
    let hash = Math.imul(x, 374761393) + Math.imul(y, 668265263);
    hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
    return (hash ^ (hash >>> 16)) >>> 0;
  }

  public static getWeight(tile1: Tile, tile2: Tile, unit?: Unit): number {
    if (Tile.roadConnects(tile1, tile2)) return Tile.ROAD_MOVEMENT_COST;

    if (unit?.ignoresTerrainCost()) {
      // Still respect impassable terrain (e.g. mountains) - only flatten the
      // hill/forest/jungle penalty and the river-crossing floor to 1.
      return tile2.getMovementCost() >= 9999 ? 9999 : 1;
    }

    if (Tile.riverCrosses(tile1, tile2)) {
      return Math.max(2, tile2.getMovementCost());
    }

    return tile2.getMovementCost();
  }

  public static setTileYields(data: TileYieldsData) {
    Tile.allTileStats = data;
  }

  public static getTileYields() {
    return Tile.allTileStats;
  }

  // The name tiles.yml gives a tile type ("mt_fuji" -> "Mt. Fuji"), or the type itself in title case.
  public static getTileTypeName(tileType: string): string {
    return Tile.allTileStats?.[tileType.toUpperCase()]?.name ?? Strings.capitalizeWords(tileType.replaceAll("_", " "));
  }

  public async loadImage() {
    const key = JSON.stringify([this.tileTypes, this.mirrored]);

    if (Tile.loadedTileImages.has(key)) {
      this.image = Tile.loadedTileImages.get(key);
    } else {
      this.image = await Tile.generateImageFromTileTypes(this.tileTypes, this.mirrored);
      Tile.loadedTileImages.set(key, this.image);
    }
  }

  public draw(canvasContext: CanvasRenderingContext2D) {
    super.draw(canvasContext);

    /*this.vectors.forEach((vector) => {
      Game.drawRect({
        x: vector.x,
        y: vector.y,
        height: 1,
        width: 1,
        color: "black",
        canvasContext: canvasContext,
      });
    });*/
  }

  public getTileYield() {
    if (this.yields) {
      const tileYield: { [key: string]: number } = {};
      for (const statObj of this.yields) {
        for (const [key, value] of Object.entries(statObj)) {
          tileYield[key] = (tileYield[key] || 0) + (typeof value === "number" ? value : 0);
        }
      }
      return tileYield;
    }

    // Use the static getter to ensure we always have the latest tile stats (Fallback)
    // FIXME: Remove this deprecated bullcrap
    const allTileStats = Tile.getTileYields();
    if (!allTileStats) return undefined;

    const tileYield: { [key: string]: number } = {};
    for (const tileType of this.tileTypes) {
      // Accept both upper and lower case keys for tileTypes
      const yieldData =
        allTileStats[tileType] || allTileStats[tileType.toUpperCase()] || allTileStats[tileType.toLowerCase()];
      if (yieldData && yieldData.stats) {
        for (const statObj of yieldData.stats) {
          for (const [key, value] of Object.entries(statObj)) {
            tileYield[key] = (tileYield[key] || 0) + (typeof value === "number" ? value : 0);
          }
        }
      }
    }
    // Return undefined if no yield found, otherwise the yield object
    return Object.keys(tileYield).length > 0 ? tileYield : undefined;
  }

  public setCity(city: City) {
    this.city = city;
    // Avoid duplicating the "city" type during reconnect sync.
    if (!this.tileTypes.includes("city")) {
      this.tileTypes.push("city");
    }
    GameMap.getInstance().redrawMap([this]);
  }

  public setYields(yields: any[]) {
    this.yields = yields;
  }

  public setVisible(visible: boolean) {
    this.visible = visible;
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public getCity() {
    return this.city;
  }

  // A city counts as a road, as in Civ 5.
  public hasRoad(): boolean {
    return this.tileTypes.includes("road") || this.tileTypes.includes("city");
  }

  public samePosition(tile: Tile) {
    return this.gridX === tile.getGridX() && this.gridY === tile.getGridY();
  }

  public getMovementCost() {
    return this.movementCost;
  }

  public addUnit(unit: Unit) {
    this.units.push(unit);
  }

  // Mirrors server/src/map/Tile.ts's isBlockedFor() - keep both in sync.
  // Whether a unit can't end its move here. A tile holds at most one military and one utility (civilian)
  // unit, so a same-type ally blocks - but can still be passed through, see isImpassableFor().
  public isBlockedFor(movingUnit: Unit): boolean {
    if (this.isImpassableFor(movingUnit)) return true;

    const otherUnits = this.units.filter((unit) => unit !== movingUnit);

    // A unit from another civilization always blocks.
    if (otherUnits.some((unit) => unit.getPlayer() !== movingUnit.getPlayer())) {
      return true;
    }

    // Same-type ally units can't stack (utility+utility, or non-utility+non-utility); mixed types can.
    return otherUnits.some((unit) => unit.isUtility() === movingUnit.isUtility());
  }

  // Mirrors server/src/map/Tile.ts's isImpassableFor() - keep both in sync.
  // Whether a unit can't even pass through here on the way somewhere else: another civilization's
  // units or city are in the way (getting past them means attacking, see Unit.canMeleeAttack), or the
  // tile is inside the borders of a civilization the unit's owner is at peace with.
  public isImpassableFor(movingUnit: Unit): boolean {
    if (this.city && this.city.getPlayer() !== movingUnit.getPlayer()) return true;
    if (this.isClosedBorderFor(movingUnit.getPlayer())) return true;

    return this.units.some((unit) => unit !== movingUnit && unit.getPlayer() !== movingUnit.getPlayer());
  }

  // Mirrors server/src/map/Tile.ts's isClosedBorderFor() - keep both in sync. Civ 5 without Open
  // Borders: only the owner and those at war with them may enter a civilization's land.
  public isClosedBorderFor(player: AbstractPlayer): boolean {
    const owner = this.territoryCity?.getPlayer();
    if (!owner || owner === player) return false;

    return !Diplomacy.areAtWar(owner, player);
  }

  // The city whose borders take in this tile, as far as this player has discovered - see City.setTerritory().
  public setTerritoryCity(city: City | undefined) {
    this.territoryCity = city;
  }

  public getTerritoryCity(): City | undefined {
    return this.territoryCity;
  }

  public hasRiver(): boolean {
    return this.riverSides.some((side) => side);
  }

  public getRiverSides() {
    return this.riverSides;
  }

  public getNumberedRiverSides(): number[] {
    const numberedSides: number[] = [];
    for (let i = 0; i < this.riverSides.length; i++) {
      if (this.riverSides[i]) numberedSides.push(i);
    }
    return numberedSides;
  }

  public getTileTypes() {
    return this.tileTypes;
  }

  public setTileTypes(tileTypes: string[]) {
    this.tileTypes = tileTypes;
  }

  public getGridX() {
    return this.gridX;
  }

  public getGridY() {
    return this.gridY;
  }

  public static async generateImageFromTileTypes(tileTypes: string[], mirrored = false): Promise<HTMLImageElement> {
    let canvas = document.getElementById("auxillary_canvas") as HTMLCanvasElement;

    canvas.width = Tile.WIDTH;
    canvas.height = Tile.HEIGHT;
    canvas.getContext("2d").fillStyle = "rgba(0,0,0,0)";
    canvas.getContext("2d").fillRect(0, 0, canvas.width, canvas.height);
    // Resizing the canvas above already reset any flip left over from the previous image.
    if (mirrored) canvas.getContext("2d").setTransform(-1, 0, 0, 1, Tile.WIDTH, 0);

    for (let tileType of tileTypes) {
      if (Tile.UNSPRITED_TILE_TYPES.includes(tileType)) continue;

      const spritesheetImage = Game.getInstance().getImage(GameImage.SPRITESHEET);
      const spriteRegion = resolveSpriteRegion(`TILE_${tileType.toUpperCase()}`);
      const region = SpriteAtlas.getInstance().getRegion(spriteRegion);
      canvas
        .getContext("2d")
        .drawImage(spritesheetImage, region.x, region.y, region.w, region.h, 0, 0, Tile.WIDTH, Tile.HEIGHT);
    }

    //canvas.getContext("2d").globalCompositeOperation = "saturation";
    //canvas.getContext("2d").fillStyle = "hsl(35,35%,35%)";
    //canvas.getContext("2d").fillRect(0, 0, canvas.width, canvas.height);

    let image = new Image();
    image.src = canvas.toDataURL();
    image.width = Tile.WIDTH;
    image.height = Tile.HEIGHT;

    await new Promise((resolve) => {
      image.onload = () => resolve(image);
    });
    return image;
  }

  public getAdjacentTiles() {
    return this.adjacentTiles;
  }

  public setAdjacentTile(index: number, tile: Tile) {
    this.adjacentTiles[index] = tile;
  }

  public getVectors() {
    return this.vectors;
  }

  private initializeVectors() {
    // Note: The ordering of this matters since we need to form a polygon from these vectors
    this.vectors.push(new Vector(this.x, this.y + 7)); // Top left
    this.vectors.push(new Vector(this.x + this.width / 2, this.y)); // Top center
    this.vectors.push(new Vector(this.x + 32, this.y + 7)); // Top right
    this.vectors.push(new Vector(this.x + 32, this.y + 25)); // Bottom right
    this.vectors.push(new Vector(this.x + this.width / 2, this.y + 32)); // Bottom center
    this.vectors.push(new Vector(this.x, this.y + 25)); // Bottom left
  }

  /**
   * Returns the center position of the tile in local (actor) coordinates.
   * Note: This uses this.x and this.y.
   */
  public getCenterPosition(): { x: number; y: number } {
    return {
      x: this.x + Tile.WIDTH / 2,
      y: this.y + Tile.HEIGHT / 2
    };
  }

  public getDistanceFrom(x1: number, y1: number) {
    let x2 = this.getCenterPosition().x;
    let y2 = this.getCenterPosition().y;
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  public getUnits(): Unit[] {
    return this.units;
  }

  public getUnitByID(id: number): Unit | undefined {
    return this.units.find((unit) => unit.getID() === id);
  }

  public removeUnit(unit: Unit) {
    this.units.splice(this.units.indexOf(unit), 1);
  }

  //public getNodeIndex(): number {
  //  return GameMap.getInstance().getWidth() * this.gridY + this.gridX;
  //}

  public isWater(): boolean {
    const waterTileTypes = ["ocean", "shallow_ocean", "freshwater"];
    return this.tileTypes.some((type) => waterTileTypes.includes(type));
  }

  // Mirrors server/src/map/Tile.ts's isCoastal() - keep both in sync.
  public isCoastal(): boolean {
    if (this.isWater()) return false;

    return this.getAdjacentTiles().some(
      (tile) => tile && (tile.tileTypes.includes("ocean") || tile.tileTypes.includes("shallow_ocean"))
    );
  }
}
