import { PlayerDiplomacy } from "../diplomacy/PlayerDiplomacy";
import { GameMap } from "../map/GameMap";
import { Improvement } from "../map/Improvement";
import type { StatEntry, Tile, YieldSource } from "../map/Tile";
import type { Player } from "../Player";
import { TechEffects } from "../research/TechEffects";
import type { CombatModifier } from "../unit/Combat";
import type { Unit, UnitYMLTypeData } from "../unit/Unit";
import type { Building } from "./Building";
import type { City, CityStats } from "./City";

// Extra yields a building gives some of its city's tiles.
export interface TileYieldEffect {
  // "sea" for coast and ocean (not lakes), or any tile type, e.g. "desert" or "jungle".
  terrain?: string;
  // Tiles with one of these resources, improved or not.
  resources?: string[];
  // Tile types that rule a tile out, e.g. Petra skips desert floodplains.
  except?: string[];
  stats: Record<string, number>;
}

// Faster production of some units in the city, e.g. Stables for mounted units.
export interface UnitProductionEffect {
  percent: number;
  // How the tooltip names the units, e.g. "mounted units".
  label: string;
  // Either the units by name, or every land unit that can fight.
  units?: string[];
  land_military?: boolean;
}

// Experience or promotions for units trained in the city, e.g. the Barracks' 15 XP.
export interface TrainedUnitEffect {
  // Only land units, rather than every unit that can fight.
  land_only?: boolean;
}

/**
 * Civ 5's building and wonder effects beyond flat yields, as buildings.yml's `effects` gives them. Each
 * applies only in the building's own city unless its name says otherwise ("empire", or something about
 * units, which follow their owner).
 */
export interface BuildingEffectsData {
  // Percent added to the city's yield, e.g. Market's +25% Gold.
  yield_percent?: Record<string, number>;
  // Percent added to that yield in every one of the owner's cities, e.g. Temple of Artemis's +10% Food.
  empire_yield_percent?: Record<string, number>;
  // Yield per citizen, rounded down for the city, e.g. Library's 0.5 Science (1 per 2 citizens).
  yields_per_citizen?: Record<string, number>;
  tile_yields?: TileYieldEffect[];
  unit_production?: UnitProductionEffect;
  // Share of the food needed to grow that the city keeps once it grows (Aqueduct).
  food_kept_percent?: number;
  // Techs the owner gets for free once it's built.
  free_techs?: number;
  // Units that appear around the city once it's built.
  free_units?: string[];
  // A building the city gets for free once it's built, e.g. Alhambra's Castle.
  free_building?: string;
  // Terracotta Army: one more of each land unit type that can fight that the owner has.
  copy_land_units?: boolean;
  // The owner's Builders finish improvements this much faster.
  builder_speed_percent?: number;
  // Extra movement and sight for the owner's ships.
  naval_movement?: number;
  naval_sight?: number;
  // Combat strength for the owner's units fighting inside the owner's borders.
  friendly_territory_combat_percent?: number;
  // Combat strength for the owner's units attacking a city.
  city_attack_percent?: number;
  // Percent added to the culture each city needs for its next border tile (negative is cheaper).
  border_cost_percent?: number;
  // Extra movement an enemy land unit spends on each tile of the owner's territory.
  enemy_movement_cost?: number;
  // Experience units trained in the city start with (Barracks).
  trained_unit_experience?: TrainedUnitEffect & { amount: number };
  // Promotions units trained in the city start with (Alhambra's Drill I).
  trained_unit_promotions?: TrainedUnitEffect & { promotions: string[] };
}

type NumberEffect =
  | "builder_speed_percent"
  | "naval_movement"
  | "naval_sight"
  | "friendly_territory_combat_percent"
  | "city_attack_percent"
  | "border_cost_percent"
  | "enemy_movement_cost";

/** Applies buildings.yml's `effects` (see BuildingEffectsData) wherever in the game each one matters. */
export class BuildingEffects {
  // The yields a percentage can touch. Defense and happiness never scale.
  private static readonly SCALED_YIELDS = ["food", "production", "gold", "science", "culture", "faith"] as const;

  // The extra yields the buildings of the city whose territory this is give the tile.
  public static getTileBonuses(tile: Tile): StatEntry[] {
    return BuildingEffects.getTileBonusSources(tile).flatMap((source) => source.stats);
  }

  // The same bonuses, each under the name of the building that gives it.
  public static getTileBonusSources(tile: Tile): YieldSource[] {
    const city = tile.getCityTerritoryOf();
    if (!city) return [];

    return city.getBuildings().flatMap((building) =>
      (building.getEffects().tile_yields ?? [])
        .filter((effect) => BuildingEffects.tileMatches(effect, tile, city.getPlayer()))
        .map((effect) => ({
          source: building.getName(),
          stats: Object.entries(effect.stats).map(([stat, value]) => ({ [stat]: value }) as StatEntry)
        }))
    );
  }

  /**
   * Adds the city's per-citizen yields, then scales its yields by its own buildings' percentages and
   * every empire-wide one its owner has. Food only scales a surplus, as in Civ 5. Rounded down.
   */
  public static applyToCityStats(city: City, stats: CityStats) {
    const own = city.getBuildings().map((building) => building.getEffects());
    const empire = BuildingEffects.getEmpireEffects(city.getPlayer());

    for (const yieldName of BuildingEffects.SCALED_YIELDS) {
      const perCitizen = own.reduce((total, effects) => total + (effects.yields_per_citizen?.[yieldName] ?? 0), 0);
      stats[yieldName] += Math.floor(perCitizen * city.getPopulation());

      const percent =
        own.reduce((total, effects) => total + (effects.yield_percent?.[yieldName] ?? 0), 0) +
        empire.reduce((total, effects) => total + (effects.empire_yield_percent?.[yieldName] ?? 0), 0);
      if (percent === 0 || stats[yieldName] <= 0) continue;

      stats[yieldName] = Math.floor((stats[yieldName] * (100 + percent)) / 100);
    }
  }

  // Percent the city's buildings add to its production of the unit (Stables, Forge).
  public static getUnitProductionPercent(city: City, unit: UnitYMLTypeData | undefined): number {
    if (!unit) return 0;

    return city
      .getBuildings()
      .map((building) => building.getEffects().unit_production)
      .filter((effect) => effect && BuildingEffects.unitMatches(effect, unit))
      .reduce((total, effect) => total + effect.percent, 0);
  }

  public static getFoodKeptPercent(city: City): number {
    return city.getBuildings().reduce((total, building) => total + (building.getEffects().food_kept_percent ?? 0), 0);
  }

  // The culture the next border tile costs, once the owner's wonders have had their say (Angkor Wat).
  public static getBorderCost(baseCost: number, player: Player): number {
    const percent = BuildingEffects.sumEmpire(player, "border_cost_percent");
    return Math.max(1, Math.round((baseCost * (100 + percent)) / 100));
  }

  // Turns an improvement takes the player's Builders: Civ 5's Pyramids work at 125% speed.
  public static getBuildTurns(baseTurns: number, player: Player): number {
    const percent = BuildingEffects.sumEmpire(player, "builder_speed_percent");
    return Math.max(1, Math.ceil((baseTurns * 100) / (100 + percent)));
  }

  public static getNavalMovementBonus(player: Player): number {
    return BuildingEffects.sumEmpire(player, "naval_movement");
  }

  public static getNavalSightBonus(player: Player): number {
    return BuildingEffects.sumEmpire(player, "naval_sight");
  }

  // Himeji Castle's bonus, for a unit of `player`'s fighting on `tile` inside their own borders.
  public static getTerritoryCombatModifiers(player: Player, tile: Tile): CombatModifier[] {
    if (tile.getCityTerritoryOf()?.getPlayer() !== player) return [];

    return BuildingEffects.getModifiers(player, "friendly_territory_combat_percent");
  }

  // Statue of Zeus's bonus, for a unit of `player`'s attacking a city.
  public static getCityAttackModifiers(player: Player): CombatModifier[] {
    return BuildingEffects.getModifiers(player, "city_attack_percent");
  }

  // The Great Wall: the extra movement `unit` spends entering `tile`, if an enemy that owns it built one.
  public static getEnemyMovementCost(tile: Tile, unit: Unit): number {
    if (unit.getDomain() !== "land") return 0;

    const owner = tile.getCityTerritoryOf()?.getPlayer();
    if (!owner || !PlayerDiplomacy.areAtWar(owner, unit.getPlayer())) return 0;

    return BuildingEffects.sumEmpire(owner, "enemy_movement_cost");
  }

  /**
   * The one-off effects of finishing `building` in `city`: free techs, units and buildings. Also resends
   * the tiles its tile bonuses change, and the owner's ships if it changes their movement.
   */
  public static onBuilt(city: City, building: Building) {
    const effects = building.getEffects();
    const player = city.getPlayer();

    for (let tech = 0; tech < (effects.free_techs ?? 0); tech++) player.grantFreeTech(building.getName());
    (effects.free_units ?? []).forEach((unitName) => city.grantFreeUnit(unitName));
    if (effects.copy_land_units) BuildingEffects.copyLandUnits(city);
    if (effects.free_building && !city.hasBuilding(effects.free_building)) city.addBuilding(effects.free_building);

    if (effects.tile_yields) GameMap.getInstance().sendTilesToPlayer(player, city.getTerritory());
    if (effects.naval_movement || effects.naval_sight) BuildingEffects.refreshShips(player);
  }

  // A unit `city` just trained or bought starts with the experience and promotions its buildings give.
  public static applyToTrainedUnit(city: City, unit: Unit) {
    if (!unit.canFight()) return;

    const matches = (effect: TrainedUnitEffect) => !effect.land_only || unit.getDomain() === "land";
    const effects = city.getBuildings().map((building) => building.getEffects());

    effects
      .map((effect) => effect.trained_unit_promotions)
      .filter((effect) => effect && matches(effect))
      .flatMap((effect) => effect.promotions)
      .forEach((promotion) => unit.grantPromotion(promotion));

    const experience = effects
      .map((effect) => effect.trained_unit_experience)
      .filter((effect) => effect && matches(effect))
      .reduce((total, effect) => total + effect.amount, 0);
    if (experience > 0) unit.gainExperience(experience);
  }

  private static tileMatches(effect: TileYieldEffect, tile: Tile, owner: Player): boolean {
    if (effect.except?.some((type) => tile.containsTileType(type))) return false;
    if (effect.terrain && !BuildingEffects.isTerrain(tile, effect.terrain)) return false;
    if (!effect.resources) return true;

    const resource = tile.getResource() ?? Improvement.getImprovedResource(tile);
    return !!resource && effect.resources.includes(resource) && !TechEffects.isResourceHidden(resource, owner);
  }

  private static isTerrain(tile: Tile, terrain: string): boolean {
    if (terrain === "sea") return tile.containsTileTypes(["ocean", "shallow_ocean"]);
    return tile.containsTileType(terrain);
  }

  private static unitMatches(effect: UnitProductionEffect, unit: UnitYMLTypeData): boolean {
    if (effect.units) return effect.units.includes(unit.name);

    const landMilitary = (unit.domain ?? "land") === "land" && (unit.combat_strength ?? 0) > 0;
    return !!effect.land_military && landMilitary;
  }

  private static getEmpireEffects(player: Player): BuildingEffectsData[] {
    return player.getCities().flatMap((city) => city.getBuildings().map((building) => building.getEffects()));
  }

  private static sumEmpire(player: Player, effect: NumberEffect): number {
    return BuildingEffects.getEmpireEffects(player).reduce((total, effects) => total + (effects[effect] ?? 0), 0);
  }

  // One modifier per building with the effect, labeled with its name for the attack screen.
  private static getModifiers(player: Player, effect: NumberEffect): CombatModifier[] {
    return player
      .getCities()
      .flatMap((city) => city.getBuildings())
      .filter((building) => building.getEffects()[effect])
      .map((building) => ({ label: building.getName(), value: building.getEffects()[effect] / 100 }));
  }

  private static copyLandUnits(city: City) {
    const unitNames = city
      .getPlayer()
      .getUnits()
      .filter((unit) => unit.getDomain() === "land" && unit.canFight())
      .map((unit) => unit.getName());

    new Set(unitNames).forEach((unitName) => city.grantFreeUnit(unitName));
  }

  private static refreshShips(player: Player) {
    player
      .getUnits()
      .filter((unit) => unit.getDomain() === "sea")
      .forEach((unit) => unit.refreshMovementAndSight());
  }
}
