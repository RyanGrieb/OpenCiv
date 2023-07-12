import { ServerEvents } from "./Events";
import { Game } from "./Game";
import { Player } from "./Player";
import { GameMap } from "./map/GameMap";
import { Tile } from "./map/Tile";

export interface UnitOptions {
  name: string;
  tile: Tile;
  player: Player;
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
  private player: Player;
  private attackType: string;
  private defaultMoveDistance: number;
  private availableMovement: number;
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
    this.player = options.player;
    this.tile = options.tile;
    this.attackType = options.attackType || "none";
    this.defaultMoveDistance = options.defaultMoveDistance || 2;
    this.availableMovement = this.defaultMoveDistance;
    this.actions = options.actions || [];

    this.id = Unit.nextId;
    Unit.nextId += 1;

    ServerEvents.on({
      eventName: "moveUnit",
      parentObject: this,
      callback: (data, websocket) => {
        const unitTile =
          GameMap.getInstance().getTiles()[data["unitX"]][data["unitY"]];

        if (this.tile !== unitTile) return;

        const targetTile =
          GameMap.getInstance().getTiles()[data["targetX"]][data["targetY"]];

        if (this.tile === targetTile) return;

        this.tile.removeUnit(this);

        // Move the furthest we can possibly go, and queue the rest of tiles for next turn.
        const [arrivedTile, remainingTiles] =
          this.moveTowardsTargetTile(targetTile);

        if (!arrivedTile) return;

        arrivedTile.addUnit(this);

        // Update packet data.
        data["targetX"] = arrivedTile.getX();
        data["targetY"] = arrivedTile.getY();

        if (arrivedTile !== targetTile) {
          // Update packet data with the tiles we have queued?
        }

        this.tile = arrivedTile;

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
        const unitTile =
          GameMap.getInstance().getTiles()[data["unitX"]][data["unitY"]];

        if (this.tile !== unitTile) return;

        const action = this.getActionByName(data["actionName"]);
        if (action) {
          action.onAction(this);
        }
      },
    });
  }

  public moveTowardsTargetTile(tile: Tile): [Tile, Tile[]] {
    const shortestPath: Tile[] = GameMap.getInstance().constructShortestPath(
      this,
      this.tile, // Starting tile
      tile // Target tile
    );

    const traversedTiles: Tile[] = [this.tile];

    // Traverse tile by tile, removing our movement incrementally.
    for (let i = 0; i < shortestPath.length; i++) {
      const currentTile = shortestPath[i];
      const nextTile =
        i + 1 >= shortestPath.length ? undefined : shortestPath[i + 1];

      if (!nextTile) continue;

      if (this.availableMovement <= 0) {
        break;
      }

      const movementCost = this.getTileWeight(currentTile, nextTile);
      console.log(
        `From (${currentTile.getX()}, ${currentTile.getY()}) to (${nextTile.getX()}, ${nextTile.getY()}) - cost: ${movementCost}`
      );

      this.availableMovement = Math.max(
        this.availableMovement - movementCost,
        0
      );
      traversedTiles.push(nextTile);
    }

    const remainingTiles: Tile[] = shortestPath.filter(
      (tile) => !traversedTiles.includes(tile)
    );

    return [traversedTiles.pop(), remainingTiles];
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

  public getPlayer() {
    return this.player;
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

  public getTileWeight(current: Tile, neighbor: Tile) {
    //FIXME: Unit's should have land OR sea variable to distinguish
    if (current.isWater()) {
      return 9999;
    }

    if (!neighbor) return current.getMovementCost();

    return Tile.getWeight(current, neighbor);
  }
}
