import { BorderGrowth } from "../city/BorderGrowth";
import type { City } from "../city/City";
import { Game } from "../Game";
import type { HappinessEntry } from "../happiness/PlayerHappiness";
import { Improvement } from "../map/Improvement";
import { NaturalWonders } from "../map/NaturalWonders";
import type { StatEntry, Tile, YieldSource } from "../map/Tile";
import type { Player } from "../Player";
import { TechEffects } from "../research/TechEffects";
import { Technology } from "../research/Technology";
import type { CombatModifier } from "../unit/Combat";
import type { Unit } from "../unit/Unit";
import { ConfigLoader } from "../util/ConfigLoader";

// Extra yields a pantheon gives some tiles of its owner's cities. Every field given has to match.
export interface PantheonTileYield {
  // Any of these tile types, e.g. [tundra, tundra_hill].
  terrain?: string[];
  // Tiles with one of these resources, improved or not.
  resources?: string[];
  // Tiles with this improvement, e.g. "Pasture".
  improvement?: string;
  natural_wonder?: boolean;
  // Tile types that rule a tile out, e.g. Dance of the Aurora skips tundra forest.
  except?: string[];
  stats: Record<string, number>;
}

export interface PantheonBuildingYield {
  building: string;
  stats: Record<string, number>;
}

export interface PantheonCityYield {
  min_population?: number;
  river?: boolean;
  stats: Record<string, number>;
}

// What a pantheon does, as config/pantheons.yml's `effects` gives it.
export interface PantheonEffectsData {
  tile_yields?: PantheonTileYield[];
  building_yields?: PantheonBuildingYield[];
  city_yields?: PantheonCityYield[];
  growth_percent?: number;
  border_growth_percent?: number;
  city_ranged_percent?: number;
  wonder_production?: { percent: number; eras: string[] };
  heal_near_city?: number;
  faith_from_kills?: { range: number };
}

export interface PantheonData {
  name: string;
  // Drawn as stat icons in the client's pantheon list.
  yields?: Record<string, number>;
  // A few words after the yields in the list ("from Shrines"); the whole bonus for the tooltip.
  text: string;
  description: string;
  effects?: PantheonEffectsData;
  not_yet?: string[];
}

/**
 * Civ 5's pantheons, from config/pantheons.yml: what founding one costs, and every effect a founded
 * one has. Each effect only ever helps the pantheon's owner (see PlayerReligion for founding).
 */
export class Pantheons {
  // Brave New World's standard-speed costs: 10 Faith for the world's first pantheon, 5 more for each after.
  public static readonly FIRST_PANTHEON_COST = 10;
  public static readonly COST_PER_FOUNDED = 5;

  public static getAll(): PantheonData[] {
    return ConfigLoader.load<{ pantheons: PantheonData[] }>("./config/pantheons.yml").pantheons;
  }

  public static getByName(name: string): PantheonData | undefined {
    return Pantheons.getAll().find((pantheon) => pantheon.name === name);
  }

  // Which player founded each pantheon so far, by pantheon name.
  public static getFounders(): Map<string, Player> {
    const founders = new Map<string, Player>();
    Game.getInstance()
      .getPlayers()
      .forEach((player) => {
        const pantheon = player.getReligion().getPantheonName();
        if (pantheon) founders.set(pantheon, player);
      });
    return founders;
  }

  // The faith the next pantheon founded anywhere in the world costs.
  public static getCost(): number {
    return Pantheons.FIRST_PANTHEON_COST + Pantheons.COST_PER_FOUNDED * Pantheons.getFounders().size;
  }

  public static getAvailable(): PantheonData[] {
    const founders = Pantheons.getFounders();
    return Pantheons.getAll().filter((pantheon) => !founders.has(pantheon.name));
  }

  // The pantheon's bonuses to the tile, if the player whose city's territory it is founded one.
  public static getTileBonusSources(tile: Tile): YieldSource[] {
    const owner = tile.getOwner();
    const pantheon = Pantheons.getEffectsOf(owner);
    if (!pantheon) return [];

    return (pantheon.effects.tile_yields ?? [])
      .filter((effect) => Pantheons.tileMatches(effect, tile, owner))
      .map((effect) => ({ source: pantheon.name, stats: Pantheons.toStatEntries(effect.stats) }));
  }

  // What the pantheon adds to the city's own yields, from its buildings and its size or river.
  public static getCityYields(city: City): StatEntry[] {
    const effects = Pantheons.getEffectsOf(city.getPlayer())?.effects;
    if (!effects) return [];

    const buildingYields = (effects.building_yields ?? [])
      .filter((effect) => city.hasBuilding(effect.building))
      .flatMap((effect) => Pantheons.toStatEntries(effect.stats));
    const cityYields = (effects.city_yields ?? [])
      .filter((effect) => Pantheons.cityMatches(effect, city))
      .flatMap((effect) => Pantheons.toStatEntries(effect.stats))
      .filter((stat) => stat.happiness === undefined);

    return [...buildingYields, ...cityYields];
  }

  // Happiness from the pantheon, counted toward the empire's total like a building's.
  public static getHappiness(player: Player): HappinessEntry[] {
    const pantheon = Pantheons.getEffectsOf(player);
    if (!pantheon) return [];

    const amount = player
      .getCities()
      .flatMap((city) => (pantheon.effects.city_yields ?? []).filter((effect) => Pantheons.cityMatches(effect, city)))
      .reduce((total, effect) => total + (effect.stats.happiness ?? 0), 0);
    return amount === 0 ? [] : [{ source: pantheon.name, amount }];
  }

  // Food a city needs to grow, once Fertility Rites has made growth faster.
  public static getFoodRequiredToGrow(baseFood: number, player: Player): number {
    return Pantheons.speedUp(baseFood, Pantheons.getEffectsOf(player)?.effects.growth_percent);
  }

  // Culture the next border tile costs, once Religious Settlements has made border growth faster.
  public static getBorderCost(baseCost: number, player: Player): number {
    return Pantheons.speedUp(baseCost, Pantheons.getEffectsOf(player)?.effects.border_growth_percent);
  }

  // Goddess of Protection's bonus to what the player's cities shoot with.
  public static getCityRangedModifiers(player: Player): CombatModifier[] {
    const pantheon = Pantheons.getEffectsOf(player);
    const percent = pantheon?.effects.city_ranged_percent;
    if (!percent) return [];

    return [{ label: pantheon.name, value: percent / 100 }];
  }

  // Monument to the Gods: percent added to the player's production of the great wonder.
  public static getWonderProductionPercent(player: Player, requiredTech: string | undefined): number {
    const effect = Pantheons.getEffectsOf(player)?.effects.wonder_production;
    if (!effect || !requiredTech) return 0;

    const era = Technology.getEraOf([requiredTech]);
    return effect.eras.includes(era.id) ? effect.percent : 0;
  }

  // Faith Healers: extra HP for a unit healing in or next to one of its owner's cities.
  public static getHealBonus(unit: Unit): number {
    const bonus = Pantheons.getEffectsOf(unit.getPlayer())?.effects.heal_near_city;
    if (!bonus) return 0;

    const nearOwnCity = [unit.getTile(), ...unit.getTile().getAdjacentTiles()].some(
      (tile) => tile?.getCity()?.getPlayer() === unit.getPlayer()
    );
    return nearOwnCity ? bonus : 0;
  }

  /**
   * God of War: `winner` defeated `loser` on `tile`. Faith equal to the loser's strength, if the battle
   * was close enough to one of the winner's cities.
   */
  public static onBattleWon(winner: Player, loser: Unit, tile: Tile) {
    const pantheon = Pantheons.getEffectsOf(winner);
    const range = pantheon?.effects.faith_from_kills?.range;
    if (range === undefined) return;

    const nearCity = winner.getCities().some((city) => BorderGrowth.getRingDistances(city.getTile(), range).has(tile));
    const faith = Math.round(loser.getCombatStrength());
    if (!nearCity || faith <= 0) return;

    winner.addToAccumulatedStat("faith", faith);
    winner
      .getNotifications()
      .addMessage("ICON_FAITH", `${pantheon.name}: +${faith} Faith for defeating a ${loser.getName()}.`);
  }

  // The player's pantheon, with effects to read even if it has none listed.
  private static getEffectsOf(
    player: Player | undefined
  ): (PantheonData & { effects: PantheonEffectsData }) | undefined {
    const pantheon = player?.getReligion?.().getPantheon();
    if (!pantheon) return undefined;

    return { ...pantheon, effects: pantheon.effects ?? {} };
  }

  private static tileMatches(effect: PantheonTileYield, tile: Tile, owner: Player): boolean {
    if (effect.except?.some((type) => tile.containsTileType(type))) return false;
    if (effect.terrain && !tile.containsTileTypes(effect.terrain)) return false;
    if (effect.natural_wonder && !NaturalWonders.getWonderOn(tile)) return false;
    if (effect.improvement && !Pantheons.hasImprovement(tile, effect.improvement)) return false;
    if (!effect.resources) return true;

    const resource = tile.getResource() ?? Improvement.getImprovedResource(tile);
    return !!resource && effect.resources.includes(resource) && !TechEffects.isResourceHidden(resource, owner);
  }

  // Built by a Builder, or drawn into a map preset as the improved resource it leaves (improved_cattle).
  private static hasImprovement(tile: Tile, improvementName: string): boolean {
    if (tile.getImprovement() === improvementName) return true;

    const improved = Object.values(Improvement.getImprovementData(improvementName)?.resources ?? {});
    return improved.some((type) => tile.containsTileType(type));
  }

  private static cityMatches(effect: PantheonCityYield, city: City): boolean {
    if (effect.min_population && city.getPopulation() < effect.min_population) return false;
    if (effect.river && !city.getTile().hasRiver()) return false;
    return true;
  }

  private static toStatEntries(stats: Record<string, number>): StatEntry[] {
    return Object.entries(stats).map(([stat, value]) => ({ [stat]: value }) as StatEntry);
  }

  // "15% faster" as Civ 5 means it: the cost shrinks so it's reached in 100/115 of the time.
  private static speedUp(cost: number, percent: number | undefined): number {
    if (!percent) return cost;

    return Math.max(1, Math.round((cost * 100) / (100 + percent)));
  }
}
