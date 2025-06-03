import { GameImage, SpriteRegion } from "./Assets";
import { Game } from "./Game";
import { GameMap } from "./map/GameMap";
import { Tile } from "./map/Tile";
import { NetworkEvents } from "./network/Client";
import { AbstractPlayer } from "./player/AbstractPlayer";
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
  private desc: string;
  private requirements: string[]; // We assign these strings to client-side functions to check if there met.
  private icon: SpriteRegion;

  public constructor(actionName: string, desc: string, requirements: string[], icon: SpriteRegion) {
    this.actionName = actionName;
    this.desc = desc;
    this.requirements = requirements;
    this.icon = icon;
  }

  public getName() {
    return this.actionName;
  }

  public getDesc() {
    return this.desc;
  }

  public getIcon() {
    return this.icon;
  }

  public requirementsMet(unit: Unit): boolean {
    let allMet = true;

    for (const requirement of this.requirements) {
      const requirementMethod = this[requirement] as Function;

      if (requirementMethod && !requirementMethod.call(this, unit)) {
        allMet = false;
      }
    }
    return allMet;
  }

  // Requirement methods
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
    desc: string;
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
  private defaultMoveDistance: number;
  private availableMovement: number;
  private unitDisplayInfo: UnitDisplayInfo;
  private actions: UnitAction[];
  private queuedMovementTiles: Tile[];
  private player: AbstractPlayer;

  constructor(tile: Tile, unitJSON: JSON) {
    super({
      x: tile.getCenterPosition().x - 28 / 2,
      y: tile.getCenterPosition().y - 28 / 2,
      z: 2,
      width: 28,
      height: 28
    });

    this.tile = tile;
    this.name = unitJSON["name"];

    this.unitActor = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion[this.name.toUpperCase()],
      x: tile.getCenterPosition().x - 28 / 2,
      y: tile.getCenterPosition().y - 28 / 2,
      z: 2,
      width: 28,
      height: 28
    });

    this.addActor(this.unitActor);

    this.id = unitJSON["id"];
    this.attackType = unitJSON["attackType"];
    this.availableMovement = unitJSON["remainingMovement"];
    this.defaultMoveDistance = unitJSON["defaultMoveDistance"];
    this.player = AbstractPlayer.getPlayerByName(unitJSON["player"]);

    this.queuedMovementTiles = [];
    for (const jsonTile of unitJSON["queuedTiles"]) {
      this.queuedMovementTiles.push(GameMap.getInstance().getTiles()[jsonTile["x"]][jsonTile["y"]]);
    }

    this.selectionActors = [];
    this.actions = [];

    for (const actionJSON of unitJSON["actions"]) {
      this.actions.push(
        new UnitAction(actionJSON.name, actionJSON.desc, actionJSON.requirements, SpriteRegion[actionJSON.icon])
      );
    }

    console.log("new unit with id: " + this.id);

    NetworkEvents.on({
      eventName: "moveUnit",
      parentObject: this,
      callback: (data) => {
        const unitTile = GameMap.getInstance().getTiles()[data["unitX"]][data["unitY"]];
        const targetTile = GameMap.getInstance().getTiles()[data["targetX"]][data["targetY"]];

        if (this.tile !== unitTile || this.id !== data["id"]) {
          return;
        }

        // Update selection location if this unit is selected
        if (this.selected) {
          this.removeSelectionActors();
        }

        this.queuedMovementTiles = [];
        this.availableMovement = data["remainingMovement"];
        this.tile.removeUnit(this);
        this.tile = targetTile;
        targetTile.addUnit(this);
        this.updatePosition(targetTile);

        if (this.selected) {
          this.addSelectionActors();
        }

        // Assign queued tiles
        if ("queuedTiles" in data) {
          //console.log("Unit assigned a movement queue from server:");

          for (const tileJSON of data["queuedTiles"] as []) {
            const tile = GameMap.getInstance().getTiles()[tileJSON["x"]][tileJSON["y"]];
            this.queuedMovementTiles.push(tile);
          }
        }
      }
    });

    NetworkEvents.on({
      eventName: "newTurn",
      parentObject: this,
      callback: (data) => {
        this.availableMovement = this.defaultMoveDistance;
      }
    });

    NetworkEvents.on({
      eventName: "removeUnit",
      parentObject: this,
      callback: (data) => {
        const unitTile = GameMap.getInstance().getTiles()[data["unitX"]][data["unitY"]];

        if (this.tile !== unitTile) {
          return;
        }

        //FIXME: Tell client player to stop drawing lines.
        this.unselect();
        this.tile.removeUnit(this);
        Game.getInstance().getCurrentScene().removeActor(this);
      }
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

  public reduceMovement(amount: number) {
    this.availableMovement -= amount;
  }

  public setAvailableMovement(amount: number) {
    this.availableMovement = amount;
  }

  public getDefaultMoveDistance() {
    return this.defaultMoveDistance;
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
    this.removeSelectionActors();
    Game.getInstance().getCurrentScene().removeActor(this.unitDisplayInfo);
  }

  public select() {
    console.log("Select Unit");
    this.selected = true;
    this.addSelectionActors();

    this.unitDisplayInfo = new UnitDisplayInfo(this);
    Game.getInstance().getCurrentScene().addActor(this.unitDisplayInfo);
  }

  public getQueuedMovementTiles() {
    return this.queuedMovementTiles;
  }

  public getTargetQueuedTile() {
    if (this.queuedMovementTiles.length < 1) return undefined;

    return this.queuedMovementTiles[this.queuedMovementTiles.length - 1];
  }

  public hasMovementQueue() {
    return this.queuedMovementTiles.length > 0;
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
    super.setPosition(tile.getCenterPosition().x - 28 / 2, tile.getCenterPosition().y - 28 / 2);

    // Update unit sub-actor location
    this.unitActor.setPosition(tile.getCenterPosition().x - 28 / 2, tile.getCenterPosition().y - 28 / 2);
  }

  private removeSelectionActors() {
    for (const actor of this.selectionActors) {
      this.removeActor(actor);
    }
    this.selectionActors = [];

    GameMap.getInstance().removeOutline({
      tile: this.tile,
      cityOutline: false
    });
  }

  private addSelectionActors() {
    this.selectionActors.push(
      new Actor({
        image: Game.getInstance().getImage(GameImage.SPRITESHEET),
        spriteRegion: SpriteRegion.UNIT_SELECTION_TILE,
        x: this.getTile().getX(),
        y: this.getTile().getY(),
        width: 32,
        height: 32
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

    GameMap.getInstance().drawUnitSelectionOutline(this.tile, "aqua");

    for (const actor of this.selectionActors) {
      this.addActor(actor);
    }
  }

  public getPlayer() {
    return this.player;
  }
}
