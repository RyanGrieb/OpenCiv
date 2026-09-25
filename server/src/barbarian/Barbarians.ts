import random from "random";
import { ServerEvents } from "../Events";
import { Game } from "../Game";
import { Player } from "../Player";
import { GameMap } from "../map/GameMap";
import { PlayerVisibility } from "../map/PlayerVisibility";
import { Tile } from "../map/Tile";
import { Unit } from "../unit/Unit";
import { ConfigLoader } from "../util/ConfigLoader";

// Matches server/config/barbarians.yml
export interface BarbarianConfig {
  civ: Record<string, any>;
  camps: {
    land_tiles_per_camp: number;
    initial_share: number;
    new_camp_chance: number;
    min_distance_from_players: number;
    min_distance_between_camps: number;
    clear_reward_gold: number;
  };
  spawning: {
    turns_between_spawns: [number, number];
    max_roaming_units_per_camp: number;
    aggro_range: number;
  };
  units: { name: string; required_tech?: string }[];
}

export interface BarbarianCamp {
  tile: Tile;
  // Stays on the camp tile. Until combat can kill it, this is what keeps a camp from being cleared.
  defender?: Unit;
  roamingUnits: Unit[];
  turnsUntilSpawn: number;
}

/**
 * The barbarians: a player the server runs itself, with no client behind it. Camps appear in
 * unexplored land away from every civilization, each guarded by a unit standing on it, and send
 * out a new unit every several turns. Those roam the map and close in on any civilization's units
 * or cities they come near. A military unit that walks into an unguarded camp destroys it for gold.
 *
 * Only exists while the allowBarbarians game option is on - see InGameState.
 */
export class Barbarians {
  public static readonly CAMP_TILE_TYPE = "barbarian_camp";

  private static instance: Barbarians | undefined;

  private player: Player;
  private camps: BarbarianCamp[];

  private constructor() {
    const config = Barbarians.getConfig();

    this.player = new Player(config.civ.name);
    this.player.setCivilizationData(config.civ);
    this.camps = [];

    ServerEvents.on({
      eventName: "unitMoved",
      parentObject: this,
      callback: (data) => {
        this.onUnitMoved(data["unit"], data["tile"]);
      }
    });
  }

  /** Sets up the barbarians for a new game and places its starting camps. Call once the map exists. */
  public static init() {
    Barbarians.instance = new Barbarians();
    Barbarians.instance.placeInitialCamps();
  }

  public static getInstance(): Barbarians | undefined {
    return Barbarians.instance;
  }

  public static destroyInstance() {
    Barbarians.instance = undefined;
  }

  public static getConfig(): BarbarianConfig {
    return ConfigLoader.load<BarbarianConfig>("./config/barbarians.yml");
  }

  private static rollSpawnDelay(): number {
    const [min, max] = Barbarians.getConfig().spawning.turns_between_spawns;
    return random.int(min, max);
  }

  private static canStandOn(unit: Unit, tile: Tile): boolean {
    return !tile.isWater() && tile.getMovementCost() < 9999 && !tile.hasBlockingUnit(unit);
  }

  public getPlayer() {
    return this.player;
  }

  public getCamps() {
    return this.camps;
  }

  public getCampAt(tile: Tile): BarbarianCamp | undefined {
    return this.camps.find((camp) => camp.tile === tile);
  }

  /** The most camps the map holds at once, scaled to how much land there is. */
  public getMaxCamps(): number {
    let landTiles = 0;
    for (const column of GameMap.getInstance().getTiles()) {
      for (const tile of column) {
        if (!tile.isWater()) landTiles++;
      }
    }

    return Math.max(1, Math.floor(landTiles / Barbarians.getConfig().camps.land_tiles_per_camp));
  }

  /**
   * Runs the barbarians' side of a turn: maybe a new camp, camps sending out units, then every
   * roaming unit moving. Called after the "nextTurn" event, so every unit's movement is already
   * back to full.
   */
  public playTurn() {
    const config = Barbarians.getConfig();

    if (this.camps.length < this.getMaxCamps() && random.float() < config.camps.new_camp_chance) {
      this.placeCamp();
    }

    for (const camp of this.camps) {
      this.pruneLostUnits(camp);

      camp.turnsUntilSpawn--;
      if (camp.turnsUntilSpawn > 0) continue;

      this.spawnUnit(camp);
      camp.turnsUntilSpawn = Barbarians.rollSpawnDelay();
    }

    const defenders = new Set(this.camps.map((camp) => camp.defender));
    for (const unit of [...this.player.getUnits()]) {
      if (defenders.has(unit)) continue;

      this.moveRoamingUnit(unit);
    }
  }

  /**
   * Places a camp on a random tile where canPlaceCamp() allows one, along with its defender.
   * @param announce Whether to resend the tile to players who can see it. Off for the starting camps,
   * which reach clients with the rest of the map - and a tile sent before its map would be lost.
   * @returns The new camp, or undefined if there's nowhere left to put one.
   */
  public placeCamp(announce = true): BarbarianCamp | undefined {
    const candidates: Tile[] = [];
    for (const column of GameMap.getInstance().getTiles()) {
      for (const tile of column) {
        if (this.canPlaceCamp(tile)) candidates.push(tile);
      }
    }

    if (candidates.length < 1) return undefined;

    const tile = candidates[random.int(0, candidates.length - 1)];
    tile.addTileType(Barbarians.CAMP_TILE_TYPE);

    const camp: BarbarianCamp = { tile, roamingUnits: [], turnsUntilSpawn: Barbarians.rollSpawnDelay() };
    this.camps.push(camp);

    // Camps appear in the fog, so normally nobody is watching - but with the map revealed everyone is.
    if (announce) this.resendTileToObservers(tile);

    camp.defender = this.createUnit(tile);
    console.log(`[Barbarians] Camp placed at (${tile.getX()}, ${tile.getY()})`);

    return camp;
  }

  /**
   * Whether a new camp may go on this tile: open land nobody owns or stands on, out of every
   * civilization's sight, and far enough from their units, cities and the other camps.
   */
  public canPlaceCamp(tile: Tile): boolean {
    const config = Barbarians.getConfig().camps;

    if (tile.isWater() || tile.getMovementCost() >= 9999) return false;
    if (tile.containsTileType(Barbarians.CAMP_TILE_TYPE) || tile.getCity() || tile.getCityTerritoryOf()) return false;
    if (tile.getUnits().length > 0) return false;

    // Somewhere for the camp's units to step out onto.
    const walkableNeighbors = tile
      .getAdjacentTiles()
      .filter((adjTile) => adjTile && !adjTile.isWater() && adjTile.getMovementCost() < 9999);
    if (walkableNeighbors.length < 2) return false;

    const gameMap = GameMap.getInstance();

    for (const nearbyTile of gameMap.getTilesInRange(tile, config.min_distance_between_camps - 1)) {
      if (nearbyTile.containsTileType(Barbarians.CAMP_TILE_TYPE)) return false;
    }

    for (const nearbyTile of gameMap.getTilesInRange(tile, config.min_distance_from_players - 1)) {
      if (nearbyTile.getCity() || nearbyTile.getUnits().some((unit) => unit.getPlayer() !== this.player)) {
        return false;
      }
    }

    if (!PlayerVisibility.mapRevealed()) {
      for (const player of Game.getInstance().getPlayers().values()) {
        if (player.getVisibility().isVisible(tile)) return false;
      }
    }

    return true;
  }

  /** The strongest unit in barbarians.yml whose tech at least half of the players know. */
  public getSpawnUnitName(): string {
    const units = Barbarians.getConfig().units;
    const players = Array.from(Game.getInstance().getPlayers().values());

    for (let i = units.length - 1; i > 0; i--) {
      const requiredTech = units[i].required_tech;
      if (!requiredTech) return units[i].name;

      const playersWithTech = players.filter((player) => player.hasResearchedTech(requiredTech)).length;
      if (players.length > 0 && playersWithTech * 2 >= players.length) return units[i].name;
    }

    return units[0].name;
  }

  // A camp goes out at game start for every other slot, the rest turn up over the game.
  private placeInitialCamps() {
    const initialCamps = Math.max(1, Math.round(this.getMaxCamps() * Barbarians.getConfig().camps.initial_share));

    for (let i = 0; i < initialCamps; i++) {
      if (!this.placeCamp(false)) break;
    }
  }

  // Forgets units that no longer exist (killed, once combat can do that).
  private pruneLostUnits(camp: BarbarianCamp) {
    const aliveUnits = this.player.getUnits();

    if (camp.defender && !aliveUnits.includes(camp.defender)) {
      camp.defender = undefined;
    }
    camp.roamingUnits = camp.roamingUnits.filter((unit) => aliveUnits.includes(unit));
  }

  // A camp without a defender gets one back first; otherwise the new unit steps out next to the camp.
  private spawnUnit(camp: BarbarianCamp) {
    if (!camp.defender) {
      if (!camp.tile.canPlaceUnit(this.player, false)) return;

      camp.defender = this.createUnit(camp.tile);
      return;
    }

    if (camp.roamingUnits.length >= Barbarians.getConfig().spawning.max_roaming_units_per_camp) return;

    const spawnTile = camp.tile
      .getAdjacentTiles()
      .find(
        (tile) => tile && !tile.isWater() && tile.getMovementCost() < 9999 && tile.canPlaceUnit(this.player, false)
      );
    if (!spawnTile) return;

    const unit = this.createUnit(spawnTile);
    if (unit) camp.roamingUnits.push(unit);
  }

  private createUnit(tile: Tile): Unit | undefined {
    const unit = Unit.createFromName(this.getSpawnUnitName(), tile, this.player);
    if (unit) tile.addUnit(unit);

    return unit;
  }

  // Closes in on the nearest civilization's unit or city within aggro range, stopping next to it -
  // attacking waits on combat. With nothing in range, wanders to a random neighboring tile.
  private moveRoamingUnit(unit: Unit) {
    const unitTile = unit.getTile();
    const aggroTiles = GameMap.getInstance().getTilesInRange(unitTile, Barbarians.getConfig().spawning.aggro_range);

    // getTilesInRange() walks outward ring by ring, so the first match is the closest one.
    const targetTile = aggroTiles.find(
      (tile) => tile.getCity() || tile.getUnits().some((other) => other.getPlayer() !== this.player)
    );

    if (targetTile) {
      if (unitTile.getAdjacentTiles().includes(targetTile)) return;

      const approachTile = targetTile
        .getAdjacentTiles()
        .filter((tile) => tile && Barbarians.canStandOn(unit, tile))
        .sort((a, b) => Tile.gridDistance(a, unitTile) - Tile.gridDistance(b, unitTile))[0];

      if (approachTile) unit.stepTowards(approachTile);
      return;
    }

    const wanderTiles = unitTile.getAdjacentTiles().filter((tile) => tile && Barbarians.canStandOn(unit, tile));
    if (wanderTiles.length < 1) return;

    unit.stepTowards(wanderTiles[random.int(0, wanderTiles.length - 1)]);
  }

  // A civilization's military unit arriving on a camp means nothing was left defending it.
  private onUnitMoved(unit: Unit, tile: Tile) {
    const camp = this.getCampAt(tile);
    if (!camp || unit.getPlayer() === this.player || unit.isUtility()) return;
    if (tile.getUnits().some((other) => other.getPlayer() === this.player)) return;

    this.removeCamp(camp);

    const reward = Barbarians.getConfig().camps.clear_reward_gold;
    unit.getPlayer().addToAccumulatedStat("gold", reward);
    console.log(`[Barbarians] ${unit.getPlayer().getName()} cleared the camp at (${tile.getX()}, ${tile.getY()})`);
  }

  // The camp's roaming units carry on without it.
  private removeCamp(camp: BarbarianCamp) {
    this.camps = this.camps.filter((existingCamp) => existingCamp !== camp);
    camp.tile.removeTileType(Barbarians.CAMP_TILE_TYPE);
    this.resendTileToObservers(camp.tile);
  }

  // Resending a tile is how a client picks up a change to its tile types - see GameMap.sendTilesToPlayer().
  private resendTileToObservers(tile: Tile) {
    const gameMap = GameMap.getInstance();

    Game.getInstance()
      .getPlayers()
      .forEach((player) => {
        if (player.getVisibility().isVisible(tile)) {
          gameMap.sendTilesToPlayer(player, [tile]);
        }
      });
  }
}
