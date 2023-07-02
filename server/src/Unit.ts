import { ServerEvents } from "./Events";
import { Game } from "./Game";
import { GameMap } from "./map/GameMap";
import { Tile } from "./map/Tile";

export interface UnitOptions {
  name: string;
  tile: Tile;
  attackType?: string;
  defaultMoveDistance?: number;
}

export class Unit {
  private name: string;
  private attackType: string;
  private defaultMoveDistance: number;
  private tile: Tile;

  private static nextId = 0;
  private id: number; // Increment this every time a unit object is created

  constructor(options: UnitOptions) {
    this.name = options.name;
    this.tile = options.tile;
    this.attackType = options.attackType || "none";
    this.defaultMoveDistance = options.defaultMoveDistance || 2;

    this.id = Unit.nextId;
    Unit.nextId += 1;

    ServerEvents.on({
      eventName: "moveUnit",
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
  }

  public asJSON() {
    return {
      name: this.name,
      attackType: this.attackType,
      id: this.id,
    };
  }
}
