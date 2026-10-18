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
  // As in Civ 5, roads only bridge rivers once their owner has Engineering.
  public static readonly BRIDGE_TECH = "Engineering";
  // Improvements and features that cover the ground, so a road through the tile is drawn on top of them.
  public static readonly UNDER_ROAD_TILE_TYPES = ["farm", "marsh"];
  // Resources and improvements drawn as seen from above, lying on the ground over a road, which on
  // the globe lie flat on it rather than stand up off it like trees (see GameMap.getStandingSprites()):
  // ores, the mines and quarry dug into them, and a crater.
  public static readonly FLAT_TILE_TYPES = [
    "iron",
    "copper",
    "gold",
    "stone",
    "mine",
    "iron_mine",
    "copper_mine",
    "gold_mine",
    "stone_quarry",
    "barringer_crater"
  ];
  // Camp animals (and truffles) and their camps. They can be found in a forest, jungle or marsh, so they're
  // drawn after its trees rather than hidden under them, each on its own so that on the globe they
  // stand up from their own feet, not as part of a tree.
  public static readonly OVER_FEATURE_TILE_TYPES = [
    "deer",
    "bison",
    "ivory",
    "furs",
    "truffles",
    "deer_camp",
    "bison_camp",
    "ivory_camp",
    "furs_camp",
    "truffles_camp"
  ];
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
    // Features, drawn over the terrain - see getVariantFeatureType().
    forest: 2,
    jungle: 2,
    // A hill's mounds, drawn over its flat terrain - see getHillOverlayType().
    hills_grass: 2,
    hills_plains: 2,
    hills_desert: 2,
    hills_tundra: 2,
    hills_snow: 2
  };
  // Hills stay one tile type ("grass_hill") everywhere in the game, but are drawn as their flat
  // terrain with a hills overlay on the map's top layer, like a forest.
  private static readonly HILL_FLAT_TERRAINS: Record<string, string> = {
    grass_hill: "grass",
    plains_hill: "plains",
    desert_hill: "desert",
    tundra_hill: "tundra",
    snow_hill: "snow"
  };
  // Forests on these terrains always wear autumn colors, in one of two looks.
  private static readonly AUTUMN_FOREST_TERRAINS = ["tundra", "tundra_hill"];
  private static readonly AUTUMN_FOREST_TYPES = ["forest_autumn", "forest_autumn_2"];
  // Offsets the coordinates a feature's look is hashed from, so it doesn't follow the terrain's.
  private static readonly FEATURE_HASH_OFFSET = 7919;
  // Offsets the coordinates a hill's look is hashed from, so it doesn't follow the terrain's or a forest's.
  private static readonly HILL_HASH_OFFSET = 15485;
  // How many looks a city has in each era: TILE_CITY_<ERA>_1 to _3.
  private static readonly CITY_VARIANT_COUNT = 3;
  // The era later ones are drawn as until they get their own city sprites.
  private static readonly LAST_DRAWN_CITY_ERA = "medieval";
  // Offsets the coordinates a tile's mirroring is hashed from, so it doesn't follow its look.
  private static readonly MIRROR_HASH_OFFSET = 104729;

  private static loadedTileImages = new Map<string, HTMLCanvasElement>();
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
   * or one of its look-only variants ("grass_2" -> TILE_GRASS_2). A hill draws as its flat terrain
   * here, with its mounds added on the top layer - see getHillOverlayType(). Picked from a hash of the
   * coordinates, so it's the same on every reload and for every player, with no server involvement.
   * The plain sprite keeps half the tiles, so the variants read as accents.
   */
  public static getVariantTileType(tileType: string, gridX: number, gridY: number): string {
    const drawnType = Tile.HILL_FLAT_TERRAINS[tileType] ?? tileType;
    return Tile.pickVariant(drawnType, Tile.hashCoordinates(gridX, gridY));
  }

  /**
   * The tile type whose sprite draws a hill's mounds over its flat terrain at (gridX, gridY)
   * ("grass_hill" -> "hills_grass", or a look-only variant like "hills_grass_2"), or undefined if the
   * terrain isn't a hill. Only the drawing splits the hill in two; the tile keeps its one type.
   */
  public static getHillOverlayType(terrainType: string, gridX: number, gridY: number): string | undefined {
    const flatTerrain = Tile.HILL_FLAT_TERRAINS[terrainType];
    if (!flatTerrain) return undefined;
    return Tile.pickVariant(`hills_${flatTerrain}`, Tile.hashCoordinates(gridX + Tile.HILL_HASH_OFFSET, gridY));
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
   * The tile types a city at (gridX, gridY) is drawn with, in order: the back half of its walls (if it
   * has any, e.g. "walls" or "castle"), the city itself (see getCityType()), then the front half of
   * its walls over the buildings.
   */
  public static getCityTypes(era: string, walls: string | null, gridX: number, gridY: number): string[] {
    const city = Tile.getCityType(era, gridX, gridY);
    return walls ? [`city_${walls}_back`, city, `city_${walls}_front`] : [city];
  }

  /**
   * Whether a tile type is one of the layers a city is drawn in (see getCityTypes()). Each is drawn
   * on its own: the globe tells a city's buildings, and its walls' pieces, apart by their opacities
   * (see StandingPieces), which each layer marks for itself, and which drawing one over another would
   * run together.
   */
  public static isCityLayer(tileType: string): boolean {
    return tileType.startsWith("city_");
  }

  // Whether a tile type is drawn in an image of its own, apart from the tile's other overlays: a city's
  // layers (see isCityLayer()) and the camp resources drawn over trees (see OVER_FEATURE_TILE_TYPES).
  public static isDrawnAlone(tileType: string): boolean {
    return Tile.isCityLayer(tileType) || Tile.OVER_FEATURE_TILE_TYPES.includes(tileType);
  }

  /**
   * The tile type whose sprite draws a city of the given era (an era id from the server, like
   * "classical") at (gridX, gridY): one of that era's looks, picked from a hash of the coordinates
   * so a city keeps its look until its owner enters a new era.
   */
  public static getCityType(era: string, gridX: number, gridY: number): string {
    const drawnEra = resolveSpriteRegion(`TILE_CITY_${era.toUpperCase()}_1`) ? era : Tile.LAST_DRAWN_CITY_ERA;
    return `city_${drawnEra}_${(Tile.hashCoordinates(gridX, gridY) % Tile.CITY_VARIANT_COUNT) + 1}`;
  }

  /**
   * Whether the overlays (hills, forests, resources, improvements) standing on (gridX, gridY) are drawn
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

  // Whether a road between the two tiles speeds the step up: it has to reach both, and a river between
  // them needs a bridge. Mirrored by the server's Tile.roadCarriesAcross() - keep both in sync.
  public static roadCarriesAcross(tile1: Tile, tile2: Tile, player?: AbstractPlayer): boolean {
    if (!Tile.roadConnects(tile1, tile2)) return false;
    if (!Tile.riverCrosses(tile1, tile2)) return true;

    return player?.hasResearchedTech(Tile.BRIDGE_TECH) ?? false;
  }

  public static getWeight(tile1: Tile, tile2: Tile, unit?: Unit): number {
    if (Tile.roadCarriesAcross(tile1, tile2, unit?.getPlayer())) return Tile.ROAD_MOVEMENT_COST;

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
      this.image = Tile.generateImageFromTileTypes(this.tileTypes, this.mirrored);
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

  public static generateImageFromTileTypes(tileTypes: string[], mirrored = false): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = Tile.WIDTH;
    canvas.height = Tile.HEIGHT;
    // Kept in memory rather than on the GPU: hill mounds and the globe's standing sprites read these
    // pixels back, which from a GPU canvas means waiting on a slow readback each time.
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (mirrored) context.setTransform(-1, 0, 0, 1, Tile.WIDTH, 0);

    for (let tileType of tileTypes) {
      if (Tile.UNSPRITED_TILE_TYPES.includes(tileType)) continue;

      const spritesheetImage = Game.getInstance().getImage(GameImage.SPRITESHEET);
      const spriteRegion = resolveSpriteRegion(`TILE_${tileType.toUpperCase()}`);
      const region = SpriteAtlas.getInstance().getRegion(spriteRegion);
      context.drawImage(spritesheetImage, region.x, region.y, region.w, region.h, 0, 0, Tile.WIDTH, Tile.HEIGHT);
    }

    return canvas;
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
