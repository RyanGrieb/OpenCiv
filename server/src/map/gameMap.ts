import { Player } from "../player";
import { Tile } from "./tile";
import random from "random";

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

  public static init() {
    // Assign map dimension values
    const mapDimensions = this.getDimensionValues(MapSize.STANDARD);
    this.mapWidth = mapDimensions[0];
    this.mapHeight = mapDimensions[1];

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
     * 8. Then for wet and dry tiles, we assign another gradient, but this would be random blobs on the map.
     * 9. Then based on hot,cold,wet,and dry values, we assign the respective tiles:
      Hot and wet: Jungle (For jungle create a darker grassland tile)
      Hot and dry: Desert
      Cold and wet: Tundra
      Cold and dry: Snow
      Avg. Temp and wet: Grassland
      Avg. Temp and dry: Plains
     *  
     */

    // == Generate grass circles ==
    const LAND_MASS_PARAM = 5;
    const landMassSize = ((this.mapWidth * this.mapHeight) / 12.5) * (LAND_MASS_PARAM + 2);
    const maxPathLength = 140;

    while (this.getTotalGeographyLandMass() < landMassSize) {
      let rndX = random.int(10, this.mapWidth - 11);
      let rndY = random.int(10, this.mapHeight - 11);
      const currentPathLength = random.int(40, maxPathLength);

      // Draw a bunch of broken circles in a random direction until currentPathLength limit is reached.
      for (let i = 0; i < currentPathLength; i++) {
        let generationTiles: Tile[] = [];
        const selectedTile = this.tiles[rndX][rndY];
        let nextPathTile: Tile = undefined;

        generationTiles.push(selectedTile);
        generationTiles = generationTiles.concat(selectedTile.getAdjacentTiles());

        const adjacentOceanTiles: Tile[] = [];
        for (const tile of generationTiles) {
          if (!tile) continue;

          if (Math.random() > 0.5) {
            tile.setTileType("grass");
            tile.setGenerationHeight(tile.getGenerationHeight() + 1);
          }

          // Populate tiles w/ adj ocean array
          for (const adjTile of tile.getAdjacentTiles()) {
            if (!adjTile) continue;

            if (adjTile.containsTileType("ocean")) {
              adjacentOceanTiles.push(adjTile);
            }
          }
        }

        // Get the nextPathTile randomly, which has to be an adjacent ocean tile
        nextPathTile = adjacentOceanTiles[random.int(0, adjacentOceanTiles.length)];

        // If we can't get get a tile adjacent to ocean, the path ends.
        if (!nextPathTile) break;
        rndX = nextPathTile.getX();
        rndY = nextPathTile.getY();
      }
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
            tile.setTileType("grass");
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

    //Assign top 25% of tiles to have a 50% of becoming a hill tile
    const totalHills = tallestTiles.length * 0.1;
    for (let i = 0; i < totalHills; i++) {
      if (Math.random() < 0.5) tallestTiles[i].setTileType("grass_hill");
    }

    // TODO: Spawn hills in patches
    // For all other grass tiles, make it a 3% of becoming a hill tile.
    for (let i = 0; i < tallestTiles.length; i++) {
      if (Math.random() < 0.1) tallestTiles[i].setTileType("grass_hill");
    }

    //Assign the top 3% of tiles to be mountains
    const totalMountains = tallestTiles.length * 0.03;
    for (let i = 0; i < totalMountains; i++) {
      tallestTiles[i].setTileType("mountain");
    }
    // == Generate hills & mountains
  }

  public static getDimensionValues(mapSize: MapSize) {
    const values = [
      parseInt(mapSize.substring(0, mapSize.indexOf("x"))),
      parseInt(mapSize.substring(mapSize.indexOf("x") + 1)),
    ];
    return values;
  }
  public static sendMapChunksToPlayer(player: Player) {
    player.sendNetworkEvent({ event: "mapSize", width: this.mapWidth, height: this.mapHeight });

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
        player.sendNetworkEvent({ event: "mapChunk", tiles: chunkTiles, lastChunk: lastChunk });
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
}
