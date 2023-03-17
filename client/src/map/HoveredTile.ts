import { Tile } from "./Tile";

export class HoveredTile extends Tile {
  private representedTile: Tile;

  constructor(x: number, y: number) {
    super({
      x: x,
      y: y,
      tileTypes: ["hovered_tile"],
      width: 32,
      height: 32,
    });
  }

  public setRepresentedTile(representedTile: Tile) {
    this.representedTile = representedTile;

    if (!representedTile) {
      this.setPosition(9999, 9999);
      return;
    }

    this.setPosition(representedTile.getX(), representedTile.getY());
  }

  public getRepresentedTile() {
    return this.representedTile;
  }
}
