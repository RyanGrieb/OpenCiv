import { GameImage, SpriteRegion } from "./Assets";
import { Game } from "./Game";
import { Tile } from "./map/Tile";
import { Actor } from "./scene/Actor";
import { ActorGroup } from "./scene/ActorGroup";

export class Unit extends ActorGroup {
  private type: string;
  private tile: Tile;
  private selectionActors: Actor[];
  private selected: boolean;

  constructor(type: string, tile: Tile) {
    super({
      //image: Game.getImage(GameImage.SPRITESHEET),
      //spriteRegion: SpriteRegion[type.toUpperCase()],
      x: tile.getCenterPosition()[0] - 28 / 2,
      y: tile.getCenterPosition()[1] - 28 / 2,
      width: 28,
      height: 28,
    });

    this.addActor(
      new Actor({
        image: Game.getImage(GameImage.SPRITESHEET),
        spriteRegion: SpriteRegion[type.toUpperCase()],
        x: tile.getCenterPosition()[0] - 28 / 2,
        y: tile.getCenterPosition()[1] - 28 / 2,
        width: 28,
        height: 28,
      })
    );

    this.type = type;
    this.tile = tile;
    this.selectionActors = [];
  }

  public unselect() {
    console.log("Unselect");
    this.selected = false;
    for (const actor of this.selectionActors) {
      this.removeActor(actor);
    }
    this.selectionActors = [];
  }

  public select() {
    console.log("Select");
    this.selected = true;
    this.selectionActors.push(
      new Actor({
        image: Game.getImage(GameImage.SPRITESHEET),
        spriteRegion: SpriteRegion.UNIT_SELECTION_TILE,
        x: this.getTile().getX(),
        y: this.getTile().getY(),
        width: 32,
        height: 32,
      })
    );

    this.selectionActors.push(
      new Actor({
        image: Game.getImage(GameImage.UNIT_SELECTION_CIRCLE),
        x: this.getTile().getX(),
        y: this.getTile().getY(),
        width: 32,
        height: 32,
      })
    );

    for (const actor of this.selectionActors) {
      this.addActor(actor);
    }
  }

  public getType(): string {
    return this.type;
  }

  public getTile(): Tile {
    return this.tile;
  }

  public isSelected(): boolean {
    return this.selected;
  }
}
