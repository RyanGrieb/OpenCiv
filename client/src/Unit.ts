import { GameImage, SpriteRegion } from "./Assets";
import { Game } from "./Game";
import { GameMap } from "./map/GameMap";
import { Tile } from "./map/Tile";
import { NetworkEvents } from "./network/Client";
import { Actor } from "./scene/Actor";
import { ActorGroup } from "./scene/ActorGroup";
import { UnitDisplayInfo } from "./ui/UnitDisplayInfo";

export class UnitActionManager {
  private static instance: UnitActionManager;

  private actionMap: Map<string, UnitAction>;

  private constructor() {
    this.actionMap = new Map<string, UnitAction>();
  }

  // Public static method to access the singleton instance
  public static getInstance(): UnitActionManager {
    if (!UnitActionManager.instance) {
      UnitActionManager.instance = new UnitActionManager();
    }
    return UnitActionManager.instance;
  }

  public getActionMap() {
    return this.actionMap;
  }
}

// On unit creation, the server assigns UnitActions to the unit, along with the requirements for it to be enabled
export class UnitAction {
  private actionName: string;
  private requirements: string[]; // We assign these strings to client-side functions to check if there met.
  private icon: SpriteRegion;

  public constructor(
    actionName: string,
    requirements: string[],
    icon: SpriteRegion
  ) {
    this.actionName = actionName;
    this.requirements = requirements;
    this.icon = icon;
  }

  public getName() {
    return this.actionName;
  }

  public getIcon() {
    return this.icon;
  }

  public requirementsMet(unit: Unit): boolean {
    for (const requirement of this.requirements) {
      const requirementMethod = this[requirement] as Function;

      if (requirementMethod && requirementMethod.call(this, unit)) {
        return true;
      }
    }
    return true;
  }

  // Requirement methodss
  protected movement(unit: Unit) {
    return unit.getAvailableMovement() > 0;
  }

  /*protected nearEnemy(unit: Unit) {
    return false;
  }*/

  protected awayFromCity(unit: Unit) {
    return true;
  }
}

export interface options {
  name: string;
  id: number;
  attackType: string;
  tile: Tile;
  actionsJSONList: {
    name: string;
    icon: string;
    requirements: string[];
  }[];
}

export class Unit extends ActorGroup {
  private name: string;
  private id: number;
  private tile: Tile;
  private attackType: string;
  private unitActor: Actor;
  private selectionActors: Actor[];
  private selected: boolean;
  private totalMovement: number;
  private availableMovement: number;
  private unitDisplayInfo: UnitDisplayInfo;
  private actions: UnitAction[];

  constructor(options: options) {
    super({
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
    this.totalMovement = 2; // TODO: Have server define this.
    this.availableMovement = 2;
    this.actions = [];

    if (options.actionsJSONList) {
      for (const actionJSON of options.actionsJSONList) {
        this.actions.push(
          new UnitAction(
            actionJSON.name,
            actionJSON.requirements,
            SpriteRegion[actionJSON.icon]
          )
        );
      }
    }

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

  public getTotalMovement() {
    return this.totalMovement;
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
    this.selected = false;
    for (const actor of this.selectionActors) {
      this.removeActor(actor);
    }
    this.selectionActors = [];

    GameMap.getInstance().removeOutline(this.tile);
    Game.getCurrentScene().removeActor(this.unitDisplayInfo);
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

    /*this.selectionActors.push(
      new Actor({
        image: Game.getImage(GameImage.UNIT_SELECTION_CIRCLE),
        x: this.getTile().getX(),
        y: this.getTile().getY(),
        width: 32,
        height: 32,
      })
    );*/
    GameMap.getInstance().setOutline({
      tile: this.tile,
      edges: [1, 1, 1, 1, 1, 1],
      thickness: 1,
      color: "aqua",
    });

    for (const actor of this.selectionActors) {
      this.addActor(actor);
    }

    this.unitDisplayInfo = new UnitDisplayInfo(this);
    Game.getCurrentScene().addActor(this.unitDisplayInfo);
  }

  public getActions() {
    return this.actions;
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
