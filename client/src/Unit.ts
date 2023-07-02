import { GameImage, SpriteRegion } from "./Assets";
import { Game } from "./Game";
import { Tile } from "./map/Tile";
import { Actor } from "./scene/Actor";
import { ActorGroup } from "./scene/ActorGroup";
import { Numbers } from "./util/Numbers";

export interface options {
  name: string;
  attackType: string;
  tile: Tile;
}

export class Unit extends ActorGroup {
  private name: string;
  private tile: Tile;
  private attackType: string;
  private selectionActors: Actor[];
  private selected: boolean;

  constructor(options: options) {
    super({
      //image: Game.getImage(GameImage.SPRITESHEET),
      //spriteRegion: SpriteRegion[type.toUpperCase()],
      x: options.tile.getCenterPosition()[0] - 28 / 2,
      y: options.tile.getCenterPosition()[1] - 28 / 2,
      width: 28,
      height: 28,
    });

    this.addActor(
      new Actor({
        image: Game.getImage(GameImage.SPRITESHEET),
        spriteRegion: SpriteRegion[options.name.toUpperCase()],
        x: options.tile.getCenterPosition()[0] - 28 / 2,
        y: options.tile.getCenterPosition()[1] - 28 / 2,
        width: 28,
        height: 28,
      })
    );

    this.name = options.name;
    this.tile = options.tile;
    this.attackType = options.attackType;
    this.selectionActors = [];
  }

  public getTileWeight(current: Tile, neighbor: Tile) {
    //FIXME: Unit's should have land OR sea variable to distinguish
    if (current.isWater()) {
      return 9999;
    }

    if (!neighbor) return current.getMovementCost();

    return Tile.getWeight(current, neighbor);
  }

  public toString(): String {
    return JSON.stringify({ name: this.name, attackType: this.attackType });
  }

  public unselect() {
    //console.log("Unselect");
    this.selected = false;
    for (const actor of this.selectionActors) {
      this.removeActor(actor);
    }
    this.selectionActors = [];
  }

  public select() {
    //console.log("Select");
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

  public getName(): string {
    return this.name;
  }

  public getAttackType(): string {
    return this.attackType;
  }

  public getTile(): Tile {
    return this.tile;
  }

  public isSelected(): boolean {
    return this.selected;
  }
}
