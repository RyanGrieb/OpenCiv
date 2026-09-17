import { ServerEvents } from "../Events";
import { Game } from "../Game";
import { Player } from "../Player";
import { GameMap } from "../map/GameMap";
import { Tile } from "../map/Tile";
import { ConfigLoader } from "../util/ConfigLoader";

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
  isUtility?: boolean;
  actions: UnitAction[];
}

export interface UnitYMLTypeData {
  name: string;
  attack_type?: string;
  default_move_distance?: number;
  is_utility?: boolean;
  // Absent for units never offered through a city's production queue (e.g. the
  // Settler, which is only ever granted directly at game start).
  cost?: number;
  required_tech?: string;
}

export class Unit {
  private static nextId = 0;

  private name: string;
  private player: Player;
  private attackType: string;
  private defaultMoveDistance: number;
  private availableMovement: number;
  private utility: boolean;
  private tile: Tile;
  private queuedMovementTiles: Tile[];

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
    this.utility = options.isUtility || false;
    this.actions = options.actions || [];
    this.actions = options.actions || [];
    this.queuedMovementTiles = [];

    this.player.addUnit(this);

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

        // No movement left this turn and nothing left to queue either (blocked immediately, or no
        // path at all) - reject outright. If remainingTiles is non-empty though, this still queues
        // the rest of the path for next turn even though we can't take a single step of it now.
        if (!arrivedTile || (arrivedTile === this.tile && remainingTiles.length === 0)) return;

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

    // Self-announce, same as moveToTile/delete() below - so any unit created
    // after the client's initial map fetch (e.g. one finished by production)
    // still shows up. Harmless for units created before a client has loaded
    // the map: NetworkEvents.call() only reaches listeners registered at the
    // moment it fires, so this is simply unheard until GameMap registers its
    // "createUnit" listener, and that listener dedupes by id regardless.
    Game.getInstance()
      .getPlayers()
      .forEach((player) => {
        player.sendNetworkEvent({ event: "createUnit", ...this.asJSON() });
      });
  }

  public static createFromName(name: string, tile: Tile, player: Player): Unit | undefined {
    const data = Unit.getUnitYMLTypeDataByName(name);
    if (!data) return undefined;

    return new Unit({
      name: data.name,
      tile,
      player,
      attackType: data.attack_type,
      defaultMoveDistance: data.default_move_distance,
      isUtility: data.is_utility,
      actions: []
    });
  }

  // Every unit type the config knows about, including ones with no `cost` -
  // callers building a production catalog must filter those out themselves.
  public static getAllUnitData(): UnitYMLTypeData[] {
    return Unit.loadUnitData();
  }

  private static getUnitYMLTypeDataByName(name: string): UnitYMLTypeData | undefined {
    return Unit.loadUnitData().find((unit) => unit.name.toLocaleLowerCase() === name.toLocaleLowerCase());
  }

  private static loadUnitData(): UnitYMLTypeData[] {
    return ConfigLoader.load<{ units: UnitYMLTypeData[] }>("./config/units.yml").units;
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

    const dataPacket: {
      event: string;
      id: number;
      remainingMovement: number;
      unitX: number;
      unitY: number;
      targetX: number;
      targetY: number;
      queuedTiles?: { x: number; y: number }[];
    } = {
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

    // Couldn't advance at all - something is parked in the way, so drop the queue rather than
    // retrying it every turn and eventually walking into the blocker's tile once it leaves.
    if (!arrivedTile || arrivedTile === this.tile) {
      this.clearMovementQueue();
      return;
    }

    this.moveToTile({
      previousTile: this.tile,
      targetTile: arrivedTile,
      remainingTiles,
      remainingMovement: remainingMovement
    });
  }

  private clearMovementQueue() {
    if (this.queuedMovementTiles.length < 1) return;

    this.queuedMovementTiles = [];

    Game.getInstance()
      .getPlayers()
      .forEach((player) => {
        player.sendNetworkEvent({ event: "clearMovementQueue", id: this.id });
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
    let blocked = false;

    // Traverse tile by tile, removing our movement incrementally.
    for (let i = 0; i < shortestPath.length; i++) {
      const currentTile = shortestPath[i];
      const nextTile = i + 1 >= shortestPath.length ? undefined : shortestPath[i + 1];

      if (!nextTile) continue;

      if (remainingMovement <= 0) {
        break;
      }

      if (nextTile.hasBlockingUnit(this)) {
        blocked = true;
        break;
      }

      const movementCost = this.getTileWeight(currentTile, nextTile);
      //console.log(
      //  `From (${currentTile.getX()}, ${currentTile.getY()}) to (${nextTile.getX()}, ${nextTile.getY()}) - cost: ${movementCost}`
      //);

      remainingMovement = Math.max(remainingMovement - movementCost, 0);
      traversedTiles.push(nextTile);
    }

    // Queuing tiles we're blocked from entering just stalls the unit against the blocker every
    // turn, then walks it into the tile the moment that unit leaves. Drop the rest of the path.
    const remainingTiles: Tile[] = blocked ? [] : shortestPath.filter((tile) => !traversedTiles.includes(tile));

    return [traversedTiles.pop(), remainingTiles, remainingMovement];
  }

  public delete() {
    this.tile.removeUnit(this);
    this.player.removeUnit(this);
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

  public isUtility() {
    return this.utility;
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
      isUtility: this.utility,
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

    if (neighbor.hasBlockingUnit(this)) {
      return 9999;
    }

    return Tile.getWeight(current, neighbor);
  }

  public getTargetQueuedTile() {
    if (this.queuedMovementTiles.length < 1) return undefined;

    return this.queuedMovementTiles[this.queuedMovementTiles.length - 1];
  }
}
