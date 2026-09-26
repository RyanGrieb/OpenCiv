import random from "random";
import { GameMap } from "./GameMap";
import { TileIndexer } from "./TileIndexer";
import { Unit } from "../unit/Unit";
import { City } from "../city/City";
import { Player } from "../Player";
import { ConfigLoader } from "../util/ConfigLoader";
import { MapResources } from "./MapResources";

// A tile/building stat-line is represented as an array of single-key partial objects
// (e.g. [{ science: 0 }, { gold: 0 }, ...]) rather than one flat dictionary.
export interface StatValues {
  science: number;
  gold: number;
  production: number;
  faith: number;
  culture: number;
  food: number;
  morale: number;
}
export type StatEntry = Partial<StatValues>;

export class Tile {
  // Sight elevation tiers - how high a tile sits for line-of-sight purposes. See
  // getSightElevation() / getSightBlockingHeight() and GameMap.hasLineOfSight().
  public static readonly ELEVATION_FLAT = 0;
  public static readonly ELEVATION_HILL = 1;
  public static readonly ELEVATION_MOUNTAIN = 2;
  // Civ 5: moving along a road from one road tile to the next costs a third of a move.
  public static readonly ROAD_MOVEMENT_COST = 1 / 3;

  //== Generation Values ==
  private generationHeight: number;
  private generationTemp: number;
  //== Generation Values ==
  private tileTypes: string[];
  private adjacentTiles: Tile[];
  private riverSides: boolean[];
  private units: Unit[];

  private x: number;
  private y: number;

  private city: City;
  // Which city's territory this tile falls within - set on every tile of a city's territory,
  // including its center (which also has `city` set above). Distinct from `city`: that field means
  // "the city sits ON this exact tile" (drives the city-center tileType/food bonus below), while
  // this means "this tile belongs to that city" for any of its surrounding tiles too. Tile JSON
  // reports this rather than `city`, so a player who's only discovered part of a foreign city's
  // territory still learns of the city and its borders, without having scouted its exact center.
  private cityTerritoryOf: City;
  // The improvement built here (e.g. "Farm"), not counting a road, which sits alongside it.
  private improvement: string | undefined;
  // Turns Builders have put into each improvement on this tile so far. Kept when a Builder walks
  // off, so another one can pick the work up where it was left, as in Civ 5.
  private buildProgress: Map<string, number>;

  constructor(tileType: string, x: number, y: number) {
    this.generationHeight = 0;
    this.generationTemp = 0;

    this.tileTypes = [];

    this.adjacentTiles = [];
    this.riverSides = new Array(6).fill(false);
    this.units = [];
    this.buildProgress = new Map();

    this.x = x;
    this.y = y;

    this.addTileType(tileType);
  }
  public static getAllTileStats(): Record<string, any> {
    return ConfigLoader.load<{ tiles: Record<string, any> }>("./config/tiles.yml").tiles;
  }

  // Mirrored by the client's Tile.roadConnects() - keep both in sync.
  public static roadConnects(tile1: Tile, tile2: Tile): boolean {
    return tile1.hasRoad() && tile2.hasRoad();
  }

  public getImprovement(): string | undefined {
    return this.improvement;
  }

  public setImprovement(improvement: string) {
    this.improvement = improvement;
  }

  // Adds a turn of work on the improvement and returns how many turns it has had in total.
  public addBuildProgress(improvement: string): number {
    const turns = (this.buildProgress.get(improvement) ?? 0) + 1;
    this.buildProgress.set(improvement, turns);
    return turns;
  }

  public getBuildProgress(improvement: string): number {
    return this.buildProgress.get(improvement) ?? 0;
  }

  public clearBuildProgress(improvement: string) {
    this.buildProgress.delete(improvement);
  }

  // A city counts as a road, as in Civ 5.
  public hasRoad(): boolean {
    return this.containsTileType("road") || !!this.city;
  }

  // The unimproved resource on this tile, if any (e.g. "cattle", but not "improved_cattle").
  public getResource(): string | undefined {
    const resources = MapResources.getResourceTileTypes();
    return this.tileTypes.find((type) => resources.includes(type));
  }

  public setCity(city: City) {
    this.addTileType("city");
    this.city = city;
    GameMap.getInstance().broadcastTileUpdate(this);
  }

  public getCity(): City {
    return this.city;
  }

  public setCityTerritoryOf(city: City) {
    this.cityTerritoryOf = city;
  }

  public getCityTerritoryOf(): City {
    return this.cityTerritoryOf;
  }

  public addUnit(unit: Unit) {
    this.units.push(unit);
  }

  public removeUnit(unit: Unit) {
    this.units = this.units.filter((existingUnit) => existingUnit !== unit);
  }

  public getUnits(): Unit[] {
    return this.units;
  }

  // Whether a unit can't end its move here. A tile holds at most one military and one utility (civilian)
  // unit, so a same-type ally blocks - but can still be passed through, see isImpassableFor().
  public isBlockedFor(movingUnit: Unit): boolean {
    return (
      this.isImpassableFor(movingUnit) ||
      this.hasStackingConflict(movingUnit.getPlayer(), movingUnit.isUtility(), movingUnit)
    );
  }

  // Whether a unit can't even pass through here on the way somewhere else: another civilization's
  // units or city are in the way. Getting past them means attacking (Unit.meleeAttack).
  public isImpassableFor(movingUnit: Unit): boolean {
    if (this.city && this.city.getPlayer() !== movingUnit.getPlayer()) return true;

    return this.units.some((unit) => unit !== movingUnit && unit.getPlayer() !== movingUnit.getPlayer());
  }

  // Whether a new unit of this type could be placed here, e.g. one just finished by production.
  public canPlaceUnit(player: Player, isUtility: boolean): boolean {
    return !this.hasStackingConflict(player, isUtility);
  }

  public getRiverSides() {
    return this.riverSides;
  }

  public setRiverSide(side: number, value: boolean, cacheEntry = true): Map<Tile, number> {
    const tilesEffected = new Map<Tile, number>();

    this.riverSides[side] = value;
    if (this.containsTileType("snow")) {
      /*console.log(
        "Setting river side: " +
          side +
          " for tile: [" +
          this.x +
          "," +
          this.y +
          "]"
      );*/
    }
    tilesEffected.set(this, side);

    const oppositeSides: number[] = [3, 4, 5, 0, 1, 2];
    const oppositeTile = this.adjacentTiles[side];
    const oppositeTileSide = oppositeSides[side]; // The side that matches this tile's river-side

    // Set the opposite river-side too, since it's also on that adjacent tile.
    if (oppositeTile && oppositeTile.getRiverSides()[oppositeTileSide] !== value) {
      oppositeTile.getRiverSides()[oppositeTileSide] = value;
      tilesEffected.set(oppositeTile, oppositeTileSide);
    }

    if (cacheEntry) GameMap.getInstance().storeSetRiverSideEntry(tilesEffected);

    return tilesEffected;
  }

  // `visible` is the observing player's fog state for this tile. A tile they've discovered but
  // can't currently see still reports its terrain and city (their client remembers those), but
  // never what's standing on it.
  public getTileJSON(options?: { visible?: boolean; observer?: Player }) {
    const visible = options?.visible ?? true;

    return {
      tileTypes: this.tileTypes,
      riverSides: this.riverSides,
      units: visible ? this.getUnitsJSON(options?.observer) : [],
      x: this.x,
      y: this.y,
      movementCost: this.getMovementCost(),
      city: this.cityTerritoryOf ? this.cityTerritoryOf.getJSON({ observer: options?.observer }) : null,
      yields: this.getStats(),
      improvement: this.improvement,
      visible: visible
    };
  }

  public getUnitsJSON(observer?: Player) {
    const unitJSON = [];

    for (const unit of this.units) {
      unitJSON.push(unit.asJSON({ observer: observer }));
    }

    return unitJSON;
  }

  public getMovementCost(): number {
    const tileTypesWithIncreasedCost = ["hill", "forest", "jungle"];
    const tileTypesWithInfiniteCost = ["mountain"];

    let cost = 1;

    for (const tileType of this.tileTypes) {
      if (tileTypesWithIncreasedCost.some((type) => tileType.includes(type))) {
        cost = 2;
      }

      if (tileTypesWithInfiniteCost.some((type) => tileType.includes(type))) {
        cost = 9999;
        break;
      }
    }

    return cost;
  }

  public addTileType(tileType: string, index?: number) {
    if (tileType === undefined) {
      throw new Error();
    }

    if (this.tileTypes.includes(tileType)) {
      console.log("Warning: Tried to add existing tile type for: " + tileType);

      console.log(this.getTileJSON());
      return;
    }

    if (index !== undefined) {
      this.tileTypes.splice(index, 0, tileType);
    } else {
      this.tileTypes.push(tileType);
    }

    TileIndexer.addTileType(tileType, this);
  }

  public removeTileType(removeType: string) {
    this.tileTypes = this.tileTypes.filter((type) => type != removeType);

    TileIndexer.removeTileType(removeType, this);
  }

  public setAdjacentTile(index: number, tile: Tile) {
    this.adjacentTiles[index] = tile;
  }

  public replaceTileType(oldTileType: string, newTileType: string) {
    this.tileTypes = this.tileTypes.map((type) => (type === oldTileType ? newTileType : type));

    TileIndexer.removeTileType(oldTileType, this);
    TileIndexer.addTileType(newTileType, this);
  }

  public clearTileTypes() {
    this.tileTypes = [];

    TileIndexer.clearTileTypes(this);
  }

  public containsTileType(tileType: string) {
    return this.tileTypes.includes(tileType);
  }

  public applyRiverSide(options: { previousTile?: Tile; nextTile?: Tile; originTile?: boolean }) {
    //console.log("Applying river side for: [" + this.x + "," + this.y + "]");
    /**
     * Rules:
     * * If we place down a river side, and that side already has a river. Thats okay, but if it's our only tile-side we place, we need to do additional placements to define that tile candidate better & show that we actually placed a river on that tile.
     * *
     */

    const nextTile: Tile = options.nextTile;
    const previousTile: Tile = options.previousTile;

    let currentRiverSide = undefined;

    // Start by applying a random river side, if we make a connection to the other tiles, we can return.
    if (options.originTile) {
      this.setRiverSide(this.getIndexOfAdjTile(nextTile), true);
      return;
    }

    // If we already have a river on this tile (usually from us setting a previous river-side)
    // Check if it already connects to the next tile, if so move on..
    if (nextTile) {
      for (const riverSide of this.getRiverSideIndexes({ value: true })) {
        if (this.riverConnectsToTile(riverSide, nextTile)) {
          //console.log("EVER CALLED???????????");
          return;
        }
      }
    }

    let connectedToPreviousTile = this.riverConnects(previousTile);

    if (!connectedToPreviousTile) {
      const validRiverConnections = this.getValidRiverConnections(previousTile);

      // We choose all valid connections to connect to the previous tile w/ the river,
      // From these, we then flow to the next tile
      // Then we determine the shortest path & set that.

      const potentialRiverPaths = new Map<number, Map<Tile, number[]>>();

      for (const validRiverConnection of validRiverConnections) {
        const tilesSet = new Map<Tile, number[]>();
        const adjTileOfRiverConnection = this.getAdjacentTiles()[validRiverConnection];

        if (!adjTileOfRiverConnection) continue;

        GameMap.getInstance().cacheSetRiverSides();

        if (!adjTileOfRiverConnection.isWater()) {
          this.setRiverSide(validRiverConnection, true); // MAYBE bug here

          // Update tilesSet to store in our potentialRiverPaths
          if (tilesSet.has(this)) {
            tilesSet.get(this).push(validRiverConnection);
          } else {
            tilesSet.set(this, [validRiverConnection]);
          }
        }

        currentRiverSide = validRiverConnection;

        const smallestRiverPathToNextTile = this.flowRiverToNextTile(currentRiverSide, nextTile);

        if (!smallestRiverPathToNextTile) {
          GameMap.getInstance().restoreCachedRiverSides();
          continue;
        }

        for (const riverSide of smallestRiverPathToNextTile) {
          if (!adjTileOfRiverConnection.isWater()) {
            this.setRiverSide(riverSide, true); // NOT the bug here.

            // Update tilesSet to store in our potentialRiverPaths
            if (tilesSet.has(this)) {
              tilesSet.get(this).push(riverSide);
            } else {
              tilesSet.set(this, [riverSide]);
            }
          }
        }

        potentialRiverPaths.set(validRiverConnection, tilesSet);
        GameMap.getInstance().restoreCachedRiverSides();
      }

      if (potentialRiverPaths.size > 0) {
        // TODO: Iterate through potentialRiverPaths & choose the smallest path
        let smallestRiverConnectionIndex = 0;
        let smallestRiverSidesSet = Infinity;
        for (const [validRiverConnection, tilesSet] of potentialRiverPaths.entries()) {
          let totalRiverSidesSet = 0;

          for (const riverSideSet of tilesSet.values()) {
            totalRiverSidesSet += riverSideSet.length;
          }

          if (totalRiverSidesSet < smallestRiverSidesSet) {
            smallestRiverConnectionIndex = validRiverConnection;
            smallestRiverSidesSet = totalRiverSidesSet;
          }
        }

        for (const [tile, riverSides] of potentialRiverPaths.get(smallestRiverConnectionIndex).entries()) {
          for (const riverSide of riverSides) {
            if (!tile.getAdjacentTiles()[riverSide].isWater()) {
              tile.setRiverSide(riverSide, true); //MAYBE BUG here
            }
          }
        }
      }
    }

    // If this tile already connects to the previous tile (with the river), then just flow to the next tile.
    if (connectedToPreviousTile) {
      const smallestRiverPathToNextTile = this.flowRiverToNextTile(currentRiverSide, nextTile);

      if (!smallestRiverPathToNextTile) return;

      for (const riverSide of smallestRiverPathToNextTile) {
        if (!this.getAdjacentTiles()[riverSide].isWater()) {
          this.setRiverSide(riverSide, true);
        }
      }
    }
  }

  private flowRiverToNextTile(startingRiverSide: number, nextTile: Tile): number[] {
    // Do this rotating left or right, pick smallest amount of tile-sides set.
    const orientations = new Map<string, number[]>();

    for (let orientation of ["left", "right"]) {
      const orientationRiverSidesSet: number[] = [];
      let prevRiverSide = startingRiverSide;
      GameMap.getInstance().cacheSetRiverSides();

      while (nextTile && !this.riverConnectsToTile(startingRiverSide, nextTile)) {
        //console.log(
        //  "No connection to next tile as: [" + this.x + "," + this.y + "]"
        //);

        const potentialRiverConnections = this.getConnectedRiverSides({
          emptySidesOnly: true,
          ofRiverSide: startingRiverSide
        });
        const validRiverConnections = [];

        for (const potentialConnectionIndex of potentialRiverConnections) {
          if (this.getAdjacentTiles()[potentialConnectionIndex]) {
            validRiverConnections.push(potentialConnectionIndex);
          }
        }

        if (validRiverConnections.length < 1) {
          /*console.log(
            "******* No potential river connections: " +
              validRiverConnections.length +
              " *******"
          );

          console.log("Current river side: " + startingRiverSide);
          console.log("Our river sides: ");
          console.log(this.riverSides);*/
          GameMap.getInstance().removeTopRiverSideCache();
          return [];
        }

        const side = orientation === "left" ? Math.min(...validRiverConnections) : Math.max(...validRiverConnections);

        // Choose either the smallest connection index or largest. Count how many potential connections we make, choose the smallest of the two.
        //console.log("Setting connected side: " + side + " - " + orientation);

        orientationRiverSidesSet.push(side);
        this.setRiverSide(side, true);
        startingRiverSide = side;
      }

      // Store which river-sides were set for this orientation, and reset our changes.
      orientations.set(orientation, orientationRiverSidesSet);
      startingRiverSide = prevRiverSide;
      GameMap.getInstance().restoreCachedRiverSides();
    }

    let smallestRiverPath: number[] | undefined = undefined;
    for (const value of orientations.values()) {
      if (!smallestRiverPath || value.length < smallestRiverPath.length) {
        smallestRiverPath = value;
      }
    }

    return smallestRiverPath;
  }

  /**
   * Returns a list of river-sides connecting to this tile, from the perspective of the tile argument.
   * @param tile
   * @returns
   */
  public getRiverSidesConnecting(tile: Tile): number[] {
    const connectingRiverSides: number[] = [];
    for (const riverSide of tile.getRiverSideIndexes({ value: true })) {
      if (tile.getTilesAdjacentToRiver(riverSide).includes(this)) {
        connectingRiverSides.push(riverSide);
      }
    }
    return connectingRiverSides;
  }

  /**
   * Given an adjacent tile, get available connections we can branch out from, in the from of river-side indexes.
   * @param tile
   * @returns
   */
  public getValidRiverConnections(tile: Tile): number[] {
    const connectingRiverSides = this.getRiverSidesConnecting(tile);
    let validConnections: number[] = [];
    // Our issue is we don't know which riverside from the specified tile is connecting INTO us (this).
    //this.getAllConnectedRiverSides(undefined).get(tile)
    for (const riverSide of connectingRiverSides) {
      validConnections = validConnections.concat(tile.getAllConnectedRiverSides(riverSide).get(this));
    }
    return validConnections;
  }

  /**
   * Given an adjacent tile, determine if rivers on either tile connect properly.
   *
   * This function return false if both rivers reside in the same spot visually, this is to ensure our generation code properly connects to the next river-tile.
   * @param tile
   * @returns
   */
  public riverConnects(tile: Tile): boolean {
    const connections: number[][] = [];
    const riverSidesOfTile = tile.getRiverSideIndexes({ value: true });

    // Iterate through all of our rivers...
    for (const riverSide of this.getRiverSideIndexes({ value: true })) {
      // Get a list of valid connection river-sides relevant to our compared tile
      if (!this.getAllConnectedRiverSides(riverSide).get(tile)) return false;

      // Ensure at least one river-side in our comparing tile is inside our valid connection list.
      for (const validConnectionSide of this.getAllConnectedRiverSides(riverSide).get(tile)) {
        if (riverSidesOfTile.includes(validConnectionSide)) return true;
      }
    }

    //NOTE: We still return false if there is a river on the same side visually
    return false;
  }

  /**
   * Returns a list of numbers representing indexes of riverSides[]. This list is based off the value provided (true/false).
   * @param options
   * @returns
   */
  public getRiverSideIndexes(options: { value: boolean }): number[] {
    const riverSideIndexes: number[] = [];
    for (let i = 0; i < this.riverSides.length; i++) {
      const side = this.riverSides[i];

      if (side == options.value) {
        riverSideIndexes.push(i);
      }
    }

    return riverSideIndexes;
  }

  /**
   * Fetches all connected river sides, regardless if used or not, from all tiles including the ones adjacent to the river.
   * @param riverSide
   * @returns
   */
  public getAllConnectedRiverSides(riverSide: number): Map<Tile, number[]> {
    const allConnRiverSides = new Map<Tile, number[]>();
    let connectedSides: number[][] = [];

    // Note, we have commented out numbers since when we set a river-side, the opposite adjacent tile also has it's side set.
    // If we didn't do this, visually client-side we might not see a connection if there are other river-sides present.
    switch (riverSide) {
      case 0:
        connectedSides = [[2, /*3,*/ 4], [4, 5], [], [], [], [1, 2]];
        break;
      case 1:
        connectedSides = [[2, 3], [3, /*4,*/ 5], [0, 5], [], [], []];
        break;
      case 2:
        connectedSides = [[], [3, 4], [0, /*4,*/ 5], [0, 1], [], []];
        break;
      case 3:
        connectedSides = [[], [], [4, 5], [0, /*1,*/ 5], [1, 2], []];
        break;
      case 4:
        connectedSides = [[], [], [], [0, 5], [0, /*1,*/ 2], [2, 3]];
        break;
      case 5:
        connectedSides = [[3, 4], [], [], [], [0, 1], [1, /*2,*/ 3]];
        break;
    }

    for (const adjTile of this.getTilesAdjacentToRiver(riverSide)) {
      let relativeAdjIndex = this.getIndexOfAdjTile(adjTile);
      allConnRiverSides.set(adjTile, connectedSides[relativeAdjIndex]);
    }

    // Don't forget to include this tile's sides as well.
    allConnRiverSides.set(
      this,
      this.getConnectedRiverSides({
        ofRiverSide: riverSide,
        emptySidesOnly: false
      })
    );
    return allConnRiverSides;
  }

  /**
   * Gets a list of adjacent river-side indexes that connect with existing river-sides of this tile, or a specified river side.
   * @returns
   */

  //FIXME: This doesn't work sometimes?
  public getConnectedRiverSides(options: { ofRiverSide?: number; emptySidesOnly: boolean }): number[] {
    if (!this.hasRiver()) {
      //console.log(
      //  "Warning: Tried to get connected river-sides of tile w/ no river"
      //);
      return [];
    }
    const sides: number[][] = [
      [5, 0, 1],
      [0, 1, 2],
      [1, 2, 3],
      [2, 3, 4],
      [3, 4, 5],
      [4, 5, 0]
    ];
    const adjacentSides: number[] = [];

    let riverSidesToCheck: number[] = [];
    if (options.ofRiverSide !== undefined) {
      riverSidesToCheck.push(options.ofRiverSide);
    } else {
      riverSidesToCheck = this.getRiverSideIndexes({ value: true });
    }

    for (const riverSide of riverSidesToCheck) {
      const adjacentSidesIndexes: number[] = sides[riverSide];

      for (const adjacentIndex of adjacentSidesIndexes) {
        if (options.emptySidesOnly) {
          if (this.riverSides[adjacentIndex] === false) {
            adjacentSides.push(adjacentIndex);
          }
        } else {
          adjacentSides.push(adjacentIndex);
        }
      }
    }
    return adjacentSides;
  }

  public hasRiver(): boolean {
    return this.riverSides.some((side) => side);
  }

  /**
   * Determine if the river of this tile is flowing onto the specified connected tiles.
   *
   * This doesn't mean rivers of the tiles are connecting.
   * @param riverSide
   * @param connectedTiles
   * @returns
   */

  //FIXME: Check if this is correct for riverSide = 5, connected tile is adj tile w /index =4.
  public riverConnectsToTile(riverSide: number, connectedTile: Tile) {
    const adjRiverTiles = this.getTilesAdjacentToRiver(riverSide);
    return adjRiverTiles.includes(connectedTile);
  }

  /**
   * Returns a list of tiles that the river touches, relative to this tile.
   * @param riverSide
   * @returns
   */
  public getTilesAdjacentToRiver(riverSide: number): Tile[] {
    /**
     * River side:
     * 0 - [5,0,1]
     * 1 - [0,1,2]
     * 2 - [1,2,3]
     * 3 - [2,3,4]
     * 4 - [3,4,5]
     * 5 - [4,5,0]
     */

    const adjTilesToRiver: Tile[] = [];
    const sides: number[][] = [
      [5, 0, 1],
      [0, 1, 2],
      [1, 2, 3],
      [2, 3, 4],
      [3, 4, 5],
      [4, 5, 0]
    ];

    const adjIndexes = sides[riverSide];

    if (!adjIndexes) return [];

    for (const index of adjIndexes) {
      const adjTile = this.getAdjacentTiles()[index];
      if (adjTile) {
        adjTilesToRiver.push(adjTile);
      }
    }
    return adjTilesToRiver;
  }

  public getIndexOfAdjTile(tile: Tile) {
    for (let i = 0; i < this.adjacentTiles.length; i++) {
      if (tile === this.adjacentTiles[i]) return i;
    }

    return -1;
  }

  /**
   * Will apply a random river side that isn't being already used.
   * @returns River side we applied
   */
  public applyRandomRiverSide(): number {
    const unusedSides: number[] = [];
    for (let i = 0; i < this.riverSides.length; i++) {
      if (!this.riverSides[i]) unusedSides.push(i);
    }

    if (unusedSides.length < 1) {
      console.log("Warning: Tried to apply random river side to all occupied sides...");
      return;
    }

    const randomUnusedSide = unusedSides[random.int(0, unusedSides.length - 1)];
    this.setRiverSide(randomUnusedSide, true);

    return randomUnusedSide;
  }

  /**
   *
   * @param tileTypes
   * @returns True if at least ONE provided tileType is inside this tile.
   */
  public containsTileTypes(tileTypes: string[]) {
    for (let i = 0; i < this.tileTypes.length; i++) {
      if (tileTypes.includes(this.tileTypes[i])) return true;
    }
    return false;
  }

  public containsAllTileTypes(tileTypes: string[]) {
    return tileTypes.every((tileType) => this.tileTypes.includes(tileType));
  }

  public getAdjacentTiles() {
    return this.adjacentTiles;
  }

  public setGenerationHeight(generationHeight: number) {
    this.generationHeight = generationHeight;
  }

  public setGenerationTemp(generationTemp: number) {
    this.generationTemp = generationTemp;
  }

  public getGenerationTemp() {
    return this.generationTemp;
  }

  public getGenerationHeight() {
    return this.generationHeight;
  }

  public getTileTypes() {
    return this.tileTypes;
  }

  public getX() {
    return this.x;
  }

  public getY() {
    return this.y;
  }

  public isWater(): boolean {
    return this.containsTileTypes(["ocean", "shallow_ocean", "freshwater"]);
  }

  // Land beside the sea, where a city can build ships and let them in. A lake doesn't count, since
  // nothing built there could sail anywhere. Mirrored by the client's Tile.isCoastal().
  public isCoastal(): boolean {
    if (this.isWater()) return false;

    return this.adjacentTiles.some((tile) => tile?.containsTileTypes(["ocean", "shallow_ocean"]));
  }

  /**
   * How high something standing on this tile sits, in Civ 5's sight tiers - flat ground and water
   * at 0, hills at 1, mountains at 2. Forest and jungle deliberately don't count: standing among
   * the trees doesn't let you see any further, it only hides you from others (see
   * getSightBlockingHeight). Same substring convention as getMovementCost(), since tile type
   * strings are biome-prefixed (e.g. "grass_hill").
   */
  public getSightElevation(): number {
    if (this.tileTypes.some((type) => type.includes("mountain"))) return Tile.ELEVATION_MOUNTAIN;
    if (this.tileTypes.some((type) => type.includes("hill"))) return Tile.ELEVATION_HILL;

    return Tile.ELEVATION_FLAT;
  }

  /**
   * How high this tile blocks sight - its own elevation, plus a step for anything growing on it.
   * Forest and jungle hide what's behind them the way a hill does, so woods on a hill block as
   * high as a mountain. See GameMap.hasLineOfSight(), which blocks a view whenever this exceeds
   * the elevation the viewer is standing at.
   */
  public getSightBlockingHeight(): number {
    const canopy = this.tileTypes.some((type) => type.includes("forest") || type.includes("jungle"));

    return this.getSightElevation() + (canopy ? 1 : 0);
  }

  public getDistanceFrom(tile: Tile) {
    const dx = GameMap.shortestXDistance(this.x, tile.x);
    const dy = this.y - tile.y;
    return Math.sqrt(dx ** 2 + dy ** 2);
  }

  public toString(): string {
    return this.tileTypes.toString();
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

  //TODO: Function works but naming is confusing, we don't use grid variables in server.
  public static gridDistance(tile1: Tile, tile2: Tile) {
    const dx = GameMap.shortestXDistance(tile1.getX(), tile2.getX());
    return Math.sqrt(Math.pow(dx, 2) + Math.pow(tile2.getY() - tile1.getY(), 2));
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

  public getStats(): StatEntry[] {
    const tileStats: StatEntry[] = [
      { science: 0 },
      { gold: 0 },
      { production: 0 },
      { faith: 0 },
      { culture: 0 },
      { food: 0 },
      { morale: 0 }
    ];
    for (const tileType of this.tileTypes) {
      const tileTypeData = Tile.getAllTileStats()[tileType.toUpperCase()];
      if (!tileTypeData || !tileTypeData.stats) continue;

      for (const statData of tileTypeData.stats) {
        const statName = Object.keys(statData)[0] as keyof StatValues;
        const statValue = statData[statName];

        for (const stat of tileStats) {
          if (Object.keys(stat)[0] === statName) {
            stat[statName] += statValue;
          }
        }
      }
    }

    // Apply City Center bonus (Min 2 Food)
    if (this.city) {
      for (const stat of tileStats) {
        if (stat.food !== undefined && stat.food < 2) {
          stat.food = 2;
        }
      }
    }

    return tileStats;
  }

  public getTotalStatValue(stats: string[]): number {
    let total = 0;

    for (const stat of this.getStats()) {
      const statName = Object.keys(stat)[0] as keyof StatValues;

      if (stats.includes("default") || stats.includes(statName)) {
        total += stat[statName];
      }
    }

    return total;
  }

  // Mountains have no base yields and can never be assigned as a worked tile.
  public isWorkable(): boolean {
    return !this.tileTypes.some((type) => type.includes("mountain"));
  }

  private hasStackingConflict(player: Player, isUtility: boolean, ignoredUnit?: Unit): boolean {
    const otherUnits = this.units.filter((unit) => unit !== ignoredUnit);

    // A unit from another civilization always blocks.
    if (otherUnits.some((unit) => unit.getPlayer() !== player)) {
      return true;
    }

    // Same-type ally units can't stack (utility+utility, or non-utility+non-utility); mixed types can.
    return otherUnits.some((unit) => unit.isUtility() === isUtility);
  }
}
