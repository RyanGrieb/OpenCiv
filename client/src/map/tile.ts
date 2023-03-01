import { GameImage, SpriteRegion } from "../assets";
import { Game } from "../game";
import { Actor } from "../scene/actor";

export interface TileOptions {
  tileType: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export class Tile extends Actor {
  private tileType: string;

  constructor(options: TileOptions) {
    super({
      image: Game.getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion[options.tileType.toUpperCase()],
      x: options.x,
      y: options.y,
      width: options.width ?? 32,
      height: options.height ?? 32,
    });

    this.tileType = options.tileType;
  }

  public getTileType() {
    return this.tileType;
  }
}
