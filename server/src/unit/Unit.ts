import { ServerEvents } from "../Events";
import { Game } from "../Game";
import { Player } from "../Player";
import { GameMap } from "../map/GameMap";
import { Tile } from "../map/Tile";

export interface UnitAction {
  name: string;
  icon: string;
  requirements: string[];
  desc: string;
  onAction: (unit: Unit) => void;
}

export interface UnitOptions {
  name: string;
  tile: Tile;
  player: Player;
  attackType?: string;
  defaultMoveDistance?: number;
  actions: UnitAction[];
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
      callback: (data, websocket) => {
        const targetTile = GameMap.getInstance().getTiles()[data["targetX"]][data["targetY"]];
        const player = Game.getInstance().getPlayerFromWebsocket(websocket);

        if (this.id !== data["id"] || this.tile === targetTile || this.player != player) return;

        // Move the furthest we can possibly go, and queue the rest of tiles for next turn.

        //FIXME: Allow this function to use our existing queuedMovementTiles,
        // This should stop the path from being redrawn every turn.
        const [arrivedTile, remainingTiles, remainingMovement] = this.getMovementTowardsTargetTile(targetTile);

        if (!arrivedTile) return;

        this.moveToTile({
          previousTile: this.tile,
          targetTile: arrivedTile,
          remainingTiles: remainingTiles,
          remainingMovement: remainingMovement
        });
      }
    });

    ServerEvents.on({
      eventName: "unitAction",
      parentObject: this,
      callback: (data, websocket) => {
        const unitTile = GameMap.getInstance().getTiles()[data["unitX"]][data["unitY"]];

        if (this.tile !== unitTile) return;

        const action = this.getActionByName(data["actionName"]);
        if (action) {
          action.onAction(this);
        }
      }
    });

    ServerEvents.on({
      eventName: "nextTurn",
      parentObject: this,
      callback: (data) => {
        this.availableMovement = this.defaultMoveDistance;

        if (this.queuedMovementTiles.length > 0) {
          this.moveWithMovementQueue();
        }
      }
    });
  }

  public moveToTile(options: {
    previousTile: Tile;
    targetTile: Tile;
    remainingTiles: Tile[];
    remainingMovement: number;
  }) {
    const previousTile = options.previousTile;
    const targetTile = options.targetTile;
    const remainingTiles = options.remainingTiles;
    const remainingMovement = options.remainingMovement;

    this.tile.removeUnit(this);
    targetTile.addUnit(this);
    this.tile = targetTile;
    this.queuedMovementTiles = remainingTiles;
    this.availableMovement = remainingMovement;

    const dataPacket = {
      event: "moveUnit",
      id: this.id,
      remainingMovement: remainingMovement,
      unitX: previousTile.getX(),
      unitY: previousTile.getY(),
      targetX: targetTile.getX(),
      targetY: targetTile.getY()
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
    Game.getInstance()
      .getPlayers()
      .forEach((player) => {
        player.sendNetworkEvent(dataPacket);
      });
  }

  private moveWithMovementQueue() {
    const targetTile = this.getTargetQueuedTile();
    const existingPath = [this.tile, ...this.queuedMovementTiles];

    const [arrivedTile, remainingTiles, remainingMovement] = this.getMovementTowardsTargetTile(
      targetTile,
      existingPath
    );

    if (!arrivedTile) return;

    this.moveToTile({
      previousTile: this.tile,
      targetTile: arrivedTile,
      remainingTiles,
      remainingMovement: remainingMovement
    });
  }

  private getMovementTowardsTargetTile(tile: Tile, existingPath?: Tile[]): [Tile, Tile[], number] {
    const shortestPath =
      existingPath ??
      GameMap.getInstance().constructShortestPath(
        this,
        this.tile, // Starting tile
        tile // Target tile
      );

    //if (!existingPath) {
    //  console.log("Regenerate....");
    // }

    const traversedTiles: Tile[] = [this.tile];
    let remainingMovement = this.availableMovement;

    // Traverse tile by tile, removing our movement incrementally.
    for (let i = 0; i < shortestPath.length; i++) {
      const currentTile = shortestPath[i];
      const nextTile = i + 1 >= shortestPath.length ? undefined : shortestPath[i + 1];

      if (!nextTile) continue;

      if (remainingMovement <= 0) {
        break;
      }

      const movementCost = this.getTileWeight(currentTile, nextTile);
      //console.log(
      //  `From (${currentTile.getX()}, ${currentTile.getY()}) to (${nextTile.getX()}, ${nextTile.getY()}) - cost: ${movementCost}`
      //);

      remainingMovement = Math.max(remainingMovement - movementCost, 0);
      traversedTiles.push(nextTile);
    }

    const remainingTiles: Tile[] = shortestPath.filter((tile) => !traversedTiles.includes(tile));

    return [traversedTiles.pop(), remainingTiles, remainingMovement];
  }

  public delete() {
    this.tile.removeUnit(this);
    ServerEvents.removeCallbacksByParentObject(this);

    Game.getInstance()
      .getPlayers()
      .forEach((player) => {
        player.sendNetworkEvent({
          event: "removeUnit",
          id: this.id,
          unitX: this.tile.getX(),
          unitY: this.tile.getY()
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
    const queuedTilesJSON = this.queuedMovementTiles.map((tile) => ({
      x: tile.getX(),
      y: tile.getY()
    }));

    return {
      name: this.name,
      tileX: this.tile.getX(),
      tileY: this.tile.getY(),
      player: this.player.getName(),
      attackType: this.attackType,
      id: this.id,
      actions: this.getUnitActionsJSON(),
      queuedTiles: queuedTilesJSON,
      remainingMovement: this.availableMovement,
      defaultMoveDistance: this.defaultMoveDistance
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
    const actions: { name: string; requirements: string[]; desc: string }[] = [];

    actions.push(
      ...this.actions.map(({ name, icon, requirements, desc }) => ({
        name,
        icon,
        requirements,
        desc
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
