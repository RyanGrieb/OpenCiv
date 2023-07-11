import { Game } from "../Game";
import { Actor } from "../scene/Actor";
import { Vector } from "../util/Vector";
import { Tile } from "./Tile";

export interface ColoredTileOptions {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  transparency: number;
}

export class ColoredTile extends Actor {
  private lines: Vector[];

  constructor(options: ColoredTileOptions) {
    super({
      x: options.x,
      y: options.y,
      width: Tile.WIDTH,
      height: Tile.HEIGHT,
    });

    this.lines = [];
  }

  public draw(canvasContext: CanvasRenderingContext2D) {
    //Game.drawPolygon()
  }
}
