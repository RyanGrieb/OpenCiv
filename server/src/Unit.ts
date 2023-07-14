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
  private queuedMovementTiles: Tile[];

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
    this.queuedMovementTiles = [];

    this.id = Unit.nextId;
    Unit.nextId += 1;

    ServerEvents.on({
      eventName: "moveUnit",
      parentObject: this,
      callback: (data) => {
        const targetTile =
          GameMap.getInstance().getTiles()[data["targetX"]][data["targetY"]];

        if (this.id !== data["id"] || this.tile === targetTile) return;

        // Move the furthest we can possibly go, and queue the rest of tiles for next turn.

        //FIXME: Allow this function to use our existing queuedMovementTiles,
        // This should stop the path from being redrawn every turn.
        console.log("Manual move:");
        const [arrivedTile, remainingTiles] =
          this.getMovementTowardsTargetTile(targetTile);

        if (!arrivedTile) return;

        this.moveToTile({
          previousTile: this.tile,
          targetTile: arrivedTile,
          remainingTiles: remainingTiles,
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

    ServerEvents.on({
      eventName: "nextTurn",
      parentObject: this,
      callback: (data) => {
        this.availableMovement = this.defaultMoveDistance;

        if (this.queuedMovementTiles.length > 0) {
          this.moveWithMovementQueue();
        }
      },
    });
  }

  public moveToTile(options: {
    previousTile: Tile;
    targetTile: Tile;
    remainingTiles: Tile[];
  }) {
    const previousTile = options.previousTile;
    const targetTile = options.targetTile;
    const remainingTiles = options.remainingTiles;

    this.tile.removeUnit(this);
    targetTile.addUnit(this);
    this.tile = targetTile;
    this.queuedMovementTiles = remainingTiles;

    const dataPacket = {
      event: "moveUnit",
      id: this.id,
      unitX: previousTile.getX(),
      unitY: previousTile.getY(),
      targetX: targetTile.getX(),
      targetY: targetTile.getY(),
    };

    // Store a list of queued tiles if we have remaining tiles
    if (remainingTiles.length > 0) {
      const remainingTilesJSON = [];
      for (const tile of remainingTiles) {
        remainingTilesJSON.push({ x: tile.getX(), y: tile.getY() });
      }
      dataPacket["queuedTiles"] = remainingTilesJSON;
    }

    // Send back packet, telling client server updated the unit location
    Game.getPlayers().forEach((player) => {
      player.sendNetworkEvent(dataPacket);
    });
  }

  private moveWithMovementQueue() {
    const targetTile = this.getTargetQueuedTile();
    const existingPath = [this.tile, ...this.queuedMovementTiles];

    console.log("Queued move:");
    const [arrivedTile, remainingTiles] = this.getMovementTowardsTargetTile(
      targetTile,
      existingPath
    );

    if (!arrivedTile) return;

    this.moveToTile({
      previousTile: this.tile,
      targetTile: arrivedTile,
      remainingTiles,
    });
  }

  private getMovementTowardsTargetTile(
    tile: Tile,
    existingPath?: Tile[]
  ): [Tile, Tile[]] {
    const shortestPath =
      existingPath ??
      GameMap.getInstance().constructShortestPath(
        this,
        this.tile, // Starting tile
        tile // Target tile
      );

    if (!existingPath) {
      console.log("Regenerate....");
    }

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
      //console.log(
      //  `From (${currentTile.getX()}, ${currentTile.getY()}) to (${nextTile.getX()}, ${nextTile.getY()}) - cost: ${movementCost}`
      //);

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

  public getTargetQueuedTile() {
    if (this.queuedMovementTiles.length < 1) return undefined;

    return this.queuedMovementTiles[this.queuedMovementTiles.length - 1];
  }
}
