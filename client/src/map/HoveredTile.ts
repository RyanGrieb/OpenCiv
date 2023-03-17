import { Game } from "../Game";
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
      Game.getCurrentScene().call("tileHovered", {
        tile: undefined,
      });

      this.setPosition(9999, 9999);
      return;
    }

    Game.getCurrentScene().call("tileHovered", {
      tile: representedTile,
    });

    this.setPosition(representedTile.getX(), representedTile.getY());
  }

  public getRepresentedTile() {
    return this.representedTile;
  }
}
