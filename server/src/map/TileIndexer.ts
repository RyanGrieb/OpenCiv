import { Tile } from "./Tile";

export class TileIndexer {
  private static tileIndex = new Map<string, Tile[]>();

  public static addTileType(tileType: string, tile: Tile) {
    if (!this.tileIndex.has(tileType)) {
      this.tileIndex.set(tileType, [tile]);
      return;
    }

    this.tileIndex.get(tileType).push(tile);
  }

  public static removeTileType(tileType: string, tile: Tile) {
    const tiles = this.tileIndex.get(tileType);
    if (!tiles) return;

    const indexTile = tiles[tiles.indexOf(tile)];

    if (!indexTile) return;

    if (tile.getX() != indexTile.getX() || tile.getY() != indexTile.getY()) {
      console.log("Mismatch");
      throw new Error();
    }

    tiles.splice(tiles.indexOf(tile), 1);
  }

  public static clearTileTypes(tile: Tile) {
    for (const [tileType, tiles] of this.tileIndex.entries()) {
      if (tiles.includes(tile)) {
        this.removeTileType(tileType, tile);
      }
    }
  }

  public static getTilesByTileType(tileType: string): Tile[] {
    if (!this.tileIndex.has(tileType)) {
      console.log("WARNING: Couldn't find any tiles w/ tile-type: " + tileType);
      return [];
    }
    return this.tileIndex.get(tileType);
  }
}
