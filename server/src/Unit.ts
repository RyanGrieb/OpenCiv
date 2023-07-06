import { ServerEvents } from "./Events";
import { Game } from "./Game";
import { GameMap } from "./map/GameMap";
import { Tile } from "./map/Tile";

export interface UnitOptions {
  name: string;
  tile: Tile;
  attackType?: string;
  defaultMoveDistance?: number;
  actions: {
    name: string;
    icon: string;
    requirements: string[];
    desc: string;
    onAction: (unit: Unit) => void;
  }[];
}

export class Unit {
  private name: string;
  private attackType: string;
  private defaultMoveDistance: number;
  private tile: Tile;

  private static nextId = 0;
  private id: number; // Increment this every time a unit object is created
  private actions: {
    name: string;
    icon: string;
    requirements: string[];
    desc: string;
    onAction: (unit: Unit) => void;
  }[];

  constructor(options: UnitOptions) {
    this.name = options.name;
    this.tile = options.tile;
    this.attackType = options.attackType || "none";
    this.defaultMoveDistance = options.defaultMoveDistance || 2;
    this.actions = options.actions || [];

    this.id = Unit.nextId;
    Unit.nextId += 1;

    ServerEvents.on({
      eventName: "moveUnit",
      parentObject: this,
      callback: (data, websocket) => {
        const unitTile = GameMap.getTiles()[data["unitX"]][data["unitY"]];

        if (this.tile !== unitTile) return;

        this.tile.removeUnit(this);

        const targetTile = GameMap.getTiles()[data["targetX"]][data["targetY"]];
        targetTile.addUnit(this);
        this.tile = targetTile;

        // Send back packet, telling client server updated the unit location
        Game.getPlayers().forEach((player) => {
          player.sendNetworkEvent(data);
        });
      },
    });

    ServerEvents.on({
      eventName: "unitAction",
      parentObject: this,
      callback: (data, websocket) => {
        const unitTile = GameMap.getTiles()[data["unitX"]][data["unitY"]];

        if (this.tile !== unitTile) return;

        const action = this.getActionByName(data["actionName"]);
        if (action) {
          action.onAction(this);
        }
      },
    });
  }

  public delete() {
    this.tile.removeUnit(this);
    ServerEvents.removeCallbacksByParentObject(this);

    Game.getPlayers().forEach((player) => {
      player.sendNetworkEvent({
        event: "removeUnit",
        id: this.id,
        unitX: this.tile.getX(),
        unitY: this.tile.getY(),
      });
    });
  }

  public getTile() {
    return this.tile;
  }

  public asJSON() {
    return {
      name: this.name,
      attackType: this.attackType,
      id: this.id,
      actions: this.getUnitActionsJSON(),
    };
  }

  public getActionByName(name: string) {
    for (const action of this.actions) {
      if (action.name === name) {
        return action;
      }
    }

    return undefined;
  }

  public getUnitActionsJSON() {
    const actions: { name: string; requirements: string[]; desc: string }[] =
      [];

    actions.push(
      ...this.actions.map(({ name, icon, requirements, desc }) => ({
        name,
        icon,
        requirements,
        desc,
      }))
    );
    return actions;
  }
}
