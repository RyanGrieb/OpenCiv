export class Tile {
  private tileType: string;
  private adjacentTiles: Tile[];

  private x: number;
  private y: number;

  constructor(tileType: string, x: number, y: number) {
    this.tileType = tileType;
    this.adjacentTiles = [];

    this.x = x;
    this.y = y;
  }

  public getTileJSON() {
    return { tileType: this.tileType, x: this.x, y: this.y };
  }

  public setTileType(tileType: string) {
    this.tileType = tileType;
  }

  public setAdjacentTile(index: number, tile: Tile) {
    this.adjacentTiles[index] = tile;
  }

  public getAdjacentTiles() {
    return this.adjacentTiles;
  }
}
