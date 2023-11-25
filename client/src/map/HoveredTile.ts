import { Game } from "../Game";
import { Tile } from "./Tile";

//FIXME: Replace with colored tile?
export class HoveredTile extends Tile {
  private representedTile: Tile;

  constructor(x: number, y: number) {
    super({
      x: x,
      y: y,
      z: 2,
      gridX: 0, //Grid values don't matter.
      gridY: 0,
      tileTypes: ["hovered_tile"],
      width: 32,
      height: 32,
      movementCost: 0
    });
  }

  public setRepresentedTile(representedTile: Tile) {
    this.representedTile = representedTile;

    if (!representedTile) {
      Game.getInstance().getCurrentScene().call("tileHovered", {
        tile: undefined
      });

      this.setPosition(9999, 9999);
      return;
    }

    Game.getInstance().getCurrentScene().call("tileHovered", {
      tile: representedTile
    });

    this.setPosition(representedTile.getX(), representedTile.getY());
  }

  public getRepresentedTile() {
    return this.representedTile;
  }
}
