import { GameImage, SpriteRegion } from "./Assets";
import { Game } from "./Game";
import { Tile } from "./map/Tile";
import { Actor } from "./scene/Actor";

export class Unit extends Actor {
  private type: string;
  private tile: Tile;

  constructor(type: string, tile: Tile) {
    super({
      image: Game.getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion[type.toUpperCase()],
      x: tile.getCenterPosition()[0] - 28 / 2,
      y: tile.getCenterPosition()[1] - 28 / 2,
      width: 28,
      height: 28,
    });

    this.type = type;
    this.tile = tile;
  }

  public getType(): string {
    return this.type;
  }

  public getTile(): Tile {
    return this.tile;
  }
}
