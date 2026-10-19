import { Game } from "../Game";
import { Marking } from "../scene/Marking";
import { Tile } from "./Tile";

//FIXME: Replace with colored tile?
export class HoveredTile extends Tile {
  private representedTile: Tile;
  private hidden: boolean = false;

  constructor(x: number, y: number) {
    super({
      x: x,
      y: y,
      z: 1.6,
      gridX: 0, //Grid values don't matter.
      gridY: 0,
      tileTypes: ["hovered"],
      width: 32,
      height: 32,
      movementCost: 0
    });
    Marking.mark(this);
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

  public draw(canvasContext: CanvasRenderingContext2D) {
    if (this.hidden) {
      return;
    }

    super.draw(canvasContext);
  }

  public getDrawState() {
    return this.hidden ? 1 : 0;
  }

  public setHidden(hidden: boolean) {
    this.hidden = hidden;
  }

  public getRepresentedTile() {
    return this.representedTile;
  }
}
