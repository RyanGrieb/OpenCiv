import random from "random";

export class Tile {
  //== Generation Values ==
  private generationHeight: number;
  private generationTemp: number;
  //== Generation Values ==
  private tileTypes: string[];
  private adjacentTiles: Tile[];
  private riverSides: boolean[];

  private x: number;
  private y: number;

  constructor(tileType: string, x: number, y: number) {
    this.generationHeight = 0;
    this.generationTemp = 0;

    this.tileTypes = [];
    this.tileTypes.push(tileType);

    this.adjacentTiles = [];
    this.riverSides = new Array(6).fill(false);

    this.x = x;
    this.y = y;
  }

  public getRiverSides() {
    return this.riverSides;
  }

  public setRiverSide(side: number, value: boolean): Map<Tile, number> {
    const tilesAffected = new Map<Tile, number>();

    this.riverSides[side] = value;
    console.log(
      "Setting river side: " +
        side +
        " for tile: [" +
        this.x +
        "," +
        this.y +
        "]"
    );
    tilesAffected.set(this, side);

    const oppositeSides: number[] = [3, 4, 5, 0, 1, 2];
    let oppositeSide = oppositeSides[side];

    // Set the opposite river-side too, since it's also on that adjacent tile.
    if (
      this.adjacentTiles[side] &&
      this.adjacentTiles[side].getRiverSides[oppositeSide] !== value
    ) {
      this.adjacentTiles[side].getRiverSides()[oppositeSide] = value;
      tilesAffected.set(this.adjacentTiles[side], oppositeSide);
    }

    return tilesAffected;
  }

  public getTileJSON() {
    return {
      tileTypes: this.tileTypes,
      riverSides: this.riverSides,
      x: this.x,
      y: this.y,
    };
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
  }

  public removeTileType(removeType: string) {
    this.tileTypes = this.tileTypes.filter((type) => type != removeType);
  }

  public setAdjacentTile(index: number, tile: Tile) {
    this.adjacentTiles[index] = tile;
  }

  public replaceTileType(oldTileType: string, newTileType: string) {
    this.tileTypes = this.tileTypes.map((type) =>
      type === oldTileType ? newTileType : type
    );
  }

  public clearTileTypes() {
    this.tileTypes = [];
  }

  public containsTileType(tileType: string) {
    return this.tileTypes.includes(tileType);
  }

  public applyRiverSide(options: {
    previousTile?: Tile;
    nextTile?: Tile;
    originTile?: boolean;
  }) {
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
      currentRiverSide = this.applyRandomRiverSide();

      console.log("Starting river side: " + currentRiverSide);

      if (this.riverConnectsToTile(currentRiverSide, nextTile)) {
        console.log(
          "Origin tile connects to the next tile down the line, returning..."
        );
        return;
      }

      while (!this.riverConnectsToTile(currentRiverSide, nextTile)) {
        const potentialRiverConnections = this.getConnectedRiverSides({
          emptySidesOnly: true,
          ofRiverSide: currentRiverSide,
        });
        if (potentialRiverConnections.length < 1) {
          console.log(
            "No potential river connections: " +
              potentialRiverConnections.length
          );
          return;
        }

        let randomConnectedRiverSide =
          potentialRiverConnections[
            random.int(0, potentialRiverConnections.length - 1)
          ];
        console.log(
          "Setting random connected side: " + randomConnectedRiverSide
        );
        this.setRiverSide(randomConnectedRiverSide, true);
        currentRiverSide = randomConnectedRiverSide;
      }
    }

    // If the connected tile has a river side, make sure to attach to that.
    const connectedTilesWithRivers: Tile[] = [];
    // If connected tile doesn't have a river side, just make sure our new river just connects with it then.
    const connectedTilesNoRivers: Tile[] = [];

    for (const tile of [previousTile, nextTile]) {
      if (!tile) continue;

      if (tile.hasRiver()) {
        connectedTilesWithRivers.push(tile);
      } else {
        connectedTilesNoRivers.push(tile);
      }
    }

    // First, make a random connection w/ the connected tiles w/ rivers. (The origin tile will always be a connectedTile /w river)
    for (const riverTile of connectedTilesWithRivers) {
      // Check if we are already connected to this riverTile
      if (!this.riverConnects(riverTile)) {
        const validRiverConnections = this.getValidRiverConnections(riverTile);

        // Choose random valid side & set.
        let randomConnectedRiverSide =
          validRiverConnections[
            random.int(0, validRiverConnections.length - 1)
          ];

        // Check if we can link up with the next tile. This prevents random deviations in our river.
        // NOTE: This doesn't completely stop deviations,
        if (nextTile) {
          for (const validConnection of validRiverConnections) {
            if (
              this.getTilesAdjacentToRiver(validConnection).includes(nextTile)
            ) {
              randomConnectedRiverSide = validConnection;
            }
          }
        }

        //FIXME: We should not set a random side here... This causes random deviations in the river.
        console.log("Connecting to riverTile... - " + randomConnectedRiverSide);
        this.setRiverSide(randomConnectedRiverSide, true);
        currentRiverSide = randomConnectedRiverSide;
      }
    }

    // Do this rotating left or right, pick smallest amount of tile-sides set.
    const orientations = new Map<string, number[]>();

    for (let orientation of ["left", "right"]) {
      const riverSidesSet: number[] = [];
      let prevRiverSide = currentRiverSide;
      const riverSideHistory = new Map<Tile, number[]>();

      while (
        options.nextTile &&
        !this.riverConnectsToTile(currentRiverSide, options.nextTile)
      ) {
        console.log("No connection");

        const potentialRiverConnections = this.getConnectedRiverSides({
          emptySidesOnly: true,
          ofRiverSide: currentRiverSide,
        });
        const validRiverConnections = [];

        for (const potentialConnectionIndex of potentialRiverConnections) {
          if (
            this.getAdjacentTiles()[potentialConnectionIndex] &&
            !this.getAdjacentTiles()[potentialConnectionIndex].isWater() &&
            !this.getAdjacentTiles()[potentialConnectionIndex].hasRiver()
          ) {
            validRiverConnections.push(potentialConnectionIndex);
          }
        }

        /*console.log(
          "For tile [" +
            this.x +
            "," +
            this.y +
            "] valid connections: " +
            validRiverConnections
        );*/

        if (validRiverConnections.length < 1) {
          console.log(
            "No potential river connections: " + validRiverConnections.length
          );
          return; //FIXME: Returning here sometimes prevents the rest of the river from forming.
        }

        const side =
          orientation === "left"
            ? Math.min(...validRiverConnections)
            : Math.max(...validRiverConnections);

        // Choose either the smallest connection index or largest. Count how many potential connections we make, choose the smallest of the two.
        console.log("Setting connected side: " + side + " - " + orientation);

        riverSidesSet.push(side);
        const tilesEffected = this.setRiverSide(side, true);

        for (const [effectedTile, riverSide] of tilesEffected.entries()) {
          if (riverSideHistory.has(effectedTile)) {
            riverSideHistory.get(effectedTile).push(riverSide);
          } else {
            riverSideHistory.set(effectedTile, [riverSide]);
          }
        }

        currentRiverSide = side;
      }

      orientations.set(orientation, riverSidesSet);
      currentRiverSide = prevRiverSide;

      //console.log("History");
      //console.log(riverSideHistory);
      for (const [effectedTile, riverSides] of riverSideHistory.entries()) {
        for (const riverSide of riverSides) {
          effectedTile.getRiverSides()[riverSide] = false; // Note, we don't use the this.setRiverSide() method as I don't want to effect other tiles
        }
      }
    }

    let smallestRiverPath: number[] | undefined = undefined;
    for (const value of orientations.values()) {
      if (!smallestRiverPath || value.length < smallestRiverPath.length) {
        smallestRiverPath = value;
      }
    }

    console.log("Path candidates for [" + this.x + "," + this.y + "]:");
    console.log(orientations.values());
    console.log("Smallest path: " + smallestRiverPath);

    for (const riverSide of smallestRiverPath) {
      this.setRiverSide(riverSide, true);
    }
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
      validConnections = validConnections.concat(
        tile.getAllConnectedRiverSides(riverSide).get(this)
      );
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
      for (const validConnectionSide of this.getAllConnectedRiverSides(
        riverSide
      ).get(tile)) {
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
        emptySidesOnly: false,
      })
    );
    return allConnRiverSides;
  }

  /**
   * Gets a list of adjacent river-side indexes that connect with existing river-sides of this tile, or a specified river side.
   * @returns
   */
  public getConnectedRiverSides(options: {
    ofRiverSide?: number;
    emptySidesOnly: boolean;
  }): number[] {
    if (!this.hasRiver()) {
      console.log(
        "Warning: Tried to get connected river-sides of tile w/ no river"
      );
      return [];
    }
    const sides: number[][] = [
      [5, 0, 1],
      [0, 1, 2],
      [1, 2, 3],
      [2, 3, 4],
      [3, 4, 5],
      [4, 5, 0],
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
          if (!this.riverSides[adjacentIndex]) {
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
      [4, 5, 0],
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
      console.log(
        "Warning: Tried to apply random river side to all occupied sides..."
      );
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

  public getDistanceFrom(tile: Tile) {
    const dx = this.x + 0.5 - (tile.x + 0.5);
    const dy = this.y + 0.5 - (tile.y + 0.5);
    return Math.sqrt(dx ** 2 + dy ** 2);
  }
}
