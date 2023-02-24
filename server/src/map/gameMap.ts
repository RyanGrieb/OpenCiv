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
  private static tiles: Tile[][];
  private static mapWidth: number;
  private static mapHeight: number;

  public static init() {
    const mapDimensions = this.getDimensionValues(MapSize.STANDARD);
    this.mapWidth = mapDimensions[0];
    this.mapHeight = mapDimensions[1];

    this.tiles = [];
    for (let x = 0; x < this.mapWidth; x++) {
      this.tiles[x] = [];
      for (let y = 0; y < this.mapHeight; y++) {
        this.tiles[x][y] = new Tile("ocean", x, y);
      }
    }

    this.tiles[20][20].setTileType("grass");
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
}
