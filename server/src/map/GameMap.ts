import { Player } from "../Player";
import { Tile } from "./Tile";
import random from "random";
import { MapResources } from "./MapResources";
import { TileIndexer } from "./TileIndexer";

enum MapSize {
  DUEL = "40x24",
  TINY = "56x36",
  SMALL = "68x44",
  STANDARD = "80x52",
  LARGE = "104x64",
  HUGE = "128x80",
}

export class GameMap {
  private static oddEdgeAxis = [
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 0],
  ];
  private static evenEdgeAxis = [
    [-1, -1],
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 1],
    [-1, 0],
  ];

  private static tiles: Tile[][];
  private static mapWidth: number;
  private static mapHeight: number;
  private static mapArea: number;
  public static riverSideHistory: Map<Tile, number[]>[];

  public static init() {
    // Assign map dimension values
    const mapDimensions = this.getDimensionValues(MapSize.TINY);
    this.mapWidth = mapDimensions[0];
    this.mapHeight = mapDimensions[1];
    this.mapArea = this.mapWidth * this.mapHeight;
    this.riverSideHistory = [];

    // Initialize all tiles as ocean tiles
    this.tiles = [];
    for (let x = 0; x < this.mapWidth; x++) {
      this.tiles[x] = [];
      for (let y = 0; y < this.mapHeight; y++) {
        this.tiles[x][y] = new Tile("ocean", x, y);
      }
    }

    // After creating all tile objects, assign their respective adjacent tiles
    this.initAdjacentTiles();
    this.generateTerrain();
  }

  public static generateTerrain() {
    /**
     * Map generation:
     * == Generate grass circles ==
     * 1. Define a paint tool that draws a circle of grass around a certain point
     * 2. Randomly paint these circles on the map, where the closer to the center you are, the higher chance we paint
     * 3. Keep doing this until (90% - pangaea, 50% - Normal, 25% - Island) of the map is grass.
     * == Generate hills & mountains ==
     * 3. Keep track of tiles that are already painted. If we paint over an existing tile, store that increment in a 2D array.
     * 4. Once finally painted (For pangaea ensure no islands), we now focus on hills & mountains.
     * 5. Take the highest values and assign those to mountain tiles, other tiles will be hills.
     * 6. Note, we only want 3% of tiles to be mountains, 10-25% to be hills. We would
     * == Generate biomes (based on hot, cold, wet, dry)
     * 7. First, we focus on hot & cold factors. We generate a random gradient, where there are higher chances of cold tiles at the top and bottom parts of the map & vice. versa for hot tiles.
     *
     */

    // == Generate grass circles ==
    const LAND_MASS_PARAM = 6;
    const landMassSize = ((this.mapWidth * this.mapHeight) / 12.5) * (LAND_MASS_PARAM + 2);
    const maxPathLength = 140;
    const maxLandmassIterations = 10000;
    let landmassIterations = 0;

    while (this.getTotalGeographyLandMass() < landMassSize) {
      landmassIterations++;
      let rndX = random.int(10, this.mapWidth - 11);
      let rndY = random.int(10, this.mapHeight - 11);
      const currentPathLength = random.int(40, maxPathLength);

      // Draw a bunch of broken circles in a random direction until currentPathLength limit is reached.
      this.generateTilePath({
        tile: this.tiles[rndX][rndY],
        pathLength: currentPathLength,
        setTileType: "grass",
        followTileTypes: ["ocean"],
        setTileChance: 0.5,
        overrideWater: true,
      });

      if (landmassIterations >= maxLandmassIterations) break;
    }
    // == Generate grass circles ==

    // == Clear isolated single ocean tiles
    for (let x = 0; x < this.mapWidth; x++) {
      for (let y = 0; y < this.mapHeight; y++) {
        const tile = this.tiles[x][y];

        if (tile.containsTileType("ocean")) {
          let surroundedByLand = true;
          for (const adjTile of tile.getAdjacentTiles()) {
            if (!adjTile) continue;

            if (adjTile.containsTileType("ocean")) {
              surroundedByLand = false;
            }
          }

          if (surroundedByLand) {
            tile.replaceTileType("ocean", "grass");
          }
        }
      }
    }
    // == Clear isolated single ocean tiles

    // == Generate hills & mountains
    const tallestTiles: Tile[] = [];

    console.log("Generating tallest tiles...");
    for (let x = 0; x < this.mapWidth; x++) {
      for (let y = 0; y < this.mapHeight; y++) {
        // Insert into tallestTiles while maintaining a sorted order
        const currentTile = this.tiles[x][y];

        if (currentTile.containsTileType("ocean")) continue;

        let low = 0;
        let high = tallestTiles.length;

        while (low < high) {
          var mid = (low + high) >>> 1; // Same as: (low + high) / 2
          if (tallestTiles[mid].getGenerationHeight() > currentTile.getGenerationHeight())
            low = mid + 1;
          else high = mid;
        }
        const insertionIndex = low;

        tallestTiles.splice(insertionIndex, 0, currentTile);
      }
    }

    console.log("Done generating tallest tiles - " + tallestTiles.length);

    //Assign top 10% of tiles to have a 50% of becoming a hill tile
    const totalHills = tallestTiles.length * 0.1;
    for (let i = 0; i < totalHills; i++) {
      if (Math.random() < 0.5) tallestTiles[i].replaceTileType("grass", "grass_hill");
    }

    // TODO: Spawn hills in patches?
    // For all other grass tiles, make it a 13% of becoming a hill tile.
    for (let i = 0; i < tallestTiles.length; i++) {
      if (Math.random() < 0.13) tallestTiles[i].replaceTileType("grass", "grass_hill");
    }

    //Assign the top 5% of tiles to be mountains
    const totalMountains = tallestTiles.length * 0.05;
    for (let i = 0; i < totalMountains; i++) {
      tallestTiles[i].replaceTileType("grass", "mountain");
    }
    // == Generate hills & mountains

    // == Generate biomes (deserts,jungle,plains,tundra,snow)
    console.log("Setting tile temperatures...");
    for (let y = 0; y < this.mapHeight; y++) {
      const yPercent = y / this.mapHeight;
      for (let x = 0; x < this.mapWidth; x++) {
        const tile = this.tiles[x][y];

        if (tile.containsTileType("ocean")) continue;

        if (yPercent <= 0.1 || yPercent >= 0.9) {
          tile.setGenerationTemp(random.int(0, 31)); //TODO: Higher temp on y-values closer to midpoint.
        } else if ((yPercent > 0.1 && yPercent < 0.3) || (yPercent > 0.7 && yPercent < 0.9)) {
          tile.setGenerationTemp(random.int(32, 60));
        } else {
          tile.setGenerationTemp(random.int(60, 100));
        }
      }
    }
    console.log("Done setting tile temperatures!");

    // Generate snow & tundra tiles base on y-axis (not temp...)
    console.log("Generating snow & tundra tiles...");
    for (let x = 0; x < this.mapWidth; x++) {
      for (let y = 0; y < this.mapHeight; y++) {
        const yPercent = y / this.mapHeight;
        const currentTile = this.tiles[x][y];

        if (currentTile.containsTileType("ocean")) continue;

        if (yPercent <= 0.1 || yPercent >= 0.9) {
          this.setTileBiome({ tile: currentTile, tileType: "snow" });
        } else if ((yPercent > 0.1 && yPercent < 0.15) || (yPercent > 0.85 && yPercent < 0.9)) {
          if (Math.random() > 0.25) {
            for (const adjTile of currentTile.getAdjacentTiles()) {
              if (!adjTile) continue;
              //FIXME: This can create single ocean/freshwater tiles.
              this.setTilesBiome(adjTile.getAdjacentTiles(), "tundra", 0.1);
            }
          }
          this.setTileBiome({ tile: currentTile, tileType: "tundra" });
        } else {
        }
      }
    }
    console.log("Done generating snow & tundra tiles!");

    // Generate plains & deserts based on temp. Create a small path...

    // For plains, pick origin tile w/ temp b/w 60,80 & create a small path
    const numberOfPlainsBiomes = Math.ceil(this.mapArea * 0.002403846); // 10 For a standard map...
    console.log("Generating plains biomes... - " + numberOfPlainsBiomes);
    for (let i = 0; i < numberOfPlainsBiomes; i++) {
      const originTile = this.getRandomTileWith({
        tileTypes: ["grass"],
        tempRange: [60, 80],
      });
      if (!originTile) continue;
      this.generateTilePath({
        tile: originTile,
        pathLength: 15,
        setTileType: "plains",
        followTileTypes: ["grass"],
        setTileChance: 0.95,
        overrideWater: false,
      });
    }
    console.log("Done generating plains biomes!");

    // For desert, pick origin tile w/ temp b/w 95,100 & create a small path
    const numberOfDesertBiomes = Math.ceil(this.mapArea * 0.000721154); // 3 for a standard map...
    console.log("Generating desert biomes... - " + numberOfDesertBiomes);
    for (let i = 0; i < numberOfDesertBiomes; i++) {
      const originTile = this.getRandomTileWith({
        tileTypes: ["grass"],
        tempRange: [95, 100],
      });
      if (!originTile) continue;
      // Now we have random origin, create path
      this.generateTilePath({
        tile: originTile,
        pathLength: 15,
        setTileType: "desert",
        followTileTypes: ["grass", "grass_hill"],
        setTileChance: 0.95,
        overrideWater: false,
      });
    }
    console.log("Done generating desert biomes!");

    // For Jungle, pick temp b/w 60, 80 & wetness (todo: figure that out..)
    const numberOfJungleBiomes = Math.ceil(this.mapArea * 0.000721154); // 3 for a standard map...
    console.log("Generating jungle biomes... - " + numberOfJungleBiomes);
    for (let i = 0; i < numberOfJungleBiomes; i++) {
      const originTile = this.getRandomTileWith({
        tileTypes: ["grass"],
        tempRange: [60, 75],
      });
      if (!originTile) continue;
      // Now we have random origin, create path
      this.generateTilePath({
        tile: originTile,
        pathLength: 15,
        setTileType: "jungle",
        followTileTypes: ["grass", "grass_hill"],
        setTileChance: 0.5,
        overrideWater: false,
        setFollowTileTypeOnly: true,
        clearExistingTileTypes: false,
      });
    }
    console.log("Done generating jungle tiles!");

    // FIXME: getRandomTileWith ["grass"] includes tiles w/ jungle already on top. Think of way to specify that we don't want this.

    const numberOfForestBiomes = Math.ceil(this.mapArea * 0.024038462); // 50 for a standard map...
    console.log("Generating forest biomes... - " + numberOfForestBiomes);
    for (let i = 0; i < numberOfForestBiomes; i++) {
      const originTile = this.getRandomTileWith({
        tileTypes: ["grass"],
        tempRange: [32, 90],
      });
      if (!originTile) continue;
      // Now we have random origin, create path
      this.generateTilePath({
        tile: originTile,
        pathLength: 5,
        setTileType: "forest",
        followTileTypes: ["grass", "grass_hill", "plains", "plains_hill", "tundra", "tundra_hill"],
        setTileChance: 0.1,
        overrideWater: false,
        setFollowTileTypeOnly: true,
        clearExistingTileTypes: false,
      });
    }
    console.log("Done generating forest tiles!");

    // == Generate freshwater tiles. FIXME: This is slow. Create a tileIndexer("ocean"): Tiles[] function?
    console.log("Generating freshwater tiles...");
    for (let x = 0; x < this.mapWidth; x++) {
      for (let y = 0; y < this.mapHeight; y++) {
        const tile = this.tiles[x][y];

        if (!tile.containsTileType("ocean")) {
          continue;
        }

        let freshwater = true; // False if one of the adj tile is undefined (map edge)
        let traverseQueue: Tile[] = [];
        let traversedTiles: Tile[] = [];

        traverseQueue.push(tile);
        while (traverseQueue.length > 0) {
          let currentTile: Tile = traverseQueue.shift();
          traversedTiles.push(currentTile);

          for (const adjTile of currentTile.getAdjacentTiles()) {
            if (!adjTile) {
              freshwater = false;
            } else if (adjTile.containsTileType("ocean")) {
              if (!traversedTiles.includes(adjTile) && !traverseQueue.includes(adjTile)) {
                traverseQueue.push(adjTile);
              }
            }
          }
        }

        if (freshwater) {
          for (let tile of traversedTiles) {
            tile.replaceTileType("ocean", "freshwater");
          }
        }
      }
    }
    console.log("Done generating freshwater tiles!");
    // == Generate freshwater tiles

    // == Generate shallow ocean tiles FIXME: Also slow.
    for (let x = 0; x < this.mapWidth; x++) {
      for (let y = 0; y < this.mapHeight; y++) {
        const tile = this.tiles[x][y];

        if (!tile.containsTileType("ocean")) {
          continue;
        }

        for (const adjTile of tile.getAdjacentTiles()) {
          if (!adjTile) continue;
          if (!adjTile.containsTileTypes(["ocean", "shallow_ocean"])) {
            tile.replaceTileType("ocean", "shallow_ocean");
          }
        }
      }
    }

    for (let x = 0; x < this.mapWidth; x++) {
      for (let y = 0; y < this.mapHeight; y++) {
        const tile = this.tiles[x][y];

        if (!tile.containsTileType("ocean")) {
          continue;
        }

        for (const adjTile of tile.getAdjacentTiles()) {
          if (!adjTile) continue;
          if (adjTile.containsTileType("shallow_ocean") && Math.random() > 0.75) {
            tile.replaceTileType("ocean", "shallow_ocean");
          }
        }
      }
    }
    // == Generate shallow ocean tiles

    // == Generate strategic, bonus and luxury resources
    const numberOfResources = Math.ceil(this.mapArea * 0.0418526785714286); // 75 for tiny map..
    for (let i = 0; i < numberOfResources * 3; i++) {
      let mapResourceType = "N/A";
      if (i < numberOfResources) {
        mapResourceType = "bonus";
      } else if (i > numberOfResources && i < numberOfResources * 2) {
        mapResourceType = "strategic";
      } else {
        mapResourceType = "luxury";
      }
      const mapResource = MapResources.getRandomMapResource({
        mapResourceType: mapResourceType,
      });

      const originTile = this.getRandomTileWith({
        tileTypes: mapResource.getSpawnTiles(),
        onAdditionalTileTypes: mapResource.spawnOnAdditionalTileTypes(),
        avoidResourceTiles: true,
        tempRange: [mapResource.getMinTemp(), mapResource.getMaxTemp()],
      });

      if (!originTile) {
        console.log("no origin tile found");
        continue;
      }

      console.log("Generate resource: " + mapResource.name);
      // Now we have random origin, create path
      this.generateTilePath({
        tile: originTile,
        pathLength: mapResource.pathLength,
        setTileType: mapResource.name,
        followTileTypes: mapResource.getSpawnTiles(),
        setTileChance: mapResource.getSetChance(),
        minTilesSet: mapResource.getMinTilesSet(),
        maxTilesSet: mapResource.getMaxTilesSet(),
        overrideWater: mapResource.getSpawnTiles().includes("ocean") ? true : false,
        setFollowTileTypeOnly: true,
        clearExistingTileTypes: false,
        insertIndex: 1, // Puts the resource behind trees, jungle
        onAdditionalTileTypes: mapResource.onAdditionalTileTypes,
        avoidResourceTiles: true,
      });
    }
    // == Generate strategic, bonus and luxury resources

    // == Generate rivers
    const riverAmount = 25; //FIXME: The higher number the higher chance of infinite loop.
    rivenGenLoop: for (let riverIndex = 0; riverIndex < riverAmount; riverIndex++) {
      console.log("riverGenLoop");
      let originTile: Tile = undefined;
      findRiverOriginLoop: while (!originTile) {
        originTile = GameMap.getRandomTileWith({
          tileTypes: [
            "grass_hill",
            "plains_hill",
            "desert_hill",
            "tundra_hill",
            "snow_hill",
            "mountain",
          ],
        });

        for (const adjTile of originTile.getAdjacentTiles()) {
          if (!adjTile) continue;

          if (adjTile.containsTileType("river_candidate") || adjTile.isWater()) {
            originTile = undefined;
            continue findRiverOriginLoop;
          }
        }

        if (originTile.hasRiver()) {
          originTile = undefined;
          continue;
        }
      }

      // originTile.addTileType("debug3");
      originTile.addTileType("river_candidate");

      const currentRiverTiles: Tile[] = [originTile];

      let currentTile = originTile;
      let lastTraversedTile = undefined;
      let riverLength = 1;

      riverPathLoop: while (true) {
        const nextTileCandidates: Tile[] = GameMap.getNextPotentialRiverTiles(
          currentTile,
          lastTraversedTile,
          originTile
        );

        lastTraversedTile = currentTile;

        if (nextTileCandidates.length < 1) {
          currentTile = undefined;
          break riverPathLoop;
        }

        // Traverse to the next tile from nextTileCandidates[]
        currentTile = nextTileCandidates[random.int(0, nextTileCandidates.length - 1)];

        if (!currentTile) {
          riverIndex--;
          break riverPathLoop;
        }

        //currentTile.addTileType("debug2");
        currentTile.addTileType("river_candidate");

        currentRiverTiles.push(currentTile);
        riverLength++;

        // If the next tile already has a river, we can end this river, and attempt to connect later on.
        if (currentTile.hasRiver()) break riverPathLoop;

        // If the next tile has an adjacent river, we can end this river, and attempt to flow into that body of water.
        for (const adjTile of currentTile.getAdjacentTiles()) {
          if (adjTile && adjTile.isWater()) break riverPathLoop;
        }

        if (riverLength >= 50) break riverPathLoop;
      }

      for (let i = 0; i < currentRiverTiles.length; i++) {
        const tile = currentRiverTiles[i];
        tile.removeTileType("river_candidate");
      }

      //FIXME: This causes infinite loop on smaller maps...
      //if (currentRiverTiles.length < 10) {
      //  riverIndex--;
      //  continue;
      //}

      GameMap.cacheSetRiverSides();
      let appliedRiverSides = 0;

      for (let i = 0; i < currentRiverTiles.length; i++) {
        const tile = currentRiverTiles[i];
        //tile.removeTileType("river_candidate");

        let prevTile: Tile = undefined;
        let nextTile: Tile = undefined;

        if (i < currentRiverTiles.length - 1) nextTile = currentRiverTiles[i + 1]; // Include the next tile we are traversing

        if (i > 0) prevTile = currentRiverTiles[i - 1]; // Ensure we are including the previous tile such that we can connect to it through our method.

        if (!tile.containsTileType("debug3")) {
          //tile.addTileType("debug2");
        }
        console.log(
          "Generating river for tile: [" +
            tile.getX() +
            "," +
            tile.getY() +
            "] on river index: " +
            riverIndex
        );
        tile.applyRiverSide({
          originTile: i == 0,
          previousTile: prevTile,
          nextTile: nextTile,
        });
        appliedRiverSides++;
      }

      //TODO: Try to attach to water tiles at the end of our river, and try to attach to other existing rivers if possible.

      // Determine if we created a tile w/ more than 4 river-sides, remove this river if we did that.
      let tooManyRiverSides = false;
      for (let i = 0; i < currentRiverTiles.length; i++) {
        const tile = currentRiverTiles[i];
        if (tile.getRiverSideIndexes({ value: true }).length > 3) tooManyRiverSides = true;
      }

      if (tooManyRiverSides || appliedRiverSides < 3) {
        console.log(
          "Failed to generate tile, starting at: " +
            currentRiverTiles[0].getX() +
            "," +
            currentRiverTiles[0].getY() +
            " - " +
            tooManyRiverSides +
            " || " +
            appliedRiverSides
        );
        //console.log(tooManyRiverSides + "," + tooManyRiverSides);

        for (let i = 0; i < currentRiverTiles.length; i++) {
          const tile = currentRiverTiles[i];
          tile.removeTileType("debug3");
          tile.removeTileType("debug2");
        }
      }

      if (tooManyRiverSides || appliedRiverSides < 3) {
        riverIndex--;
        console.log("Oh no!");
        //currentRiverTiles[0].addTileType("debug1");
        GameMap.restoreCachedRiverSides(); //FIXME: This fails to delete river-sides adj to border sometimes
      }
      GameMap.removeTopRiverSideCache();
    }
    // == Generate rivers

    // == Apply floodplains for desert tiles w/ river tiles.
    const desertTiles = TileIndexer.getTileByTileType("desert");
    for (const tile of desertTiles) {
      if (tile.hasRiver()) {
        tile.replaceTileType("desert", "floodplains");
      }
    }
  }

  public static getNextPotentialRiverTiles(
    currentTile: Tile,
    lastTraversedTile: Tile,
    originTile: Tile
  ) {
    const nextTileCandidates = [];
    adjCandidateTilesLoop: for (const adjacentCandidateTile of currentTile.getAdjacentTiles()) {
      let deleteCandidate = false;

      if (!adjacentCandidateTile) {
        continue adjCandidateTilesLoop;
      }
      // Don't allow tiles to be water, thats where rivers end!
      if (adjacentCandidateTile.isWater()) {
        continue adjCandidateTilesLoop;
      }

      if (adjacentCandidateTile.containsTileTypes(["river_candidate"])) {
        continue adjCandidateTilesLoop;
      }

      // Check if the distance of the candidate is closer to the origin than the lastTraversedTile, if so remove it
      if (lastTraversedTile) {
        if (
          originTile.getDistanceFrom(adjacentCandidateTile) <=
          originTile.getDistanceFrom(lastTraversedTile)
        ) {
          continue adjCandidateTilesLoop;
        }
      }

      // Don't allow riverCandidate tiles to be adjacent to the map border
      for (const adjTile of adjacentCandidateTile.getAdjacentTiles()) {
        if (!adjTile) {
          continue adjCandidateTilesLoop;
        }
      }

      let adjRiverCandidateAmount = 0;
      for (const adjTile of adjacentCandidateTile.getAdjacentTiles()) {
        if (adjTile && adjTile.containsTileType("river_candidate")) {
          adjRiverCandidateAmount++;
        }
      }

      // Don't nest ourselves around a-ton of river candidates, this can mess up our river generation
      if (adjRiverCandidateAmount > 2) {
        continue adjCandidateTilesLoop;
      }

      nextTileCandidates.push(adjacentCandidateTile);
    }

    return nextTileCandidates;
  }

  public static getDimensionValues(mapSize: MapSize) {
    const values = [
      parseInt(mapSize.substring(0, mapSize.indexOf("x"))),
      parseInt(mapSize.substring(mapSize.indexOf("x") + 1)),
    ];
    return values;
  }
  public static sendMapChunksToPlayer(player: Player) {
    player.sendNetworkEvent({
      event: "mapSize",
      width: this.mapWidth,
      height: this.mapHeight,
    });

    for (let x = 0; x < this.mapWidth; x += 4) {
      for (let y = 0; y < this.mapHeight; y += 4) {
        const chunkTiles = [];

        for (let chunkX = 0; chunkX < 4; chunkX++) {
          for (let chunkY = 0; chunkY < 4; chunkY++) {
            chunkTiles.push(this.tiles[x + chunkX][y + chunkY].getTileJSON());
          }
        }

        let lastChunk = false;
        if (x === this.mapWidth - 4 && y === this.mapHeight - 4) {
          lastChunk = true;
        }
        player.sendNetworkEvent({
          event: "mapChunk",
          tiles: chunkTiles,
          lastChunk: lastChunk,
        });
      }
    }
  }

  private static getTotalGeographyLandMass() {
    let total = 0;
    for (let x = 0; x < this.mapWidth; x++) {
      for (let y = 0; y < this.mapHeight; y++) {
        if (this.tiles[x][y].getGenerationHeight() != 0) total++;
      }
    }

    return total;
  }

  /**
   * Iterate through every tile & assign it's adjacent neighboring tiles through: setAdjacentTile()
   */
  private static initAdjacentTiles() {
    for (let x = 0; x < this.mapWidth; x++) {
      for (let y = 0; y < this.mapHeight; y++) {
        // Set the 6 edges of the hexagon.

        let edgeAxis: number[][];
        if (y % 2 == 0) edgeAxis = this.evenEdgeAxis;
        else edgeAxis = this.oddEdgeAxis;

        for (let i = 0; i < edgeAxis.length; i++) {
          let edgeX = x + edgeAxis[i][0];
          let edgeY = y + edgeAxis[i][1];

          if (
            edgeX == -1 ||
            edgeY == -1 ||
            edgeX > this.mapWidth - 1 ||
            edgeY > this.mapHeight - 1
          ) {
            this.tiles[x][y].setAdjacentTile(i, null);
            continue;
          }

          this.tiles[x][y].setAdjacentTile(i, this.tiles[x + edgeAxis[i][0]][y + edgeAxis[i][1]]);
        }
      }
    }
  }

  private static setTilesBiome(tiles: Tile[], tileType: string, setChance: number) {
    for (const tile of tiles) {
      if (!tile || Math.random() > setChance) continue;
      this.setTileBiome({ tile: tile, tileType: tileType });
    }
  }

  private static setTileBiome(options: {
    tile: Tile;
    tileType: string;
    clearTileTypes?: boolean;
    insertIndex?: number;
  }) {
    const clearTileTypes = options.clearTileTypes ?? true; // By default this is true.

    let newTileType = undefined;
    if (options.tile.containsTileType("grass_hill")) {
      switch (options.tileType) {
        case "snow":
          newTileType = "snow_hill";
          break;
        case "tundra":
          newTileType = "tundra_hill";
          break;
        case "plains":
          newTileType = "plains_hill";
          break;
        case "desert":
          newTileType = "desert_hill";
          break;
        default:
          newTileType = options.tileType;
          break;
      }
    } else {
      newTileType = options.tileType;
    }

    if (clearTileTypes) {
      options.tile.clearTileTypes();
    }

    if (options.insertIndex !== undefined) {
      options.tile.addTileType(newTileType, options.insertIndex);
    } else {
      options.tile.addTileType(newTileType);
    }
  }

  //TODO: Implement min-tiles & max-tiles per path iteration ontop of setTileChance.
  private static generateTilePath(options: {
    tile: Tile;
    pathLength: number;
    setTileType: string;
    followTileTypes: string[];
    setTileChance: number;
    minTilesSet?: number;
    maxTilesSet?: number;
    overrideWater: boolean;
    setFollowTileTypeOnly?: boolean;
    clearExistingTileTypes?: boolean;
    insertIndex?: number;
    onAdditionalTileTypes?: boolean;
    avoidResourceTiles?: boolean;
  }) {
    const {
      setFollowTileTypeOnly = false,
      onAdditionalTileTypes = false,
      avoidResourceTiles = false,
      minTilesSet = 0,
      maxTilesSet = 99999,
    } = options;
    let tile = options.tile;
    let tilesSet = 0;
    const skippedValidGenerationTiles: Tile[] = []; // List of all possible tiles we "could have" set to our desired tiletype.

    for (let i = 0; i < options.pathLength; i++) {
      let generationTiles: Tile[] = [];
      let nextPathTile: Tile = undefined;
      //console.log("path loop");

      generationTiles.push(tile);
      generationTiles = generationTiles.concat(tile.getAdjacentTiles());

      const adjacentFollowTiles: Tile[] = [];
      for (const tile of generationTiles) {
        // If the tile doesn't exist, skip.
        if (!tile) continue;

        // If we reached our max set Tiles, skip
        if (tilesSet >= maxTilesSet) continue;

        // Skip if we don't want to override water
        if (tile.containsTileType("ocean") && !options.overrideWater) continue;

        // Skip if we don't spread to the tile types we follow
        if (!tile.containsTileTypes(options.followTileTypes) && setFollowTileTypeOnly) continue;

        // Skip if we end up in a tile w/ tileTypes > 1 and we want to avoid them
        if (!onAdditionalTileTypes && tile.getTileTypes().length > 1) continue;

        // Skip if we want to avoid resource tiles
        if (avoidResourceTiles && MapResources.isResourceTile(tile)) continue;

        if (Math.random() <= options.setTileChance) {
          this.setTileBiome({
            tile: tile,
            tileType: options.setTileType,
            clearTileTypes: options.clearExistingTileTypes,
            insertIndex: options.insertIndex,
          });

          tilesSet++;

          tile.setGenerationHeight(tile.getGenerationHeight() + 1); //FIXME: This really shouldn't be called anymore after generating all land tiles
        } else {
          skippedValidGenerationTiles.push(tile);
        }

        // Populate tiles w/ adj follow tile array
        for (const adjTile of tile.getAdjacentTiles()) {
          if (!adjTile) continue;

          if (adjTile.containsTileTypes(options.followTileTypes)) {
            adjacentFollowTiles.push(adjTile);
          }
        }
      }

      // Get the nextPathTile randomly, which has to be an adjacent follow tile
      nextPathTile = adjacentFollowTiles[random.int(0, adjacentFollowTiles.length)];

      // If we can't get get a tile adjacent to follow tile, the path ends.
      if (!nextPathTile) break;

      tile = nextPathTile; // Traverse onto the next tile.
    }

    // Ensure the minimum amount of tiles have been set.
    if (tilesSet < minTilesSet) {
      for (let i = tilesSet; i < minTilesSet; i++) {
        const rndTile =
          skippedValidGenerationTiles[random.int(0, skippedValidGenerationTiles.length - 1)];

        this.setTileBiome({
          tile: rndTile,
          tileType: options.setTileType,
          clearTileTypes: options.clearExistingTileTypes,
          insertIndex: options.insertIndex,
        });
        tilesSet++;
      }
    }
  }

  /**
   * This method iterates through tiles randomly until it finds a tile that meets the specified criteria.
   * If the method cannot find a suitable Tile object after 7500 iterations, it returns undefined.
   * @param options.tileTypes - The tiletypes of tiles that can be randomly picked.
   * @param options.tempRange - (Optional) A tuple of two numbers that specify the temperature range for the generated Tile object. If not provided, the default temperature range is [0, 100].
   * @param options.onAdditionalTileTypes - (Optional) A boolean value that indicates if we allow the random tile to contain more than 1 tile type. (E.g. a forest). Default value = FALSE
   * @param options.avoidResourceTiles - (Optional) A boolean value that indicates if we allow the random tile to be an existing resource tile(E.g. coal, horses, fish, ect.). Default value = FALSE
   * @returns A Tile object that meets the specified criteria, or undefined if no such Tile is found.
   */

  //FIXME: We really should use a tileMap to get tiles w/ the associated tileTypes in O(1) time.
  // Then we can apply the rest of the options in O(n)
  public static getRandomTileWith(options: {
    tileTypes: string[];
    tempRange?: [number, number];
    onAdditionalTileTypes?: boolean;
    avoidResourceTiles?: boolean;
  }): Tile | undefined {
    let originTile = undefined;
    let iterations = 0;

    const {
      tempRange = [0, 100],
      onAdditionalTileTypes = false,
      avoidResourceTiles = false,
    } = options;
    const minTemp = tempRange[0];
    const maxTemp = tempRange[1];
    const maxIterations = 10000;

    while (!originTile) {
      iterations++;

      const randomTile =
        this.tiles[random.int(0, this.mapWidth - 1)][random.int(0, this.mapHeight - 1)];

      // Ensure at least one tile type is in this randomTile.
      if (!randomTile.containsTileTypes(options.tileTypes)) continue;

      // Ensure we are within the provided temperature range
      if (randomTile.getGenerationTemp() < minTemp || randomTile.getGenerationTemp() > maxTemp)
        continue;

      // If we don't want additional tileTypes, check for that
      if (!onAdditionalTileTypes && randomTile.getTileTypes().length > 1) continue;

      // If we don't want to spawn on existing resource, natural wonder tiles, check for that
      if (avoidResourceTiles && MapResources.isResourceTile(randomTile)) continue;

      originTile = randomTile;

      if (iterations >= maxIterations) {
        console.log("Reached max iterations for random tile: " + options.tileTypes);
        break;
      }
    }

    return originTile;
  }

  public static removeTopRiverSideCache() {
    this.riverSideHistory.shift();
  }

  public static cacheSetRiverSides() {
    const riverSidesMap = new Map<Tile, number[]>();
    this.riverSideHistory.unshift(riverSidesMap);
    //console.log("Cache");
  }

  public static restoreCachedRiverSides() {
    //console.log("restore");
    //FIFO
    const riverSidesMap = this.riverSideHistory.shift();
    //console.log(riverSidesMap);
    for (const [effectedTile, riverSides] of riverSidesMap.entries()) {
      //effectedTile.setRiverSide(riverSide, false, false);

      /*if (effectedTile.containsTileType("snow")) {
        console.log("BEFORE:");
        console.log(
          "Tile: [" + effectedTile.getX() + "," + effectedTile.getY() + "]"
        );
        console.log(effectedTile.getRiverSideIndexes({ value: true }));
        console.log("Cached river sides: " + riverSides);
      }*/

      for (const riverSide of riverSides) {
        effectedTile.getRiverSides()[riverSide] = false; // Note, we don't use the this.setRiverSide() method as I don't want to effect other tiles
      }

      /*if (effectedTile.containsTileType("snow")) {
        console.log("AFTER:");
        console.log(effectedTile.getX() + "," + effectedTile.getY());
        console.log(effectedTile.getRiverSideIndexes({ value: true }));
      }*/
    }
  }

  public static storeSetRiverSideEntry(tilesEffected: Map<Tile, number>) {
    if (this.riverSideHistory.length < 1) return;

    const riverSidesMap = this.riverSideHistory[0];

    for (const [effectedTile, riverSide] of tilesEffected.entries()) {
      if (riverSidesMap.has(effectedTile)) {
        riverSidesMap.get(effectedTile).push(riverSide);
      } else {
        riverSidesMap.set(effectedTile, [riverSide]);
      }
    }
  }
}
