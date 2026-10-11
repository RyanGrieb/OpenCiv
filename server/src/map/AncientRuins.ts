import random from "random";
import { ServerEvents } from "../Events";
import { Barbarians } from "../barbarian/Barbarians";
import { Unit } from "../unit/Unit";
import { ConfigLoader } from "../util/ConfigLoader";
import { GameMap } from "./GameMap";
import { Tile } from "./Tile";

// Matches server/config/ancient_ruins.yml
export interface AncientRuinsConfig {
  land_tiles_per_ruin: number;
  min_distance_from_players: number;
  min_distance_between_ruins: number;
  gold_reward: number;
}

/**
 * Civ 5's ancient ruins: scattered over open land at game start, away from where everyone begins.
 * The first civilization unit, military or civilian, to end a move on one explores it - the ruins
 * disappear and its owner gets gold. Barbarians walk over them without effect.
 */
export class AncientRuins {
  public static readonly TILE_TYPE = "ancient_ruins";

  private static instance: AncientRuins | undefined;

  private constructor() {
    ServerEvents.on({
      eventName: "unitMoved",
      parentObject: this,
      callback: (data) => {
        this.onUnitMoved(data["unit"], data["tile"]);
      }
    });
  }

  /** Sets up ruins for a new game and scatters them. Call once every player has their starting units. */
  public static init() {
    AncientRuins.instance = new AncientRuins();
    AncientRuins.instance.placeInitialRuins();
  }

  public static getInstance(): AncientRuins | undefined {
    return AncientRuins.instance;
  }

  public static destroyInstance() {
    AncientRuins.instance = undefined;
  }

  public static getConfig(): AncientRuinsConfig {
    return ConfigLoader.load<AncientRuinsConfig>("./config/ancient_ruins.yml");
  }

  /** How many ruins go out at game start, scaled to how much land there is. */
  public getRuinCount(): number {
    let landTiles = 0;
    for (const column of GameMap.getInstance().getTiles()) {
      for (const tile of column) {
        if (!tile.isWater()) landTiles++;
      }
    }

    return Math.max(1, Math.floor(landTiles / AncientRuins.getConfig().land_tiles_per_ruin));
  }

  /**
   * Whether ruins may go on this tile: walkable land with no resource, city, camp or unit on it,
   * far enough from every unit and city, and from other ruins.
   */
  public canPlaceRuins(tile: Tile): boolean {
    const config = AncientRuins.getConfig();

    if (tile.isWater() || tile.getMovementCost() >= 9999) return false;
    if (tile.containsTileType(AncientRuins.TILE_TYPE) || tile.containsTileType(Barbarians.CAMP_TILE_TYPE)) return false;
    if (tile.getResource() || tile.getCity() || tile.getCityTerritoryOf()) return false;
    if (tile.getUnits().length > 0) return false;

    const gameMap = GameMap.getInstance();

    for (const nearbyTile of gameMap.getTilesInRange(tile, config.min_distance_between_ruins - 1)) {
      if (nearbyTile.containsTileType(AncientRuins.TILE_TYPE)) return false;
    }

    for (const nearbyTile of gameMap.getTilesInRange(tile, config.min_distance_from_players - 1)) {
      if (nearbyTile.getCity() || nearbyTile.getUnits().length > 0) return false;
    }

    return true;
  }

  /**
   * Places ruins on a random tile where canPlaceRuins() allows them.
   * @returns The tile, or undefined if there's nowhere left to put any.
   */
  public placeRuins(): Tile | undefined {
    const candidates = this.findRuinSites();
    if (candidates.length < 1) return undefined;

    const tile = candidates[random.int(0, candidates.length - 1)];
    tile.addTileType(AncientRuins.TILE_TYPE);

    return tile;
  }

  // Every tile canPlaceRuins() allows ruins on.
  private findRuinSites(): Tile[] {
    const sites: Tile[] = [];
    for (const column of GameMap.getInstance().getTiles()) {
      for (const tile of column) {
        if (this.canPlaceRuins(tile)) sites.push(tile);
      }
    }
    return sites;
  }

  // Before the first turn, so the ruins reach clients with the rest of the map.
  private placeInitialRuins() {
    const count = this.getRuinCount();
    const spacing = AncientRuins.getConfig().min_distance_between_ruins - 1;

    // Checks every tile once rather than once per ruin: a new ruin only rules out the sites too close
    // to it, so those are all that need dropping before picking the next one.
    let sites = this.findRuinSites();
    let placed = 0;
    while (placed < count && sites.length > 0) {
      const tile = sites[random.int(0, sites.length - 1)];
      tile.addTileType(AncientRuins.TILE_TYPE);
      placed++;

      const tooClose = new Set(GameMap.getInstance().getTilesInRange(tile, spacing));
      sites = sites.filter((site) => !tooClose.has(site));
    }

    console.log(`[AncientRuins] Placed ${placed} ruins`);
  }

  private onUnitMoved(unit: Unit, tile: Tile) {
    if (!tile.containsTileType(AncientRuins.TILE_TYPE)) return;
    if (unit.getPlayer() === Barbarians.getInstance()?.getPlayer()) return;

    tile.removeTileType(AncientRuins.TILE_TYPE);
    GameMap.getInstance().resendTileToObservers(tile);

    const reward = AncientRuins.getConfig().gold_reward;
    const player = unit.getPlayer();
    player.addToAccumulatedStat("gold", reward);
    player
      .getNotifications()
      .addMessage("TILE_ANCIENT_RUINS", `Your ${unit.getName()} explored ancient ruins and found ${reward} gold!`);

    console.log(`[AncientRuins] ${player.getName()} explored the ruins at (${tile.getX()}, ${tile.getY()})`);
  }
}
