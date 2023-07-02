import { GameImage, SpriteRegion } from "./Assets";
import { Game } from "./Game";
import { GameMap } from "./map/GameMap";
import { Tile } from "./map/Tile";
import { NetworkEvents } from "./network/Client";
import { Actor } from "./scene/Actor";
import { ActorGroup } from "./scene/ActorGroup";

export interface options {
  name: string;
  id: number;
  attackType: string;
  tile: Tile;
}

export class Unit extends ActorGroup {
  private name: string;
  private id: number;
  private tile: Tile;
  private attackType: string;
  private unitActor: Actor;
  private selectionActors: Actor[];
  private selected: boolean;
  private availableMovement: number;

  constructor(options: options) {
    super({
      //image: Game.getImage(GameImage.SPRITESHEET),
      //spriteRegion: SpriteRegion[type.toUpperCase()],
      x: options.tile.getCenterPosition()[0] - 28 / 2,
      y: options.tile.getCenterPosition()[1] - 28 / 2,
      width: 28,
      height: 28,
    });

    this.unitActor = new Actor({
      image: Game.getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion[options.name.toUpperCase()],
      x: options.tile.getCenterPosition()[0] - 28 / 2,
      y: options.tile.getCenterPosition()[1] - 28 / 2,
      width: 28,
      height: 28,
    });

    this.addActor(this.unitActor);

    this.name = options.name;
    this.id = options.id;
    this.tile = options.tile;
    this.attackType = options.attackType;
    this.selectionActors = [];
    this.availableMovement = 2;

    console.log("new unit with id: " + this.id);

    NetworkEvents.on({
      eventName: "moveUnit",
      callback: (data) => {
        const unitTile =
          GameMap.getInstance().getTiles()[data["unitX"]][data["unitY"]];

        if (this.tile !== unitTile) {
          return;
        }

        this.tile.removeUnit(this);

        const targetTile =
          GameMap.getInstance().getTiles()[data["targetX"]][data["targetY"]];
        this.tile = targetTile;
        targetTile.addUnit(this);

        this.updatePosition(targetTile);
      },
    });
  }

  public getTileWeight(current: Tile, neighbor: Tile) {
    //FIXME: Unit's should have land OR sea variable to distinguish
    if (current.isWater()) {
      return 9999;
    }

    if (!neighbor) return current.getMovementCost();

    return Tile.getWeight(current, neighbor);
  }

  public reduceMovement(amount) {
    this.availableMovement -= amount;
  }

  public setAvailableMovement(amount) {
    this.availableMovement = amount;
  }

  public getAvailableMovement() {
    return this.availableMovement;
  }

  public getID() {
    return this.id;
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

  /**
   * Updates the unit position, modify sub-actors locations
   * @param tile The tile we are now positioned on.
   */
  public updatePosition(tile: Tile): void {
    // Ensure group-actor location is updated
    super.setPosition(
      tile.getCenterPosition()[0] - 28 / 2,
      tile.getCenterPosition()[1] - 28 / 2
    );

    // Update unit sub-actor location
    this.unitActor.setPosition(
      tile.getCenterPosition()[0] - 28 / 2,
      tile.getCenterPosition()[1] - 28 / 2
    );
  }
}
