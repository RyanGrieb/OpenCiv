import { Game } from "../Game";
import { Player } from "../Player";
import { Tile } from "./Tile";
import random from "random";
import { MapResources } from "./MapResources";
import { TileIndexer } from "./TileIndexer";
import { Unit } from "../unit/Unit";
import PriorityQueue from "ts-priority-queue";
import { Numbers } from "../util/Numbers";
import { MAP_CHUNK_SIZE, MIN_MAP_DIMENSION } from "../GameOptions";

export class GameMap {
  private static instance: GameMap;

  private static oddEdgeAxis = [
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 0]
  ];
  private static evenEdgeAxis = [
    [-1, -1],
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 1],
    [-1, 0]
  ];

  // Static so Tile can reach the helpers below without a live map (the tests mock getInstance()).
  private static horizontalWrap = false;
  private static wrapWidth = 0;

  // How far a sightline is shifted off dead centre to resolve which side of a tile seam it runs
  // along - see hasLineOfSight(). Small enough never to reach past the tile it starts in.
  private static readonly SIGHTLINE_NUDGE = 1e-6;

  private tiles: Tile[][];
  private mapWidth: number;
  private mapHeight: number;
  private mapArea: number;
  public riverSideHistory: Map<Tile, number[]>[];

  public static getInstance() {
    return this.instance;
  }

  public static wrapsHorizontally() {
    return GameMap.horizontalWrap;
  }

  // Brings an x coordinate back inside the map; returns it untouched when wrapping is off.
  public static wrapX(x: number) {
    if (!GameMap.horizontalWrap) return x;

    return ((x % GameMap.wrapWidth) + GameMap.wrapWidth) % GameMap.wrapWidth;
  }

  // Signed x distance, the shorter way round; otherwise tiles either side of the seam read as a map apart.
  public static shortestXDistance(x1: number, x2: number) {
    const delta = x2 - x1;
    if (!GameMap.horizontalWrap) return delta;

    return delta - Math.round(delta / GameMap.wrapWidth) * GameMap.wrapWidth;
  }

  /**
   * Initializes the GameMap singleton object, starts a map request to the server.
   */
  public static init() {
    GameMap.instance = new GameMap();
    GameMap.instance.startGeneration(); // We don't call from inside constructor to reference instance on creation.
  }

  public static destroyInstance() {
    GameMap.instance = undefined;
    GameMap.horizontalWrap = false;
    GameMap.wrapWidth = 0;
  }

  private static snapToChunks(requested: number) {
    return Math.max(MIN_MAP_DIMENSION, Math.round(requested / MAP_CHUNK_SIZE) * MAP_CHUNK_SIZE);
  }

  private constructor() {}

  private startGeneration() {
    // Assign map dimension values
    const options = Game.getInstance().getGameOptions();
    this.mapWidth = GameMap.snapToChunks(options.mapWidth);
    this.mapHeight = GameMap.snapToChunks(options.mapHeight);
    this.mapArea = this.mapWidth * this.mapHeight;
    this.riverSideHistory = [];

    GameMap.horizontalWrap = options.wrapMap;
    GameMap.wrapWidth = this.mapWidth;

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

  public getTiles() {
    return this.tiles;
  }

  /**
   * Every tile within `range` steps of the given tile, the origin included. Walks adjacency rather
   * than comparing coordinates, so the map edges and east-west wrapping are handled by the same
   * links the rest of the game paths over - see PlayerVisibility.
   */
  public getTilesInRange(tile: Tile, range: number): Tile[] {
    const tilesInRange = new Set<Tile>([tile]);
    let frontier = [tile];

    for (let step = 0; step < range; step++) {
      const nextFrontier: Tile[] = [];

      for (const frontierTile of frontier) {
        for (const adjTile of frontierTile.getAdjacentTiles()) {
          if (!adjTile || tilesInRange.has(adjTile)) continue;

          tilesInRange.add(adjTile);
          nextFrontier.push(adjTile);
        }
      }

      frontier = nextFrontier;
    }

    return Array.from(tilesInRange);
  }

  /**
   * Whether `from` has an unobstructed line of sight to `to`. A tile is always visible to anything
   * directly touching it; past that, terrain blocks the view whenever it stands higher than the
   * ground the viewer is on - so a hill hides what's behind it from the flats, but not from
   * another hill, and a mountain hides it from both. Woods count a step taller than the ground
   * they grow on (see Tile.getSightElevation() / getSightBlockingHeight()).
   *
   * Sight is traced as a straight hex line via cube-coordinate interpolation. Where that line runs
   * along the seam between two tiles - which is every step of an even-length diagonal - both of
   * those tiles are candidates, and sight is only blocked when BOTH obstruct. That's what lets you
   * see diagonally past a lone mountain instead of it hiding a whole wedge of the map behind it.
   */
  public hasLineOfSight(from: Tile, to: Tile): boolean {
    if (from === to) return true;

    // Unwrap `to`'s x toward `from` first, so a sightline across the map seam interpolates
    // through real space instead of the long way around.
    const toX = from.getX() + GameMap.shortestXDistance(from.getX(), to.getX());

    const a = GameMap.toCube(from.getX(), from.getY());
    const b = GameMap.toCube(toX, to.getY());

    const distance = Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z));
    if (distance <= 1) return true;

    const viewerElevation = from.getSightElevation();

    for (let step = 1; step < distance; step++) {
      const t = step / distance;
      const candidates = [GameMap.SIGHTLINE_NUDGE, -GameMap.SIGHTLINE_NUDGE].map((nudge) =>
        this.tileAlongSightline(a, b, t, nudge)
      );

      // A candidate that's off the map isn't an obstruction, so it can't be what blocks the view.
      if (candidates.every((tile) => tile && tile.getSightBlockingHeight() > viewerElevation)) {
        return false;
      }
    }

    return true;
  }

  // One step along the sightline, nudged off the exact centre so a line running down the seam
  // between two tiles resolves to one side of it. Opposite nudges give the pair of tiles the
  // sightline threads between; where it passes squarely through a tile, both agree on it.
  private tileAlongSightline(
    a: { x: number; y: number; z: number },
    b: { x: number; y: number; z: number },
    t: number,
    nudge: number
  ): Tile {
    const rounded = GameMap.cubeRound({
      x: a.x + (b.x - a.x) * t + nudge,
      y: a.y + (b.y - a.y) * t + nudge,
      z: a.z + (b.z - a.z) * t - 2 * nudge
    });

    const [gridX, gridY] = GameMap.cubeToGrid(rounded);
    return this.tiles[GameMap.wrapX(gridX)]?.[gridY];
  }

  // Offset (odd-r: odd rows shoved right, matching oddEdgeAxis/evenEdgeAxis above) grid
  // coordinates to cube coordinates, and back - see https://www.redblobgames.com/grids/hexagons/.
  // Cube coordinates are what make a straight hex "line" (hasLineOfSight above) a simple lerp.
  public static toCube(gridX: number, gridY: number): { x: number; y: number; z: number } {
    const x = gridX - (gridY - (gridY & 1)) / 2;
    const z = gridY;
    return { x, y: -x - z, z };
  }

  public static cubeToGrid(cube: { x: number; y: number; z: number }): [number, number] {
    const gridY = cube.z;
    return [cube.x + (gridY - (gridY & 1)) / 2, gridY];
  }

  // Rounds a fractional (lerped) cube coordinate to its containing hex, correcting whichever axis
  // drifted furthest from an integer so x+y+z stays exactly 0.
  private static cubeRound(cube: { x: number; y: number; z: number }) {
    let rx = Math.round(cube.x);
    let ry = Math.round(cube.y);
    let rz = Math.round(cube.z);

    const xDiff = Math.abs(rx - cube.x);
    const yDiff = Math.abs(ry - cube.y);
    const zDiff = Math.abs(rz - cube.z);

    if (xDiff > yDiff && xDiff > zDiff) {
      rx = -ry - rz;
    } else if (yDiff > zDiff) {
      ry = -rx - rz;
    } else {
      rz = -rx - ry;
    }

    return { x: rx, y: ry, z: rz };
  }

  public generateTerrain() {
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
        overrideWater: true
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
          if (tallestTiles[mid].getGenerationHeight() > currentTile.getGenerationHeight()) low = mid + 1;
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
      if (Numbers.safeRandom() < 0.5) tallestTiles[i].replaceTileType("grass", "grass_hill");
    }

    // TODO: Spawn hills in patches?
    // For all other grass tiles, make it a 13% of becoming a hill tile.
    for (let i = 0; i < tallestTiles.length; i++) {
      if (Numbers.safeRandom() < 0.13) tallestTiles[i].replaceTileType("grass", "grass_hill");
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
          if (Numbers.safeRandom() > 0.25) {
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
        tempRange: [60, 80]
      });
      if (!originTile) continue;
      this.generateTilePath({
        tile: originTile,
        pathLength: 15,
        setTileType: "plains",
        followTileTypes: ["grass"],
        setTileChance: 0.95,
        overrideWater: false
      });
    }
    console.log("Done generating plains biomes!");

    // For desert, pick origin tile w/ temp b/w 95,100 & create a small path
    const numberOfDesertBiomes = Math.ceil(this.mapArea * 0.000721154); // 3 for a standard map...
    console.log("Generating desert biomes... - " + numberOfDesertBiomes);
    for (let i = 0; i < numberOfDesertBiomes; i++) {
      const originTile = this.getRandomTileWith({
        tileTypes: ["grass"],
        tempRange: [95, 100]
      });
      if (!originTile) continue;
      // Now we have random origin, create path
      this.generateTilePath({
        tile: originTile,
        pathLength: 15,
        setTileType: "desert",
        followTileTypes: ["grass", "grass_hill"],
        setTileChance: 0.95,
        overrideWater: false
      });
    }
    console.log("Done generating desert biomes!");

    // For Jungle, pick temp b/w 60, 80 & wetness (todo: figure that out..)
    const numberOfJungleBiomes = Math.ceil(this.mapArea * 0.000721154); // 3 for a standard map...
    console.log("Generating jungle biomes... - " + numberOfJungleBiomes);
    for (let i = 0; i < numberOfJungleBiomes; i++) {
      const originTile = this.getRandomTileWith({
        tileTypes: ["grass"],
        tempRange: [60, 75]
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
        clearExistingTileTypes: false
      });
    }
    console.log("Done generating jungle tiles!");

    // FIXME: getRandomTileWith ["grass"] includes tiles w/ jungle already on top. Think of way to specify that we don't want this.

    const numberOfForestBiomes = Math.ceil(this.mapArea * 0.024038462); // 50 for a standard map...
    console.log("Generating forest biomes... - " + numberOfForestBiomes);
    for (let i = 0; i < numberOfForestBiomes; i++) {
      const originTile = this.getRandomTileWith({
        tileTypes: ["grass"],
        tempRange: [32, 90]
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
        clearExistingTileTypes: false
      });
    }
    console.log("Done generating forest tiles!");

    // == Generate freshwater tiles.
    console.log("Generating freshwater tiles...");

    for (const tile of [...TileIndexer.getTilesByTileType("ocean")]) {
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
    console.log("Done generating freshwater tiles!");
    // == Generate freshwater tiles

    // == Generate shallow ocean tiles
    console.log("Generating shallow ocean tiles...");
    for (const tile of [...TileIndexer.getTilesByTileType("ocean")]) {
      //tile.addTileType("debug2");
      for (const adjTile of tile.getAdjacentTiles()) {
        if (!adjTile) continue;
        if (!adjTile.containsTileTypes(["ocean", "shallow_ocean"])) {
          tile.replaceTileType("ocean", "shallow_ocean");
        }
      }
    }

    for (const tile of [...TileIndexer.getTilesByTileType("ocean")]) {
      for (const adjTile of tile.getAdjacentTiles()) {
        if (!adjTile) continue;
        if (adjTile.containsTileType("shallow_ocean") && Numbers.safeRandom() > 0.75) {
          tile.replaceTileType("ocean", "shallow_ocean");
        }
      }
    }

    console.log("Done generating shallow ocean tiles!");
    // == Generate shallow ocean tiles

    // == Generate strategic, bonus and luxury resources
    console.log("Generating resources...");
    const numberOfResources = Math.ceil(this.mapArea * 0.04); // 75 for tiny map..
    for (let i = 0; i < numberOfResources * 3; i++) {
      let mapResourceType = "N/A";
      if (i < numberOfResources) {
        mapResourceType = "bonus";
      } else if (i > numberOfResources && i < numberOfResources * 1.5) {
        mapResourceType = "strategic";
      } else {
        mapResourceType = "luxury";
      }
      const mapResource = MapResources.getRandomMapResource({
        mapResourceType: mapResourceType
      });

      const originTile = this.getRandomTileWith({
        tileTypes: mapResource.getSpawnTiles(),
        onAdditionalTileTypes: mapResource.spawnOnAdditionalTileTypes(),
        avoidResourceTiles: true,
        tempRange: [mapResource.getMinTemp(), mapResource.getMaxTemp()]
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
        avoidResourceTiles: true
      });
    }
    console.log("Done generating resources!");
    // == Generate strategic, bonus and luxury resources

    // == Generate rivers
    console.log("Generating rivers...");
    //const riverAmount = 25; //FIXME: The higher number the higher chance of infinite loop.
    const riverAmount = this.mapArea * 0.015;
    rivenGenLoop: for (let riverIndex = 0; riverIndex < riverAmount; riverIndex++) {
      //console.log("riverGenLoop");
      let originTile: Tile = undefined;
      findRiverOriginLoop: while (!originTile) {
        originTile = this.getRandomTileWith({
          tileTypes: ["grass_hill", "plains_hill", "desert_hill", "tundra_hill", "snow_hill", "mountain"]
        });

        // If we couldn't find a random tile, just give up.
        if (!originTile) continue;

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
        const nextTileCandidates: Tile[] = this.getNextPotentialRiverTiles(currentTile, lastTraversedTile, originTile);

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
        if (currentTile.isWater()) break riverPathLoop;

        if (riverLength >= 50) break riverPathLoop;
      }

      for (let i = 0; i < currentRiverTiles.length; i++) {
        const tile = currentRiverTiles[i];
        tile.removeTileType("river_candidate");
      }

      //FIXME: This causes infinite loop on smaller maps...
      if (currentRiverTiles.length < 10) {
        riverIndex--;
        continue;
      }

      this.cacheSetRiverSides();
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
        /*console.log(
          "Generating river for tile: [" +
            tile.getX() +
            "," +
            tile.getY() +
            "] on river index: " +
            riverIndex
        );*/
        tile.applyRiverSide({
          originTile: i == 0,
          previousTile: prevTile,
          nextTile: nextTile
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
        /*console.log(
          "Failed to generate tile, starting at: " +
            currentRiverTiles[0].getX() +
            "," +
            currentRiverTiles[0].getY() +
            " - " +
            tooManyRiverSides +
            " || " +
            appliedRiverSides
        );*/
        //console.log(tooManyRiverSides + "," + tooManyRiverSides);

        for (let i = 0; i < currentRiverTiles.length; i++) {
          const tile = currentRiverTiles[i];
          tile.removeTileType("debug3");
          tile.removeTileType("debug2");
        }
      }

      if (tooManyRiverSides || appliedRiverSides < 3) {
        riverIndex--;
        //console.log("Oh no!");
        //currentRiverTiles[0].addTileType("debug1");
        this.restoreCachedRiverSides(); //FIXME: This fails to delete river-sides adj to border sometimes
      }
      this.removeTopRiverSideCache();
    }
    console.log("Done generating rivers!");
    // == Generate rivers

    // == Apply floodplains for desert tiles w/ river tiles.
    console.log("Generating floodplains...");
    const desertTiles = TileIndexer.getTilesByTileType("desert");
    for (const tile of desertTiles) {
      if (tile.hasRiver()) {
        tile.replaceTileType("desert", "floodplains");
      }
    }

    // == Apply floodplains for desert tiles w/ river tiles
    console.log("Done generating floodplains!");
  }

  public getNextPotentialRiverTiles(currentTile: Tile, lastTraversedTile: Tile, originTile: Tile) {
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
        if (originTile.getDistanceFrom(adjacentCandidateTile) <= originTile.getDistanceFrom(lastTraversedTile)) {
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

  public getDimensionValues(mapSize: string) {
    const values = [
      parseInt(mapSize.substring(0, mapSize.indexOf("x"))),
      parseInt(mapSize.substring(mapSize.indexOf("x") + 1))
    ];
    return values;
  }

  public sendTileYieldsToPlayer(player: Player) {
    // Send the full tile stats JSON from tiles.yml
    player.sendNetworkEvent({
      event: "tileYields",
      yields: Tile.getAllTileStats()
    });
  }

  // Sends a tile's current JSON (yields included) to every player who can currently see it. Clients
  // only get a tile's contents when it's sent to them, so anything that changes what a tile
  // produces (settling a city, improving a resource, building a farm/mine, etc.) must call this or
  // the client keeps showing stale numbers on hover - see Tile.setCity() for the current caller.
  //
  // Players who have discovered the tile but can't see it right now are deliberately skipped: their
  // client keeps whatever it last saw, and catches up when the tile comes back into sight.
  public broadcastTileUpdate(tile: Tile) {
    Game.getInstance()
      .getPlayers()
      .forEach((player) => {
        if (!player.getVisibility().isVisible(tile)) return;

        player.sendNetworkEvent({
          event: "tileUpdated",
          tile: tile.getTileJSON({ visible: true })
        });
      });
  }

  /**
   * Sends the player everything they've discovered so far, chunk by chunk, followed by a
   * "mapSyncComplete" marker. Chunks the player has seen nothing of are skipped entirely, and a
   * partially-explored chunk only carries its discovered tiles - the client fills the rest in as
   * they're revealed.
   */
  public sendMapChunksToPlayer(player: Player) {
    // Send the map-size to player
    player.sendNetworkEvent({
      event: "mapSize",
      width: this.mapWidth,
      height: this.mapHeight,
      wrap: GameMap.wrapsHorizontally()
    });

    //Send tile stats to player
    player.sendNetworkEvent({
      event: "tileStats",
      tiles: Tile.getAllTileStats()
    });

    const visibility = player.getVisibility();

    for (let x = 0; x < this.mapWidth; x += MAP_CHUNK_SIZE) {
      for (let y = 0; y < this.mapHeight; y += MAP_CHUNK_SIZE) {
        const chunkTiles: Tile[] = [];

        for (let chunkX = 0; chunkX < MAP_CHUNK_SIZE; chunkX++) {
          for (let chunkY = 0; chunkY < MAP_CHUNK_SIZE; chunkY++) {
            const tile = this.tiles[x + chunkX][y + chunkY];

            if (visibility.hasDiscovered(tile)) {
              chunkTiles.push(tile);
            }
          }
        }

        if (chunkTiles.length < 1) continue;

        this.sendTileChunk(player, x, y, chunkTiles);
      }
    }

    // Its own event rather than a flag on the last chunk: a player can start a game with too few
    // discovered tiles to fill a chunk, and the client still has to know the sync finished.
    player.sendNetworkEvent({ event: "mapSyncComplete" });
  }

  /**
   * Pushes specific tiles to a player mid-game, grouped into the same chunk packets the initial
   * sync uses. This is how newly-discovered terrain (and anything standing on it) reaches a client
   * once their units move - see PlayerVisibility.update().
   */
  public sendTilesToPlayer(player: Player, tiles: Tile[]) {
    const tilesByChunk = new Map<string, Tile[]>();

    for (const tile of tiles) {
      const chunkX = Math.floor(tile.getX() / MAP_CHUNK_SIZE) * MAP_CHUNK_SIZE;
      const chunkY = Math.floor(tile.getY() / MAP_CHUNK_SIZE) * MAP_CHUNK_SIZE;
      const key = `${chunkX},${chunkY}`;

      if (!tilesByChunk.has(key)) {
        tilesByChunk.set(key, []);
      }

      tilesByChunk.get(key).push(tile);
    }

    for (const [key, chunkTiles] of tilesByChunk.entries()) {
      const [chunkX, chunkY] = key.split(",").map((value) => parseInt(value));

      this.sendTileChunk(player, chunkX, chunkY, chunkTiles);
    }
  }

  private sendTileChunk(player: Player, chunkX: number, chunkY: number, tiles: Tile[]) {
    const visibility = player.getVisibility();

    player.sendNetworkEvent({
      event: "mapChunk",
      chunkX: chunkX,
      chunkY: chunkY,
      tiles: tiles.map((tile) =>
        tile.getTileJSON({
          visible: visibility.isVisible(tile),
          observer: player
        })
      )
    });
  }

  private getTotalGeographyLandMass() {
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
  private initAdjacentTiles() {
    for (let x = 0; x < this.mapWidth; x++) {
      for (let y = 0; y < this.mapHeight; y++) {
        // Set the 6 edges of the hexagon.

        let edgeAxis: number[][];
        if (y % 2 == 0) edgeAxis = GameMap.evenEdgeAxis;
        else edgeAxis = GameMap.oddEdgeAxis;

        for (let i = 0; i < edgeAxis.length; i++) {
          // Only x wraps - the north and south edges stay the poles.
          let edgeX = GameMap.wrapX(x + edgeAxis[i][0]);
          let edgeY = y + edgeAxis[i][1];

          if (edgeX == -1 || edgeY == -1 || edgeX > this.mapWidth - 1 || edgeY > this.mapHeight - 1) {
            this.tiles[x][y].setAdjacentTile(i, null);
            continue;
          }

          this.tiles[x][y].setAdjacentTile(i, this.tiles[edgeX][edgeY]);
        }
      }
    }
  }

  private setTilesBiome(tiles: Tile[], tileType: string, setChance: number) {
    for (const tile of tiles) {
      if (!tile || Numbers.safeRandom() > setChance) continue;
      this.setTileBiome({ tile: tile, tileType: tileType });
    }
  }

  private setTileBiome(options: { tile: Tile; tileType: string; clearTileTypes?: boolean; insertIndex?: number }) {
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
  private generateTilePath(options: {
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
      maxTilesSet = 99999
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

        if (Numbers.safeRandom() <= options.setTileChance) {
          this.setTileBiome({
            tile: tile,
            tileType: options.setTileType,
            clearTileTypes: options.clearExistingTileTypes,
            insertIndex: options.insertIndex
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
        const rndTile = skippedValidGenerationTiles[random.int(0, skippedValidGenerationTiles.length - 1)];

        this.setTileBiome({
          tile: rndTile,
          tileType: options.setTileType,
          clearTileTypes: options.clearExistingTileTypes,
          insertIndex: options.insertIndex
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
   * @param options.avoidMapEdge - (Optional) Rejects tiles within this many tiles of the map border.
   * @returns A Tile object that meets the specified criteria, or undefined if no such Tile is found.
   */

  //FIXME: We really should use a tileMap to get tiles w/ the associated tileTypes in O(1) time.
  // Then we can apply the rest of the options in O(n)
  public getRandomTileWith(options: {
    tileTypes?: string[];
    tempRange?: [number, number];
    onAdditionalTileTypes?: boolean;
    avoidResourceTiles?: boolean;
    avoidTileTypes?: string[];
    avoidMapEdge?: number;
  }): Tile | undefined {
    let originTile = undefined;
    let iterations = 0;

    const { tempRange = [0, 100], onAdditionalTileTypes = false, avoidResourceTiles = false } = options;
    const minTemp = tempRange[0];
    const maxTemp = tempRange[1];
    const maxIterations = 100;

    while (!originTile) {
      iterations++;

      if (iterations >= maxIterations) {
        console.log("Reached max iterations for random tile: " + options.tileTypes);
        break;
      }

      const randomTile = this.tiles[random.int(0, this.mapWidth - 1)][random.int(0, this.mapHeight - 1)];

      // Ensure we are avoiding any tile types we don't want
      if (options.avoidTileTypes && randomTile.containsTileTypes(options.avoidTileTypes)) continue;

      // Ensure we are avoiding the map border, if requested
      if (options.avoidMapEdge !== undefined && this.isTileNearMapEdge(randomTile, options.avoidMapEdge)) continue;

      // Ensure at least one tile type is in this randomTile.
      if (options.tileTypes && !randomTile.containsTileTypes(options.tileTypes)) continue;

      // Ensure we are within the provided temperature range
      if (randomTile.getGenerationTemp() < minTemp || randomTile.getGenerationTemp() > maxTemp) continue;

      // If we don't want additional tileTypes, check for that
      if (!onAdditionalTileTypes && randomTile.getTileTypes().length > 1) continue;

      // If we don't want to spawn on existing resource, natural wonder tiles, check for that
      if (avoidResourceTiles && MapResources.isResourceTile(randomTile)) continue;

      originTile = randomTile;
    }

    return originTile;
  }

  private isTileNearMapEdge(tile: Tile, buffer: number): boolean {
    const x = tile.getX();
    const y = tile.getY();

    return x < buffer || y < buffer || x >= this.mapWidth - buffer || y >= this.mapHeight - buffer;
  }

  public removeTopRiverSideCache() {
    this.riverSideHistory.shift();
  }

  public cacheSetRiverSides() {
    const riverSidesMap = new Map<Tile, number[]>();
    this.riverSideHistory.unshift(riverSidesMap);
    //console.log("Cache");
  }

  public restoreCachedRiverSides() {
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

  public storeSetRiverSideEntry(tilesEffected: Map<Tile, number>) {
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

  // https://en.wikipedia.org/wiki/A*_search_algorithm
  public constructShortestPath(unit: Unit, startTile: Tile, goalTile: Tile) {
    if (!startTile || !goalTile) return [];

    // The unit could walk up to an occupied goal but never end its move on it.
    if (goalTile !== startTile && goalTile.isBlockedFor(unit)) return [];

    //TODO: Maybe we get the distance of the last path & apply it to h? Since it's just going to be a single tile off from the previous.
    let h = (n: Tile) => Math.floor(Tile.gridDistance(n, goalTile));

    // For node n, gScore[n] is the cost of the cheapest path from start to n currently known.
    let gScore: number[][] = [];
    let fScore: number[][] = [];
    let cameFrom: Tile[][] = [];

    for (let x = 0; x < this.mapWidth; x++) {
      gScore[x] = [];
      fScore[x] = [];
      cameFrom[x] = [];
      for (let y = 0; y < this.mapHeight; y++) {
        gScore[x][y] = Number.MAX_VALUE;
        fScore[x][y] = 0;
      }
    }

    gScore[startTile.getX()][startTile.getY()] = 0;
    // For node n, fScore[n] := gScore[n] + h(n). fScore[n] represents our current best guess as to
    // how cheap a path could be from start to finish if it goes through n.
    fScore[startTile.getX()][startTile.getY()] = h(startTile);

    // Openset is a pirority queue of tiles w/ the lowerest fscore
    // fscore[myTile.getNodeIndex()]
    let openSet = new PriorityQueue({
      comparator: (a: Tile, b: Tile) => {
        const fscoreA = fScore[a.getX()][a.getY()];
        const fscoreB = fScore[b.getX()][b.getY()];

        if (fscoreA < fscoreB) {
          return -1; // a should have higher priority (lower fscore)
        } else if (fscoreA > fscoreB) {
          return 1; // b should have higher priority (lower fscore)
        } else {
          return 0; // fscoreA and fscoreB are equal
        }
      },
      initialValues: [startTile]
    });

    //cameFrom.fill(undefined, 0, totalNodes);

    while (openSet.length > 0) {
      let currentTile = openSet.dequeue();

      if (currentTile == goalTile) {
        return this.reconstructPath(unit, cameFrom, currentTile);
      }

      for (let neighborTile of currentTile.getAdjacentTiles()) {
        if (!neighborTile) continue;

        let d = (current: Tile, neighbor: Tile) => unit.getTileWeight(current, neighbor);

        let tentativeGScore = gScore[currentTile.getX()][currentTile.getY()] + d(currentTile, neighborTile);
        //console.log(neighborTile.getNodeIndex());
        //console.log(gScore[neighborTile.getNodeIndex()]);

        if (tentativeGScore < gScore[neighborTile.getX()][neighborTile.getY()]) {
          cameFrom[neighborTile.getX()][neighborTile.getY()] = currentTile;
          gScore[neighborTile.getX()][neighborTile.getY()] = tentativeGScore;
          fScore[neighborTile.getX()][neighborTile.getY()] = tentativeGScore + h(neighborTile);

          //if (!QueueUtils.valuePresent(openSet, neighborTile)) {
          openSet.queue(neighborTile);
          //}
        }
      }
    }

    return [];
  }

  public getTileWithHighestYeild(options: { stats: string[]; tiles: Tile[]; ignoreTiles: Tile[] }) {
    let highestTile: Tile = undefined;
    let highestValue = 0;

    for (const tile of options.tiles) {
      if (options.ignoreTiles.includes(tile)) continue;
      if (!tile.isWorkable()) continue;

      let value = tile.getTotalStatValue(options.stats);

      if (value > highestValue || highestTile === undefined) {
        highestValue = value;
        highestTile = tile;
      }
    }

    return highestTile;
  }

  private reconstructPath(unit: Unit, cameFrom: Tile[][], currentTile: Tile) {
    const totalPath = [currentTile];
    let movementCost = 0;

    movementCost += unit.getTileWeight(currentTile, undefined);

    while (currentTile != undefined) {
      currentTile = cameFrom[currentTile.getX()][currentTile.getY()];
      if (currentTile) {
        totalPath.unshift(currentTile);

        movementCost += unit.getTileWeight(currentTile, undefined);
      }
    }

    //FIXME: This may break pathing on large maps
    if (movementCost >= 9999) {
      return [];
    }

    return totalPath;
  }
}
