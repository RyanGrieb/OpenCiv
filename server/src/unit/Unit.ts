import { ServerEvents } from "../Events";
import { Game } from "../Game";
import { Player } from "../Player";
import { GameMap } from "../map/GameMap";
import { Tile } from "../map/Tile";
import { PlayerVisibility } from "../map/PlayerVisibility";
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
  sightRange?: number;
  isUtility?: boolean;
  ignoresTerrainCost?: boolean;
  actions: UnitAction[];
}

export interface UnitYMLTypeData {
  name: string;
  attack_type?: string;
  default_move_distance?: number;
  // How far this unit reveals the map for its owner, in tiles. Defaults to
  // PlayerVisibility.DEFAULT_UNIT_SIGHT_RANGE when the config leaves it out.
  sight_range?: number;
  is_utility?: boolean;
  ignores_terrain_cost?: boolean;
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
  private sightRange: number;
  private utility: boolean;
  private terrainCostIgnored: boolean;
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
    this.sightRange = options.sightRange ?? PlayerVisibility.DEFAULT_UNIT_SIGHT_RANGE;
    this.utility = options.isUtility || false;
    this.terrainCostIgnored = options.ignoresTerrainCost || false;
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
    //
    // Only players who can see where it appeared hear about it; everyone else meets it when it
    // walks into their sight (see moveToTile).
    this.sendToObservers(this.tile, (player) => ({ event: "createUnit", ...this.asJSON({ observer: player }) }));

    // This unit is a new source of sight for its owner - whatever it stands on is now revealed.
    this.player.getVisibility().update();
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
      sightRange: data.sight_range,
      isUtility: data.is_utility,
      ignoresTerrainCost: data.ignores_terrain_cost,
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

    // Taken before the move, since moving the unit can change what its owner can see.
    const sightOfOrigin = new Map<Player, boolean>();
    Game.getInstance()
      .getPlayers()
      .forEach((player) => {
        sightOfOrigin.set(player, player.getVisibility().isVisible(previousTile));
      });

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

    // Moving is itself a change of sight, so refresh the owner's fog before telling anyone where
    // this unit went - that way the tiles it just revealed are already on their client.
    this.player.getVisibility().update();

    // What each of the other players gets depends on which ends of the move they could see:
    // both ends is an ordinary move, only the destination means the unit walked out of the fog,
    // and only the origin means it walked into it.
    Game.getInstance()
      .getPlayers()
      .forEach((player) => {
        if (player === this.player) {
          player.sendNetworkEvent(dataPacket);
          return;
        }

        const sawOrigin = sightOfOrigin.get(player);
        const seesTarget = player.getVisibility().isVisible(targetTile);

        if (sawOrigin && seesTarget) {
          // Another player has no business knowing where this unit is headed next.
          player.sendNetworkEvent({ ...dataPacket, queuedTiles: undefined });
        } else if (seesTarget) {
          player.sendNetworkEvent({ event: "createUnit", ...this.asJSON({ observer: player }) });
        } else if (sawOrigin) {
          player.sendNetworkEvent({
            event: "removeUnit",
            id: this.id,
            unitX: previousTile.getX(),
            unitY: previousTile.getY()
          });
        }
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

    // Only the owner tracks a movement queue - it's their unit's intent, not public information.
    this.player.sendNetworkEvent({ event: "clearMovementQueue", id: this.id });
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

    this.sendToObservers(this.tile, () => ({
      event: "removeUnit",
      id: this.id,
      unitX: this.tile.getX(),
      unitY: this.tile.getY()
    }));

    // The unit was a source of sight - whatever only it could see falls back into fog.
    this.player.getVisibility().update();
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

  public getSightRange() {
    return this.sightRange;
  }

  public ignoresTerrainCost() {
    return this.terrainCostIgnored;
  }

  // Anyone other than the owner gets a redacted unit: no movement queue (that would give away
  // where it's headed) and no actions (those only ever drive the owner's own UI).
  public asJSON(options?: { observer?: Player }) {
    const ownUnit = !options?.observer || options.observer === this.player;

    const queuedTilesJSON = ownUnit
      ? this.queuedMovementTiles.map((tile) => ({
          x: tile.getX(),
          y: tile.getY()
        }))
      : [];

    return {
      name: this.name,
      tileX: this.tile.getX(),
      tileY: this.tile.getY(),
      player: this.player.getName(),
      attackType: this.attackType,
      isUtility: this.utility,
      ignoresTerrainCost: this.terrainCostIgnored,
      id: this.id,
      actions: ownUnit ? this.getUnitActionsJSON() : [],
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

    return Tile.getWeight(current, neighbor, this);
  }

  public getTargetQueuedTile() {
    if (this.queuedMovementTiles.length < 1) return undefined;

    return this.queuedMovementTiles[this.queuedMovementTiles.length - 1];
  }

  // Sends a packet only to the players who can currently see the given tile. The builder takes the
  // receiving player so packets carrying unit JSON can redact it per observer.
  private sendToObservers(tile: Tile, packetFor: (player: Player) => Record<string, any>) {
    Game.getInstance()
      .getPlayers()
      .forEach((player) => {
        if (!player.getVisibility().isVisible(tile)) return;

        player.sendNetworkEvent(packetFor(player));
      });
  }
}
