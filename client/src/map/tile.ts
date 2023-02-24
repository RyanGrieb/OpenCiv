import { GameImage, SpriteRegion } from "../assets";
import { Game } from "../game";
import { Actor } from "../scene/actor";

export interface TileOptions {
  tileType: string;
  x: number;
  y: number;
}

export class Tile extends Actor {
  constructor(options: TileOptions) {
    super({
      image: Game.getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion[options.tileType.toUpperCase()],
      x: options.x,
      y: options.y,
      width: 32,
      height: 32,
    });
  }
}
