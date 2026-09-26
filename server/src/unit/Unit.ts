import { City } from "../city/City";
import { ServerEvents } from "../Events";
import { Game } from "../Game";
import { Player } from "../Player";
import { GameMap } from "../map/GameMap";
import { Improvement, ImprovementData } from "../map/Improvement";
import { Tile } from "../map/Tile";
import { PlayerVisibility } from "../map/PlayerVisibility";
import { ConfigLoader } from "../util/ConfigLoader";
import { Combat } from "./Combat";
import { UnitActions } from "./UnitActions";

export interface UnitAction {
  name: string;
  icon: string;
  requirements: string[];
  desc: string;
  // Whether the server allows the action where the unit stands right now. The client checks the
  // simpler requirements above itself, but this one depends on game state it doesn't have.
  isAvailable?: (unit: Unit) => boolean;
  onAction: (unit: Unit) => void;
}

export interface UnitOptions {
  name: string;
  tile: Tile;
  player: Player;
  attackType?: string;
  combatStrength?: number;
  rangedStrength?: number;
  range?: number;
  defaultMoveDistance?: number;
  sightRange?: number;
  isUtility?: boolean;
  ignoresTerrainCost?: boolean;
  domain?: UnitDomain;
  coastOnly?: boolean;
  // Movement to start with, when not a full turn's worth (e.g. a unit that was just captured).
  availableMovement?: number;
  actions: UnitAction[];
}

// Where a unit can go: land units walk, sea units sail.
export type UnitDomain = "land" | "sea";

export interface UnitYMLTypeData {
  name: string;
  attack_type?: string;
  // Civ 5 melee Combat Strength. Absent (0) for civilians, which can't attack or defend.
  combat_strength?: number;
  // Civ 5 Ranged Combat Strength and Range. Set only on ranged units, which shoot instead of melee.
  ranged_strength?: number;
  range?: number;
  // The unit type a civilian turns into when an enemy captures it. Absent means it's destroyed instead.
  captured_as?: string;
  default_move_distance?: number;
  // How far this unit reveals the map for its owner, in tiles. Defaults to
  // PlayerVisibility.DEFAULT_UNIT_SIGHT_RANGE when the config leaves it out.
  sight_range?: number;
  is_utility?: boolean;
  ignores_terrain_cost?: boolean;
  // "sea" for ships, which only move on water and into their owner's coastal cities. Absent means land.
  domain?: UnitDomain;
  // A sea unit that can't enter deep ocean, like Civ 5's Trireme.
  coast_only?: boolean;
  // Absent for units never offered through a city's production queue (e.g. the
  // Settler, which is only ever granted directly at game start).
  cost?: number;
  required_tech?: string;
  // Once researched, cities stop offering this unit (see units.yml).
  obsolete_tech?: string;
}

export class Unit {
  private static nextId = 0;

  private name: string;
  private player: Player;
  private attackType: string;
  private combatStrength: number;
  // 0 for anything that isn't a ranged unit.
  private rangedStrength: number;
  private range: number;
  private health: number;
  // Moved or fought since the turn began - a fortified unit that did neither heals at the next turn.
  private actedThisTurn: boolean;
  // Set by the "Fortify Until Healed" action; cleared by moving, attacking, or reaching full health.
  private fortified: boolean;
  // Healing only kicks in once the unit has spent a whole turn fortified, so false on the turn it fortifies.
  private fortifiedForATurn: boolean;
  private defaultMoveDistance: number;
  private availableMovement: number;
  private sightRange: number;
  private utility: boolean;
  private terrainCostIgnored: boolean;
  private domain: UnitDomain;
  private coastOnly: boolean;
  private tile: Tile;
  private queuedMovementTiles: Tile[];
  // The improvement a Builder is working on where it stands. Moving away stops the work.
  private buildingImprovement: string | undefined;

  private id: number; // Increment this every time a unit object is created
  private actions: UnitAction[];

  constructor(options: UnitOptions) {
    this.name = options.name;
    this.player = options.player;
    this.tile = options.tile;
    this.attackType = options.attackType || "none";
    this.combatStrength = options.combatStrength ?? 0;
    this.rangedStrength = options.rangedStrength ?? 0;
    this.range = options.range ?? 0;
    this.health = Combat.MAX_HEALTH;
    this.actedThisTurn = false;
    this.fortified = false;
    this.fortifiedForATurn = false;
    this.defaultMoveDistance = options.defaultMoveDistance || 2;
    this.availableMovement = options.availableMovement ?? this.defaultMoveDistance;
    this.sightRange = options.sightRange ?? PlayerVisibility.DEFAULT_UNIT_SIGHT_RANGE;
    this.utility = options.isUtility || false;
    this.terrainCostIgnored = options.ignoresTerrainCost || false;
    this.domain = options.domain ?? "land";
    this.coastOnly = options.coastOnly ?? false;
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
      eventName: "attackUnit",
      parentObject: this,
      callback: (data, websocket) => {
        const player = Game.getInstance().getPlayerFromWebsocket(websocket);
        if (this.id !== data["id"] || this.player !== player) return;

        const targetTile = GameMap.getInstance().getTiles()[data["targetX"]]?.[data["targetY"]];
        if (!targetTile) return;

        if (this.isRanged()) this.rangedAttack(targetTile);
        else this.meleeAttack(targetTile);
      }
    });

    // Answers the attack screen a player sees while aiming at an enemy - only to the unit's owner.
    ServerEvents.on({
      eventName: "requestCombatPreview",
      parentObject: this,
      callback: (data, websocket) => {
        const player = Game.getInstance().getPlayerFromWebsocket(websocket);
        if (this.id !== data["id"] || this.player !== player) return;

        const targetTile = GameMap.getInstance().getTiles()[data["targetX"]]?.[data["targetY"]];
        if (!targetTile) return;

        const preview = this.isRanged() ? this.getRangedPreview(targetTile) : this.getMeleePreview(targetTile);
        if (preview) player.sendNetworkEvent({ event: "combatPreview", ...preview });
      }
    });

    // The owner's client asks which tiles a selected ranged unit can shoot at, to know what a right-click
    // on an enemy means - the range and line of sight are only worked out here.
    ServerEvents.on({
      eventName: "requestRangedTargets",
      parentObject: this,
      callback: (data, websocket) => {
        const player = Game.getInstance().getPlayerFromWebsocket(websocket);
        if (this.id !== data["id"] || this.player !== player) return;

        this.sendRangedTargets({ aiming: false });
      }
    });

    ServerEvents.on({
      eventName: "unitAction",
      parentObject: this,
      callback: (data, websocket) => {
        const unitTile = GameMap.getInstance().getTiles()[data["unitX"]][data["unitY"]];
        const player = Game.getInstance().getPlayerFromWebsocket(websocket);

        if (this.tile !== unitTile || this.id !== data["id"] || this.player !== player) return;

        const action = this.getActionByName(data["actionName"]);
        if (!action || action.isAvailable?.(this) === false) return;

        action.onAction(this);
      }
    });

    ServerEvents.on({
      eventName: "nextTurn",
      parentObject: this,
      callback: (data) => {
        this.workOnImprovement();
        if (this.fortified && this.fortifiedForATurn && !this.actedThisTurn) this.heal();
        this.fortifiedForATurn = this.fortified;
        this.actedThisTurn = false;
        if (this.fortified && this.health >= Combat.MAX_HEALTH) this.setFortified(false);
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

  public static createFromName(
    name: string,
    tile: Tile,
    player: Player,
    options?: { availableMovement?: number }
  ): Unit | undefined {
    const data = Unit.getUnitYMLTypeDataByName(name);
    if (!data) return undefined;

    return new Unit({
      name: data.name,
      tile,
      player,
      attackType: data.attack_type,
      combatStrength: data.combat_strength,
      rangedStrength: data.ranged_strength,
      range: data.range,
      defaultMoveDistance: data.default_move_distance,
      sightRange: data.sight_range,
      isUtility: data.is_utility,
      ignoresTerrainCost: data.ignores_terrain_cost,
      domain: data.domain,
      coastOnly: data.coast_only,
      availableMovement: options?.availableMovement,
      actions: UnitActions.forUnitType(data)
    });
  }

  // Every unit type the config knows about, including ones with no `cost` -
  // callers building a production catalog must filter those out themselves.
  public static getAllUnitData(): UnitYMLTypeData[] {
    return Unit.loadUnitData();
  }

  // Roads cost a third of a move, so movement is kept in exact thirds - otherwise floating point
  // leaves a sliver after three road steps and the unit could keep going.
  public static spendMovement(movement: number, cost: number): number {
    return Math.max(0, Math.round((movement - cost) * 3) / 3);
  }

  // Open water a ship can move onto. Coast-only ships (see coast_only in units.yml) keep off deep ocean.
  public static canSailOnto(tile: Tile, coastOnly: boolean): boolean {
    return tile.isWater() && !(coastOnly && tile.containsTileType("ocean"));
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
    this.actedThisTurn = true;
    this.setFortified(false);
    this.setBuildingImprovement(undefined);

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

    // What a Builder can build depends on the tile it's standing on.
    this.sendActionsToOwner();

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

    // For whatever reacts to a unit arriving somewhere, e.g. a barbarian camp being cleared.
    ServerEvents.call("unitMoved", { unit: this, tile: targetTile });
  }

  /**
   * Moves as far along the shortest path to `targetTile` as this turn's movement allows. Unlike a
   * player's move order nothing is queued for later turns - this is for units the server moves
   * itself (the barbarians), which pick a new destination every turn anyway.
   * @returns Whether the unit moved at all.
   */
  public stepTowards(targetTile: Tile): boolean {
    if (targetTile === this.tile || this.availableMovement <= 0) return false;

    const [arrivedTile, , remainingMovement] = this.getMovementTowardsTargetTile(targetTile);
    if (!arrivedTile || arrivedTile === this.tile) return false;

    this.moveToTile({
      previousTile: this.tile,
      targetTile: arrivedTile,
      remainingTiles: [],
      remainingMovement: remainingMovement
    });

    return true;
  }

  // Only tells the owner - fortifying drives their UI (the action button and the icon over the unit).
  private setFortified(fortified: boolean) {
    if (this.fortified === fortified) return;

    this.fortified = fortified;
    this.fortifiedForATurn = false;
    this.player.sendNetworkEvent({ event: "unitFortified", id: this.id, fortified });
  }

  // Sends turnsLeft along with the name so the owner's unit info can count it down.
  private setBuildingImprovement(improvementName: string | undefined) {
    if (this.buildingImprovement === improvementName) return;

    this.buildingImprovement = improvementName;
    this.sendBuildStatus();
  }

  private sendBuildStatus(extra?: { remainingMovement: number }) {
    this.player.sendNetworkEvent({ event: "unitBuildStatus", id: this.id, ...this.getBuildStatusJSON(), ...extra });
  }

  private getBuildStatusJSON() {
    const improvement = Improvement.getImprovementData(this.buildingImprovement);
    if (!improvement) return { building: undefined, buildingIcon: undefined, turnsLeft: undefined };

    return {
      building: improvement.name,
      buildingIcon: improvement.icon,
      turnsLeft: improvement.build_turns - this.tile.getBuildProgress(improvement.name)
    };
  }

  private workOnImprovement() {
    const improvement = Improvement.getImprovementData(this.buildingImprovement);
    if (!improvement) return;

    // Someone else may have changed the tile since (e.g. settled a city on it).
    if (!Improvement.canBuild(improvement, this.tile, this.player)) {
      this.setBuildingImprovement(undefined);
      this.sendActionsToOwner();
      return;
    }

    const turnsWorked = this.tile.addBuildProgress(improvement.name);
    if (turnsWorked < improvement.build_turns) {
      this.sendBuildStatus();
      return;
    }

    this.tile.clearBuildProgress(improvement.name);
    this.setBuildingImprovement(undefined);
    this.finishImprovement(improvement);
    this.sendActionsToOwner();
  }

  private finishImprovement(improvement: ImprovementData) {
    Improvement.complete(improvement, this.tile);

    GameMap.getInstance().broadcastTileUpdate(this.tile);
    // A worked tile's yields just changed - let its city re-pick which tiles to work.
    this.tile.getCityTerritoryOf()?.updateWorkedTiles({ sendStatUpdate: true });
  }

  private heal() {
    if (this.health >= Combat.MAX_HEALTH) return;

    let amount = Combat.HEAL_ELSEWHERE;
    if (this.tile.getCity()?.getPlayer() === this.player) amount = Combat.HEAL_IN_OWN_CITY;
    else if (this.tile.getCityTerritoryOf()?.getPlayer() === this.player) amount = Combat.HEAL_IN_FRIENDLY_TERRITORY;
    this.health = Math.min(Combat.MAX_HEALTH, this.health + amount);

    this.sendToObservers(this.tile, () => ({ event: "unitHealth", id: this.id, health: this.health }));
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
    // Movement left upon arriving at each tile in traversedTiles, index for index.
    const movementAtTile: number[] = [this.availableMovement];
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

      // Same-type ally units can be walked through, just not stopped on - so only the destination
      // has to be free to stop on, while tiles along the way only need to be passable.
      const isDestination = i + 1 === shortestPath.length - 1;
      if (isDestination ? nextTile.isBlockedFor(this) : nextTile.isImpassableFor(this)) {
        blocked = true;
        break;
      }

      const movementCost = this.getTileWeight(currentTile, nextTile);
      //console.log(
      //  `From (${currentTile.getX()}, ${currentTile.getY()}) to (${nextTile.getX()}, ${nextTile.getY()}) - cost: ${movementCost}`
      //);

      remainingMovement = Unit.spendMovement(remainingMovement, movementCost);
      traversedTiles.push(nextTile);
      movementAtTile.push(remainingMovement);
    }

    // Running out of movement while passing through an ally isn't allowed to leave us stacked on it,
    // so stop at the last tile along the way that we can actually end the move on.
    let arrivedIndex = traversedTiles.length - 1;
    while (arrivedIndex > 0 && traversedTiles[arrivedIndex].isBlockedFor(this)) {
      arrivedIndex--;
    }
    const stoppedTiles = traversedTiles.slice(0, arrivedIndex + 1);

    // Starting from a full turn's movement and still unable to leave our own tile (a chain of allies
    // too long to cross in one turn) means this route would stall forever - treat it as blocked.
    if (arrivedIndex === 0 && traversedTiles.length > 1 && this.availableMovement >= this.defaultMoveDistance) {
      blocked = true;
    }

    // Queuing tiles we're blocked from entering just stalls the unit against the blocker every
    // turn, then walks it into the tile the moment that unit leaves. Drop the rest of the path.
    const remainingTiles: Tile[] = blocked ? [] : shortestPath.filter((tile) => !stoppedTiles.includes(tile));

    return [traversedTiles[arrivedIndex], remainingTiles, movementAtTile[arrivedIndex]];
  }

  // Civ 5 melee: both sides trade damage, and if the defender dies the attacker advances onto its
  // tile. An enemy city is fought instead of whatever stands in it (see meleeAttackCity()). Every
  // other civilization counts as an enemy, since there's no diplomacy yet. Returns whether an attack
  // actually happened.
  public meleeAttack(targetTile: Tile): boolean {
    if (!this.canMeleeAttack(targetTile)) return false;

    this.spendAttack();

    const city = this.getEnemyCity(targetTile);
    if (city) {
      this.meleeAttackCity(city);
      return true;
    }

    const originTile = this.tile;
    const enemies = targetTile.getUnits().filter((unit) => unit.getPlayer() !== this.player);
    const defender = enemies.find((unit) => unit.canFight());

    if (defender) {
      const result = Combat.resolveMelee({
        attackerStrength: Combat.getAttackStrength(this.combatStrength, originTile, targetTile),
        attackerHealth: this.health,
        defenderStrength: Combat.getDefenseStrength(defender.combatStrength, targetTile),
        defenderHealth: defender.health
      });

      this.health = result.attackerHealth;
      defender.health = result.defenderHealth;

      this.broadcastCombat(originTile, defender);

      if (this.health <= 0) {
        this.delete();
        return true;
      }

      // The defender held - both stay where they are.
      if (defender.health > 0) return true;

      defender.delete();
    } else {
      // Nothing here could fight back - the civilians are captured or destroyed below.
      this.player.sendNetworkEvent({
        event: "unitCombat",
        attackerId: this.id,
        attackerHealth: this.health,
        attackerRemainingMovement: this.availableMovement
      });
    }

    const survivors = targetTile.getUnits().filter((unit) => unit.getPlayer() !== this.player);
    if (survivors.some((unit) => unit.canFight())) return true;

    this.overrunTile(originTile, targetTile);
    return true;
  }

  public getMeleePreview(targetTile: Tile) {
    if (!this.canMeleeAttack(targetTile)) return undefined;

    const city = this.getEnemyCity(targetTile);
    if (city) return this.getMeleeCityPreview(city);

    // Like old_java's UnitCombatWindow, there's nothing to preview when nothing can fight back.
    const defender = targetTile.getUnits().find((unit) => unit.getPlayer() !== this.player && unit.canFight());
    if (!defender) return undefined;

    const target = { attackerId: this.id, targetX: targetTile.getX(), targetY: targetTile.getY() };

    return {
      ...target,
      defenderId: defender.id,
      defenderName: defender.name,
      attackerHealth: this.health,
      defenderHealth: defender.health,
      ...Combat.predictMelee({
        attackerBaseStrength: this.combatStrength,
        attackerHealth: this.health,
        defenderBaseStrength: defender.combatStrength,
        defenderHealth: defender.health,
        fromTile: this.tile,
        targetTile
      })
    };
  }

  /**
   * Civ 5 ranged attack: the target takes damage from the attacker's ranged strength against its own
   * (terrain included), the attacker takes none and stays put, and the rest of its turn is spent. A
   * kill just removes the target - nothing advances onto the tile. Returns whether it fired.
   */
  public rangedAttack(targetTile: Tile): boolean {
    if (!this.canRangedAttack(targetTile)) return false;

    this.spendAttack();

    const city = this.getEnemyCity(targetTile);
    if (city) {
      this.rangedAttackCity(city);
      return true;
    }

    const defender = this.getRangedDefender(targetTile);
    const result = Combat.resolveRanged({
      attackerStrength: this.rangedStrength,
      attackerHealth: this.health,
      defenderStrength: Combat.getDefenseStrength(defender.combatStrength, targetTile),
      defenderHealth: defender.health
    });
    defender.health = result.defenderHealth;

    this.broadcastCombat(this.tile, defender, { ranged: true });
    if (defender.health <= 0) defender.delete();

    return true;
  }

  public getRangedPreview(targetTile: Tile) {
    if (!this.canRangedAttack(targetTile)) return undefined;

    const city = this.getEnemyCity(targetTile);
    if (city) return this.getRangedCityPreview(city);

    const defender = this.getRangedDefender(targetTile);

    return {
      attackerId: this.id,
      targetX: targetTile.getX(),
      targetY: targetTile.getY(),
      ranged: true,
      defenderId: defender.id,
      defenderName: defender.name,
      attackerHealth: this.health,
      defenderHealth: defender.health,
      ...Combat.predictRanged({
        attackerRangedStrength: this.rangedStrength,
        attackerHealth: this.health,
        defenderBaseStrength: defender.combatStrength,
        defenderHealth: defender.health,
        targetTile
      })
    };
  }

  // Needs movement left, a visible enemy city or an enemy that can fight back (Civ 5 won't let ranged
  // units shoot lone civilians - those are captured by melee units), and a tile within range and line
  // of sight.
  public canRangedAttack(targetTile: Tile): boolean {
    if (!this.isRanged() || !this.canFight() || this.availableMovement <= 0) return false;
    if (!this.getEnemyCity(targetTile) && !this.getRangedDefender(targetTile)) return false;
    if (!this.player.getVisibility().isVisible(targetTile)) return false;

    return this.getRangedTargetTiles().includes(targetTile);
  }

  /**
   * Every tile this unit could shoot into from where it stands: within its range, and in its line of
   * sight - the same sightlines it sees by, so hills, mountains and woods block shots from lower ground.
   */
  public getRangedTargetTiles(): Tile[] {
    if (!this.isRanged()) return [];

    const map = GameMap.getInstance();
    return map
      .getTilesInRange(this.tile, this.range)
      .filter((tile) => tile !== this.tile && map.hasLineOfSight(this.tile, tile));
  }

  // Tells the owner which tiles this unit can shoot into. `aiming` is set when the player pressed the
  // Ranged Attack action, which has their client highlight the tiles and fire on a left-click.
  public sendRangedTargets(options: { aiming: boolean }) {
    this.player.sendNetworkEvent({
      event: "rangedTargets",
      id: this.id,
      aiming: options.aiming,
      tiles: this.getRangedTargetTiles().map((tile) => ({ x: tile.getX(), y: tile.getY() }))
    });
  }

  public canMeleeAttack(targetTile: Tile): boolean {
    if (this.attackType !== "melee" || !this.canFight() || this.availableMovement <= 0) return false;

    // Land melee only - water units can't move yet, let alone fight.
    if (this.tile.isWater() || targetTile.isWater()) return false;
    if (!this.tile.getAdjacentTiles().includes(targetTile)) return false;

    if (this.getEnemyCity(targetTile)) return true;
    return targetTile.getUnits().some((unit) => unit.getPlayer() !== this.player);
  }

  public isRanged() {
    return this.rangedStrength > 0;
  }

  // "Fortify Until Healed" - the only way a unit heals. It stays put, healing each turn it doesn't move
  // or attack, until it's back to full health or given another order.
  public fortifyUntilHealed() {
    if (!this.canFight() || this.health >= Combat.MAX_HEALTH) return;

    this.clearMovementQueue();
    this.setFortified(true);
  }

  // A Builder starts on an improvement: it stays put and puts a turn into it at every turn's end.
  public startBuilding(improvementName: string) {
    const improvement = Improvement.getImprovementData(improvementName);
    if (!improvement || this.availableMovement <= 0) return;
    if (!Improvement.canBuild(improvement, this.tile, this.player)) return;

    this.clearMovementQueue();
    this.availableMovement = 0;
    this.actedThisTurn = true;
    this.buildingImprovement = improvement.name;
    // Starting work uses up the rest of the turn's movement, so the owner's unit info shows 0.
    this.sendBuildStatus({ remainingMovement: 0 });
    this.sendActionsToOwner();
  }

  // A Work Boat lays down Fishing Boats on the spot, and is used up doing it.
  public buildAndDisband(improvementName: string) {
    const improvement = Improvement.getImprovementData(improvementName);
    if (!improvement || this.availableMovement <= 0) return;
    if (!Improvement.canBuild(improvement, this.tile, this.player)) return;

    this.finishImprovement(improvement);
    this.delete();
  }

  public getBuildingImprovement() {
    return this.buildingImprovement;
  }

  // Only the owner hears about this - it drives their action buttons and unit info window.
  public sendActionsToOwner() {
    this.player.sendNetworkEvent({ event: "unitActions", id: this.id, actions: this.getUnitActionsJSON() });
  }

  public getId() {
    return this.id;
  }

  public getAvailableMovement() {
    return this.availableMovement;
  }

  public hasMovementQueue() {
    return this.queuedMovementTiles.length > 0;
  }

  public isFortified() {
    return this.fortified;
  }

  public canFight() {
    return !this.utility && this.combatStrength > 0;
  }

  public getHealth() {
    return this.health;
  }

  // For damage dealt by something other than a unit, e.g. a city's strike. Doesn't tell any client.
  public setHealth(health: number) {
    this.health = Math.max(0, Math.min(Combat.MAX_HEALTH, health));
  }

  public getName() {
    return this.name;
  }

  public getCombatStrength() {
    return this.combatStrength;
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

  public getDomain(): UnitDomain {
    return this.domain;
  }

  // Whether this unit could ever stand on the tile, whatever is on it. Land units stay off water;
  // sea units stay on it, apart from their owner's coastal cities. Mirrored by the client's Unit.canEnter().
  public canEnter(tile: Tile): boolean {
    if (this.domain === "land") return !tile.isWater();

    const city = tile.getCity();
    if (city) return city.getPlayer() === this.player && tile.isCoastal();

    return Unit.canSailOnto(tile, this.coastOnly);
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
      combatStrength: this.combatStrength,
      rangedStrength: this.rangedStrength,
      range: this.range,
      health: this.health,
      fortified: ownUnit && this.fortified,
      ...(ownUnit ? this.getBuildStatusJSON() : {}),
      isUtility: this.utility,
      ignoresTerrainCost: this.terrainCostIgnored,
      domain: this.domain,
      coastOnly: this.coastOnly,
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
    return this.actions.map(({ name, icon, requirements, desc, isAvailable }) => ({
      name,
      icon,
      requirements,
      desc,
      available: isAvailable?.(this) ?? true
    }));
  }

  public getTileWeight(current: Tile, neighbor: Tile) {
    if (!neighbor) return current.getMovementCost();
    if (!this.canEnter(neighbor)) return 9999;

    // Pathing may route through same-type allies; whether the goal itself is free is checked by the caller.
    if (neighbor.isImpassableFor(this)) {
      return 9999;
    }

    // Entering a same-type ally's tile with our whole turn's movement would still leave us stopped on
    // it, which isn't allowed - so we could never get past it. Route around instead.
    if (neighbor.isBlockedFor(this) && Tile.getWeight(current, neighbor, this) >= this.defaultMoveDistance) {
      return 9999;
    }

    // Open water costs a move a tile - hills, forests and rivers are for land units.
    if (this.domain === "sea") return 1;

    return Tile.getWeight(current, neighbor, this);
  }

  public getTargetQueuedTile() {
    if (this.queuedMovementTiles.length < 1) return undefined;

    return this.queuedMovementTiles[this.queuedMovementTiles.length - 1];
  }

  // Attacking uses up the rest of the turn, and breaks off whatever the unit was doing.
  private spendAttack() {
    this.availableMovement = 0;
    this.actedThisTurn = true;
    this.setFortified(false);
    this.clearMovementQueue();
  }

  private getEnemyCity(tile: Tile): City | undefined {
    const city = tile.getCity();
    return city && city.getPlayer() !== this.player ? city : undefined;
  }

  // Civ 5 melee against a city: the city fights back with its own strength, and if it's brought to
  // 0 HP the attacker (should it survive) marches in and captures it.
  private meleeAttackCity(city: City) {
    const originTile = this.tile;
    const targetTile = city.getTile();

    const result = Combat.resolveMelee({
      attackerStrength: Combat.getAttackStrength(this.combatStrength, originTile, targetTile),
      attackerHealth: this.health,
      defenderStrength: city.getCombatStrength(),
      defenderHealth: city.getHealth(),
      defenderIsCity: true
    });
    this.health = result.attackerHealth;
    city.setHealth(result.defenderHealth);

    this.broadcastCityCombat(originTile, city, { ranged: false });

    if (this.health <= 0) {
      this.delete();
      return;
    }
    if (city.getHealth() > 0) return;

    // Whatever was left inside is destroyed or captured along with the city.
    city.captureBy(this.player);
    this.overrunTile(originTile, targetTile);
  }

  // Ranged units can batter a city down, but never below 1 HP - only a melee unit can take it.
  private rangedAttackCity(city: City) {
    const result = Combat.resolveRanged({
      attackerStrength: this.rangedStrength,
      attackerHealth: this.health,
      defenderStrength: city.getCombatStrength(),
      defenderHealth: city.getHealth(),
      minDefenderHealth: 1
    });
    city.setHealth(result.defenderHealth);

    this.broadcastCityCombat(this.tile, city, { ranged: true });
  }

  private getMeleeCityPreview(city: City) {
    return {
      attackerId: this.id,
      targetX: city.getTile().getX(),
      targetY: city.getTile().getY(),
      defenderCity: city.getName(),
      attackerHealth: this.health,
      defenderHealth: city.getHealth(),
      defenderMaxHealth: city.getMaxHealth(),
      ...Combat.predictMelee({
        attackerBaseStrength: this.combatStrength,
        attackerHealth: this.health,
        defenderBaseStrength: city.getBaseStrength(),
        defenderHealth: city.getHealth(),
        fromTile: this.tile,
        targetTile: city.getTile(),
        defenderModifiers: city.getDefenseModifiers(),
        defenderIsCity: true
      })
    };
  }

  private getRangedCityPreview(city: City) {
    return {
      attackerId: this.id,
      targetX: city.getTile().getX(),
      targetY: city.getTile().getY(),
      ranged: true,
      defenderCity: city.getName(),
      attackerHealth: this.health,
      defenderHealth: city.getHealth(),
      defenderMaxHealth: city.getMaxHealth(),
      ...Combat.predictRanged({
        attackerRangedStrength: this.rangedStrength,
        attackerHealth: this.health,
        defenderBaseStrength: city.getBaseStrength(),
        defenderHealth: city.getHealth(),
        targetTile: city.getTile(),
        defenderModifiers: city.getDefenseModifiers(),
        minDefenderHealth: 1
      })
    };
  }

  // The melee attacker moves onto a tile nothing can defend any more. Enemy units left there are
  // destroyed, except civilians that Civ 5 captures: they change hands where they stood, and can't
  // move until the next turn.
  private overrunTile(originTile: Tile, targetTile: Tile) {
    const survivors = targetTile.getUnits().filter((unit) => unit.getPlayer() !== this.player);
    const capturedTypes = survivors
      .map((unit) => Unit.getUnitYMLTypeDataByName(unit.name)?.captured_as)
      .filter((capturedAs) => capturedAs !== undefined);
    survivors.forEach((unit) => unit.delete());

    this.moveToTile({
      previousTile: originTile,
      targetTile: targetTile,
      remainingTiles: [],
      remainingMovement: 0
    });

    for (const capturedAs of capturedTypes) {
      targetTile.addUnit(Unit.createFromName(capturedAs, targetTile, this.player, { availableMovement: 0 }));
    }
  }

  // Like broadcastCombat(), for a fight with a city: the city's side is its name and new health.
  private broadcastCityCombat(originTile: Tile, city: City, options: { ranged: boolean }) {
    const combatPacket = {
      event: "unitCombat",
      attackerId: this.id,
      attackerHealth: this.health,
      attackerRemainingMovement: this.availableMovement,
      defenderCity: city.getName(),
      defenderCityHealth: city.getHealth(),
      ranged: options.ranged
    };

    Game.getInstance()
      .getPlayers()
      .forEach((player) => {
        const visibility = player.getVisibility();
        if (!visibility.isVisible(originTile) && !visibility.isVisible(city.getTile())) return;

        player.sendNetworkEvent(combatPacket);
      });
  }

  private getRangedDefender(targetTile: Tile): Unit | undefined {
    return targetTile.getUnits().find((unit) => unit.getPlayer() !== this.player && unit.canFight());
  }

  // Tells everyone who can see either end of a fight how it went. `ranged` lets clients show only the
  // defender taking damage.
  private broadcastCombat(originTile: Tile, defender: Unit, options?: { ranged: boolean }) {
    const combatPacket = {
      event: "unitCombat",
      attackerId: this.id,
      attackerHealth: this.health,
      attackerRemainingMovement: this.availableMovement,
      defenderId: defender.id,
      defenderHealth: defender.health,
      ranged: options?.ranged ?? false
    };

    Game.getInstance()
      .getPlayers()
      .forEach((player) => {
        const visibility = player.getVisibility();
        if (!visibility.isVisible(originTile) && !visibility.isVisible(defender.tile)) return;

        player.sendNetworkEvent(combatPacket);
      });
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
