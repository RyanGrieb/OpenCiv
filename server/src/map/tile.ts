export class Tile {
  //== Generation Values ==
  private generationHeight: number;
  //== Generation Values ==
  private tileType: string;
  private adjacentTiles: Tile[];

  private x: number;
  private y: number;

  constructor(tileType: string, x: number, y: number) {
    this.generationHeight = 0;

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

  public containsTileType(tileType: String) {
    //FIXME: Tile tiles should be in an array.
    return this.tileType === tileType;
  }

  public getAdjacentTiles() {
    return this.adjacentTiles;
  }

  public setGenerationHeight(generationHeight: number) {
    this.generationHeight = generationHeight;
  }

  public getGenerationHeight() {
    return this.generationHeight;
  }

  public getX() {
    return this.x;
  }

  public getY() {
    return this.y;
  }
}
