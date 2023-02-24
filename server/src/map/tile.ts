export class Tile {
  private tileType: string;
  private x: number;
  private y: number;
  constructor(tileType: string, x: number, y: number) {
    this.tileType = tileType;
    this.x = x;
    this.y = y;
  }

  public getTileJSON() {
    return { tileType: this.tileType, x: this.x, y: this.y };
  }

  public setTileType(tileType: string) {
    this.tileType = tileType;
  }
}
