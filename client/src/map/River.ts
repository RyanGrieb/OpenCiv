import { GameImage, SpriteRegion } from "../Assets";
import { Game } from "../Game";
import { Actor } from "../scene/Actor";
import { Tile } from "./Tile";

export interface RiverOptions {
  tile: Tile;
  side: number;
}

export class River extends Actor {
  private tile: Tile;

  constructor(options: RiverOptions) {
    let side = options.side;
    let otherVectorSide = side - 1;

    // Since we draw backwards to the other sides, the otherSide for 0 would be 5...
    if (side == 0) {
      otherVectorSide = 5;
    }
    // Get angle b/w two vectors for 0 it's b/w 0 & 5

    const v1 = options.tile.getVectors()[side];
    const v2 = options.tile.getVectors()[otherVectorSide];

    let v1X = v1.x;
    let v1Y = v1.y;

    let v2X = v2.x;
    let v2Y = v2.y;

    // Align our sides to have a flush surface if they are against each other.
    if (side == 1) {
      v1X += 1.5;
      v1Y -= 0.5;
    }

    if (side == 4) {
      v1X -= 1.5;
      v1Y += 0.5;
    }

    if (side == 0) {
      v2Y += 0.15;
    }

    if (side == 3) {
      v2Y -= 0.15;
    }

    const dx = v2X - v1X;
    const dy = v2Y - v1Y;

    const rotation = (Math.atan2(dy, dx) * 180) / Math.PI;
    let distance = Math.sqrt(dx ** 2 + dy ** 2);

    let x = v1X;
    let y = v1Y;

    // Again align our sides some more to have a flush surface if they are against each other.

    if (side == 0 || side == 3) {
      distance += 1.625;
    }

    switch (side) {
      case 3:
      case 4:
        y -= 1.5;
        break;
      case 0:
      case 1:
        y += 1.5;
        break;

      case 2:
        x += 1.5;
        distance += 2;
        y += -1;
        break;
      case 5:
        x -= 1.5;
        distance += 2;
        y += 1;
        break;
    }

    super({
      x: x,
      y: y,
      image: Game.getImage(GameImage.RIVER),
      width: distance,
      height: 3,
      transparency: 1,
    });

    this.tile = options.tile;

    this.setRotation(rotation * (Math.PI / 180));
  }

  //FIXME: Remove these?
  public getRotationOriginX(): number {
    return this.x;
  }

  public getRotationOriginY(): number {
    return this.y;
  }
}
