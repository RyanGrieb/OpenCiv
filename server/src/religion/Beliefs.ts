import { BorderGrowth } from "../city/BorderGrowth";
import type { City, CityStats } from "../city/City";
import type { HappinessEntry } from "../happiness/PlayerHappiness";
import { Improvement } from "../map/Improvement";
import { NaturalWonders } from "../map/NaturalWonders";
import type { StatEntry, Tile, YieldSource } from "../map/Tile";
import type { Player } from "../Player";
import { TechEffects } from "../research/TechEffects";
import { Technology } from "../research/Technology";
import type { CombatModifier } from "../unit/Combat";
import type { Unit } from "../unit/Unit";

// Extra yields a belief gives some tiles of its owner's cities. Every field given has to match.
export interface BeliefTileYield {
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

export interface BeliefBuildingYield {
  building: string;
  // Only in cities with at least this many followers (all of a following city's citizens follow).
  min_followers?: number;
  stats: Record<string, number>;
}

export interface BeliefCityYield {
  min_population?: number;
  river?: boolean;
  stats: Record<string, number>;
}

// What a pantheon or belief does, as config/pantheons.yml's and config/religions.yml's `effects` give it.
export interface BeliefEffectsData {
  tile_yields?: BeliefTileYield[];
  building_yields?: BeliefBuildingYield[];
  city_yields?: BeliefCityYield[];
  growth_percent?: number;
  growth_percent_at_peace?: number;
  border_growth_percent?: number;
  city_ranged_percent?: number;
  wonder_production?: { percent: number; eras: string[] };
  wonder_yields?: Record<string, number>;
  production_percent_per_follower?: { percent: number; max: number };
  heal_near_city?: number;
  faith_from_kills?: { range: number };
  gold_per_city?: number;
  happiness_per_cities?: { per: number };
  gold_per_followers?: { per: number };
  gold_on_conversion?: number;
}

// A pantheon, or a religion's founder or follower belief.
export interface BeliefData {
  name: string;
  // Drawn as stat icons in the client's lists.
  yields?: Record<string, number>;
  // A few words after the yields in a list ("from Shrines"); the whole bonus for the tooltip.
  text: string;
  description: string;
  effects?: BeliefEffectsData;
  not_yet?: string[];
}

/**
 * Applies the effects of a player's pantheon and religion beliefs wherever in the game each matters.
 * Every effect only helps the player who holds the belief. For now all of that player's cities follow
 * their religion, every citizen a follower, and the religion follows no one else.
 */
export class Beliefs {
  // The beliefs' bonuses to the tile, from the player whose city's territory it is.
  public static getTileBonusSources(tile: Tile): YieldSource[] {
    const owner = tile.getOwner();

    return Beliefs.getBeliefsOf(owner).flatMap((belief) =>
      (belief.effects.tile_yields ?? [])
        .filter((effect) => Beliefs.tileMatches(effect, tile, owner))
        .map((effect) => ({ source: belief.name, stats: Beliefs.toStatEntries(effect.stats) }))
    );
  }

  // What the beliefs add to the city's own yields: from its buildings, its wonders, its size or river.
  public static getCityYields(city: City): StatEntry[] {
    return Beliefs.getCityStats(city).filter((stat) => stat.happiness === undefined);
  }

  // The happiness the beliefs get from this city (Goddess of Love, Peace Gardens).
  public static getCityHappiness(city: City): number {
    return Beliefs.getCityStats(city).reduce((total, stat) => total + (stat.happiness ?? 0), 0);
  }

  // Happiness from the beliefs, counted toward the empire's total like a building's, one line each.
  public static getHappiness(player: Player): HappinessEntry[] {
    const cities = player.getCities();

    return Beliefs.getBeliefsOf(player)
      .map((belief) => {
        const fromCities = cities.reduce(
          (total, city) => total + Beliefs.sumStat(Beliefs.getCityStatsFrom(belief, city), "happiness"),
          0
        );
        return { source: belief.name, amount: fromCities + Beliefs.getPerCitiesHappiness(belief, cities.length) };
      })
      .filter((entry) => entry.amount !== 0);
  }

  // Yields the beliefs give the empire rather than a city (Church Property, Tithe), one entry each.
  public static getEmpireYieldSources(player: Player): YieldSource[] {
    const cities = player.getCities();
    const followers = cities.reduce((total, city) => total + city.getPopulation(), 0);

    return Beliefs.getBeliefsOf(player)
      .map((belief) => {
        const perCity = (belief.effects.gold_per_city ?? 0) * cities.length;
        const per = belief.effects.gold_per_followers?.per;
        const perFollowers = per ? Math.floor(followers / per) : 0;
        return { source: belief.name, stats: [{ gold: perCity + perFollowers }] };
      })
      .filter((source) => source.stats[0].gold !== 0);
  }

  /**
   * What the beliefs add to the empire as a whole rather than to any one city, totalled by stat:
   * Church Property's and Tithe's gold, Ceremonial Burial's happiness.
   */
  public static getEmpireBonuses(player: Player): Record<string, number> {
    const cityCount = player.getCities().length;
    const happiness = Beliefs.getBeliefsOf(player).reduce(
      (total, belief) => total + Beliefs.getPerCitiesHappiness(belief, cityCount),
      0
    );
    return Beliefs.totalOf([{ gold: Beliefs.getEmpireGold(player) }, { happiness }]);
  }

  public static getEmpireGold(player: Player): number {
    return Beliefs.getEmpireYieldSources(player).reduce(
      (total, source) => total + Beliefs.sumStat(source.stats, "gold"),
      0
    );
  }

  /**
   * Everything the beliefs add to the city each turn, totalled by stat: its worked tiles' bonuses,
   * its own yields and happiness. Before the city's buildings scale them, so a Temple of Artemis can
   * make the city's real total a little more.
   */
  public static getCityBonuses(city: City): Record<string, number> {
    const stats = [
      ...city.getWorkedTiles().flatMap((tile) => Beliefs.getTileBonusSources(tile).flatMap((source) => source.stats)),
      ...Beliefs.getCityStats(city)
    ];
    return Beliefs.totalOf(stats);
  }

  // Religious Community's percent on the city's production, once its other yields are in.
  public static applyToCityStats(city: City, stats: CityStats) {
    const percent = Beliefs.getBeliefsOf(city.getPlayer())
      .map((belief) => belief.effects.production_percent_per_follower)
      .filter((effect) => effect)
      .reduce((total, effect) => total + Math.min(effect.max, effect.percent * city.getPopulation()), 0);
    if (percent === 0 || stats.production <= 0) return;

    stats.production = Math.floor((stats.production * (100 + percent)) / 100);
  }

  // Food a city needs to grow, once Fertility Rites (and Swords into Plowshares, at peace) speed it up.
  public static getFoodRequiredToGrow(baseFood: number, player: Player): number {
    const beliefs = Beliefs.getBeliefsOf(player);
    const always = beliefs.reduce((total, belief) => total + (belief.effects.growth_percent ?? 0), 0);
    const atPeace = beliefs.reduce((total, belief) => total + (belief.effects.growth_percent_at_peace ?? 0), 0);
    const peaceBonus = atPeace > 0 && !player.getDiplomacy().isAtWar() ? atPeace : 0;
    return Beliefs.speedUp(baseFood, always + peaceBonus);
  }

  // Culture the next border tile costs, once Religious Settlements has made border growth faster.
  public static getBorderCost(baseCost: number, player: Player): number {
    return Beliefs.speedUp(baseCost, Beliefs.sumEffect(player, "border_growth_percent"));
  }

  // Goddess of Protection's bonus to what the player's cities shoot with.
  public static getCityRangedModifiers(player: Player): CombatModifier[] {
    return Beliefs.getBeliefsOf(player)
      .filter((belief) => belief.effects.city_ranged_percent)
      .map((belief) => ({ label: belief.name, value: belief.effects.city_ranged_percent / 100 }));
  }

  // Monument to the Gods: percent added to the player's production of the great wonder.
  public static getWonderProductionPercent(player: Player, requiredTech: string | undefined): number {
    if (!requiredTech) return 0;

    const era = Technology.getEraOf([requiredTech]);
    return Beliefs.getBeliefsOf(player)
      .map((belief) => belief.effects.wonder_production)
      .filter((effect) => effect?.eras.includes(era.id))
      .reduce((total, effect) => total + effect.percent, 0);
  }

  // Faith Healers: extra HP for a unit healing in or next to one of its owner's cities.
  public static getHealBonus(unit: Unit): number {
    const bonus = Beliefs.sumEffect(unit.getPlayer(), "heal_near_city");
    if (!bonus) return 0;

    const nearOwnCity = [unit.getTile(), ...unit.getTile().getAdjacentTiles()].some(
      (tile) => tile?.getCity()?.getPlayer() === unit.getPlayer()
    );
    return nearOwnCity ? bonus : 0;
  }

  // Initiation Rites: the gold for a city that has just come to follow the player's religion.
  public static getGoldOnConversion(player: Player): { source: string; gold: number }[] {
    return Beliefs.getBeliefsOf(player)
      .filter((belief) => belief.effects.gold_on_conversion)
      .map((belief) => ({ source: belief.name, gold: belief.effects.gold_on_conversion }));
  }

  /**
   * God of War: `winner` defeated `loser` on `tile`. Faith equal to the loser's strength, if the battle
   * was close enough to one of the winner's cities.
   */
  public static onBattleWon(winner: Player, loser: Unit, tile: Tile) {
    for (const belief of Beliefs.getBeliefsOf(winner)) {
      const range = belief.effects.faith_from_kills?.range;
      if (range === undefined) continue;

      const nearCity = winner
        .getCities()
        .some((city) => BorderGrowth.getRingDistances(city.getTile(), range).has(tile));
      const faith = Math.round(loser.getCombatStrength());
      if (!nearCity || faith <= 0) continue;

      winner.addToAccumulatedStat("faith", faith);
      winner
        .getNotifications()
        .addMessage("ICON_FAITH", `${belief.name}: +${faith} Faith for defeating a ${loser.getName()}.`);
    }
  }

  // The player's pantheon and religion beliefs, each with effects to read even if it lists none.
  private static getBeliefsOf(player: Player | undefined): (BeliefData & { effects: BeliefEffectsData })[] {
    const beliefs = player?.getReligion?.().getBeliefs() ?? [];
    return beliefs.map((belief) => ({ ...belief, effects: belief.effects ?? {} }));
  }

  // Ceremonial Burial: 1 happiness for every `per` cities following.
  private static getPerCitiesHappiness(belief: BeliefData & { effects: BeliefEffectsData }, cityCount: number): number {
    const per = belief.effects.happiness_per_cities?.per;
    return per ? Math.floor(cityCount / per) : 0;
  }

  private static getCityStats(city: City): StatEntry[] {
    return Beliefs.getBeliefsOf(city.getPlayer()).flatMap((belief) => Beliefs.getCityStatsFrom(belief, city));
  }

  private static getCityStatsFrom(belief: BeliefData & { effects: BeliefEffectsData }, city: City): StatEntry[] {
    const effects = belief.effects;
    const buildingYields = (effects.building_yields ?? [])
      .filter((effect) => city.hasBuilding(effect.building))
      .filter((effect) => city.getPopulation() >= (effect.min_followers ?? 0))
      .flatMap((effect) => Beliefs.toStatEntries(effect.stats));
    const cityYields = (effects.city_yields ?? [])
      .filter((effect) => Beliefs.cityMatches(effect, city))
      .flatMap((effect) => Beliefs.toStatEntries(effect.stats));
    const wonders = effects.wonder_yields
      ? city.getBuildings().filter((building) => building.isWonderBuilding()).length
      : 0;
    const wonderYields = Array.from({ length: wonders }, () => Beliefs.toStatEntries(effects.wonder_yields)).flat();

    return [...buildingYields, ...cityYields, ...wonderYields];
  }

  private static sumEffect(player: Player, effect: "border_growth_percent" | "heal_near_city"): number {
    return Beliefs.getBeliefsOf(player).reduce((total, belief) => total + (belief.effects[effect] ?? 0), 0);
  }

  private static tileMatches(effect: BeliefTileYield, tile: Tile, owner: Player): boolean {
    if (effect.except?.some((type) => tile.containsTileType(type))) return false;
    if (effect.terrain && !tile.containsTileTypes(effect.terrain)) return false;
    if (effect.natural_wonder && !NaturalWonders.getWonderOn(tile)) return false;
    if (effect.improvement && !Beliefs.hasImprovement(tile, effect.improvement)) return false;
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

  private static cityMatches(effect: BeliefCityYield, city: City): boolean {
    if (effect.min_population && city.getPopulation() < effect.min_population) return false;
    if (effect.river && !city.getTile().hasRiver()) return false;
    return true;
  }

  private static toStatEntries(stats: Record<string, number>): StatEntry[] {
    return Object.entries(stats).map(([stat, value]) => ({ [stat]: value }) as StatEntry);
  }

  private static sumStat(stats: StatEntry[], stat: keyof StatEntry): number {
    return stats.reduce((total, entry) => total + (entry[stat] ?? 0), 0);
  }

  private static totalOf(stats: StatEntry[]): Record<string, number> {
    const totals: Record<string, number> = {};
    stats
      .flatMap((stat) => Object.entries(stat))
      .filter(([, value]) => value !== 0)
      .forEach(([stat, value]) => (totals[stat] = (totals[stat] ?? 0) + value));
    return totals;
  }

  // "15% faster" as Civ 5 means it: the cost shrinks so it's reached in 100/115 of the time.
  private static speedUp(cost: number, percent: number): number {
    if (!percent) return cost;

    return Math.max(1, Math.round((cost * 100) / (100 + percent)));
  }
}
