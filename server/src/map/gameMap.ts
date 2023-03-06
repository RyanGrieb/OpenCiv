import { Player } from "../player";
import { Tile } from "./tile";

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

    // Current debug code:
    this.tiles[20][20].setTileType("grass");

    for (let tile of this.tiles[20][20].getAdjacentTiles()) {
      tile.setTileType("grass");
    }
  }

  public static generateTerrain() {
    //TODO: Lets re-do our generation code with something better.
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
          //stencilMap[x][y].setEdge(i, stencilMap[x + edgeAxis[i][0]][y + edgeAxis[i][1]]);
          //geographyMap[x][y].setEdge(i, geographyMap[x + edgeAxis[i][0]][y + edgeAxis[i][1]]);
        }
      }
    }
  }
}
