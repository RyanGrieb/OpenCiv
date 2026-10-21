import { BorderGrowth } from "../city/BorderGrowth";
import type { City, CityStats } from "../city/City";
import type { HappinessEntry } from "../happiness/PlayerHappiness";
import { Improvement } from "../map/Improvement";
import { NaturalWonders } from "../map/NaturalWonders";
import type { StatEntry, Tile, YieldSource } from "../map/Tile";
import type { Player } from "../Player";
import { Religions } from "./Religions";
import { TechEffects } from "../research/TechEffects";
import { Technology } from "../research/Technology";
import type { CombatModifier } from "../unit/Combat";
import type { Unit, UnitYMLTypeData } from "../unit/Unit";

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
  happiness_per_foreign_followers?: { per: number };
  faith_per_foreign_city?: number;
  culture_per_foreign_followers?: { per: number };
  faith_buildings?: { building: string; faith_cost: number }[];
  faith_units?: { before_era: string };
  science_per_other_follower?: number;
  spread_range_percent?: number;
  spread_pressure_percent?: { percent: number; with_tech?: { tech: string; percent: number } };
  prophet_cost_percent?: number;
  prophet_strength_percent?: number;
  missionary_cost_percent?: number;
  missionary_strength_percent?: number;
  combat_near_friendly_percent?: number;
  combat_near_enemy_percent?: number;
  faith_on_great_person?: number;
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

type ActiveBelief = BeliefData & { effects: BeliefEffectsData };

/**
 * Applies the effects of pantheons and religions' beliefs wherever in the game each matters, as Civ 5
 * does. A city following a religion (see CityReligion.getMajority()) gets that religion's follower
 * belief and its founder's pantheon; a city following none gets its owner's pantheon. A religion's
 * founder belief rewards whoever founded it, for its followers wherever they are.
 */
export class Beliefs {
  // The pantheon and follower belief the city follows (see the class comment).
  public static getCityBeliefs(city: City): ActiveBelief[] {
    const majority = city.getReligion?.().getMajority();
    const founder = majority ? Religions.getFounderOf(majority) : undefined;
    const founded = founder?.getReligion().getFounded();
    const beliefs = founded
      ? [
          founder.getReligion().getPantheon(),
          Religions.getFollowerBelief(founded.followerBelief),
          founded.followerBelief2 ? Religions.getFollowerBelief(founded.followerBelief2) : undefined
        ]
      : [city.getPlayer().getReligion?.().getPantheon()];
    return Beliefs.withEffects(beliefs);
  }

  // The enhancer belief of the religion, once its founder has enhanced it. Its effects are the founder's.
  public static getEnhancerBelief(religion: string | undefined): ActiveBelief | undefined {
    const enhancer = religion ? Religions.getFounderOf(religion)?.getReligion().getFounded().enhancerBelief : undefined;
    return Beliefs.withEffects([enhancer ? Religions.getEnhancerBelief(enhancer) : undefined])[0];
  }

  // The enhancer belief of the religion the player founded, if they founded and enhanced one.
  public static getOwnEnhancerEffects(player: Player): BeliefEffectsData {
    return Beliefs.getEnhancerBelief(player.getReligion?.().getFounded()?.name)?.effects ?? {};
  }

  // How far the religion presses on other cities, once Itinerant Preachers has carried it further.
  public static getSpreadRange(religion: string, baseRange: number): number {
    const percent = Beliefs.getEnhancerBelief(religion)?.effects.spread_range_percent ?? 0;
    return Math.round((baseRange * (100 + percent)) / 100);
  }

  // How hard a city following the religion presses it, once Religious Texts has made it spread faster.
  public static getSpreadPressure(religion: string, basePressure: number): number {
    const effect = Beliefs.getEnhancerBelief(religion)?.effects.spread_pressure_percent;
    if (!effect) return basePressure;

    const founder = Religions.getFounderOf(religion);
    const withTech = effect.with_tech && founder.hasResearchedTech(effect.with_tech.tech);
    const percent = withTech ? effect.with_tech.percent : effect.percent;
    return Math.round((basePressure * (100 + percent)) / 100);
  }

  // The faith the player's next Great Prophet costs, once Messiah has made it cheaper.
  public static getProphetCost(player: Player, baseCost: number): number {
    const percent = Beliefs.getOwnEnhancerEffects(player).prophet_cost_percent ?? 0;
    return Math.round((baseCost * (100 + percent)) / 100);
  }

  /**
   * Defender of the Faith and Just War: what the fighter's owner gets for fighting on the tile, in the
   * lands of a city following the religion they founded - their own or a non-enemy's city for the one,
   * an enemy's for the other.
   */
  public static getCombatModifiers(player: Player, tile: Tile): CombatModifier[] {
    const enhancer = Beliefs.getEnhancerBelief(player.getReligion?.().getFounded()?.name);
    const city = tile.getCityTerritoryOf();
    if (!enhancer || !city || city.getReligion().getMajority() !== player.getReligion().getFounded().name) return [];

    const enemy = city.getPlayer() !== player && player.getDiplomacy().isAtWarWith(city.getPlayer());
    const percent = enemy ? enhancer.effects.combat_near_enemy_percent : enhancer.effects.combat_near_friendly_percent;
    return percent ? [{ label: enhancer.name, value: percent / 100 }] : [];
  }

  // The founder belief of the religion the player founded, if they founded one.
  public static getFounderBeliefs(player: Player): ActiveBelief[] {
    const religion = player.getReligion?.().getFounded();
    return Beliefs.withEffects([religion ? Religions.getFounderBelief(religion.founderBelief) : undefined]);
  }

  // The beliefs' bonuses to the tile, from the city whose territory it is.
  public static getTileBonusSources(tile: Tile): YieldSource[] {
    const city = tile.getCityTerritoryOf();
    if (!city) return [];

    return Beliefs.getCityBeliefs(city).flatMap((belief) =>
      (belief.effects.tile_yields ?? [])
        .filter((effect) => Beliefs.tileMatches(effect, tile, city.getPlayer()))
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

  /**
   * Happiness from beliefs, counted toward the empire's total like a building's, one line each: what
   * the player's cities get from the beliefs they follow, and what the player's founder belief gets
   * from the religion's followers (Ceremonial Burial, Peace Loving).
   */
  public static getHappiness(player: Player): HappinessEntry[] {
    const totals = new Map<string, number>();
    const add = (source: string, amount: number) => totals.set(source, (totals.get(source) ?? 0) + amount);

    player
      .getCities()
      .forEach((city) =>
        Beliefs.getCityBeliefs(city).forEach((belief) =>
          add(belief.name, Beliefs.sumStat(Beliefs.getCityStatsFrom(belief, city), "happiness"))
        )
      );
    Beliefs.getFounderBeliefs(player).forEach((belief) =>
      add(belief.name, Beliefs.getFounderHappiness(player, belief))
    );

    return [...totals].map(([source, amount]) => ({ source, amount })).filter((entry) => entry.amount !== 0);
  }

  /**
   * Yields the player's founder belief earns the empire rather than a city, one entry each: Church
   * Property's and Tithe's gold, Pilgrimage's faith and World Church's culture.
   */
  public static getEmpireYieldSources(player: Player): YieldSource[] {
    const religion = player.getReligion?.().getFounded()?.name;
    if (!religion) return [];

    const cities = Religions.getCitiesFollowing(religion);
    const foreignCities = cities.filter((city) => city.getPlayer() !== player);
    const followers = Religions.countFollowers(religion, Religions.getAllCities());
    const foreignFollowers = Religions.countFollowers(
      religion,
      Religions.getAllCities().filter((city) => city.getPlayer() !== player)
    );
    const per = (count: number, effect: { per: number } | undefined) => (effect ? Math.floor(count / effect.per) : 0);

    return Beliefs.getFounderBeliefs(player)
      .map((belief) => {
        const effects = belief.effects;
        const gold = (effects.gold_per_city ?? 0) * cities.length + per(followers, effects.gold_per_followers);
        const faith = (effects.faith_per_foreign_city ?? 0) * foreignCities.length;
        const culture = per(foreignFollowers, effects.culture_per_foreign_followers);
        const stats = Beliefs.toStatEntries({ gold, faith, culture }).filter((stat) => Object.values(stat)[0] !== 0);
        return { source: belief.name, stats };
      })
      .filter((source) => source.stats.length > 0);
  }

  // The founder belief's empire yields, totalled by stat.
  public static getEmpireYields(player: Player): Record<string, number> {
    return Beliefs.totalOf(Beliefs.getEmpireYieldSources(player).flatMap((source) => source.stats));
  }

  /**
   * What the founder belief adds to the empire as a whole rather than to any one city, totalled by stat:
   * its empire yields and its happiness.
   */
  public static getEmpireBonuses(player: Player): Record<string, number> {
    const happiness = Beliefs.getFounderBeliefs(player).reduce(
      (total, belief) => total + Beliefs.getFounderHappiness(player, belief),
      0
    );
    return Beliefs.totalOf([...Beliefs.getEmpireYieldSources(player).flatMap((source) => source.stats), { happiness }]);
  }

  /**
   * Everything the city's beliefs add to it each turn, totalled by stat: its worked tiles' bonuses,
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
    const followers = Beliefs.getMajorityFollowers(city);
    const percent = Beliefs.getCityBeliefs(city)
      .map((belief) => belief.effects.production_percent_per_follower)
      .filter((effect) => effect)
      .reduce((total, effect) => total + Math.min(effect.max, effect.percent * followers), 0);
    if (percent === 0 || stats.production <= 0) return;

    stats.production = Math.floor((stats.production * (100 + percent)) / 100);
  }

  // Food the city needs to grow, once Fertility Rites (and Swords into Plowshares, at peace) speed it up.
  public static getFoodRequiredToGrow(baseFood: number, city: City): number {
    const beliefs = Beliefs.getCityBeliefs(city);
    const always = beliefs.reduce((total, belief) => total + (belief.effects.growth_percent ?? 0), 0);
    const atPeace = beliefs.reduce((total, belief) => total + (belief.effects.growth_percent_at_peace ?? 0), 0);
    const peaceBonus = atPeace > 0 && !city.getPlayer().getDiplomacy().isAtWar() ? atPeace : 0;
    return Beliefs.speedUp(baseFood, always + peaceBonus);
  }

  // Culture the city's next border tile costs, once Religious Settlements has made border growth faster.
  public static getBorderCost(baseCost: number, city: City): number {
    return Beliefs.speedUp(baseCost, Beliefs.sumEffect(city, "border_growth_percent"));
  }

  // Goddess of Protection's bonus to what the city shoots with.
  public static getCityRangedModifiers(city: City): CombatModifier[] {
    return Beliefs.getCityBeliefs(city)
      .filter((belief) => belief.effects.city_ranged_percent)
      .map((belief) => ({ label: belief.name, value: belief.effects.city_ranged_percent / 100 }));
  }

  // Monument to the Gods: percent added to the city's production of the great wonder.
  public static getWonderProductionPercent(city: City, requiredTech: string | undefined): number {
    if (!requiredTech) return 0;

    const era = Technology.getEraOf([requiredTech]);
    return Beliefs.getCityBeliefs(city)
      .map((belief) => belief.effects.wonder_production)
      .filter((effect) => effect?.eras.includes(era.id))
      .reduce((total, effect) => total + effect.percent, 0);
  }

  // Faith Healers: extra HP for a unit healing in or next to one of its owner's cities that follows it.
  public static getHealBonus(unit: Unit): number {
    const cities = [unit.getTile(), ...unit.getTile().getAdjacentTiles()]
      .map((tile) => tile?.getCity())
      .filter((city) => city?.getPlayer() === unit.getPlayer());
    return Math.max(0, ...cities.map((city) => Beliefs.sumEffect(city, "heal_near_city")));
  }

  // The buildings the city's beliefs let it buy with faith (Cathedrals, Pagodas and the like), with prices.
  public static getFaithBuildings(city: City): { building: string; faith_cost: number }[] {
    return Beliefs.getCityBeliefs(city).flatMap((belief) => belief.effects.faith_buildings ?? []);
  }

  // Holy Warriors: whether the city's beliefs let it buy this unit with faith - a land military unit from
  // before the belief's era.
  public static canBuyUnitWithFaith(city: City, unit: UnitYMLTypeData): boolean {
    if (unit.is_utility || (unit.domain ?? "land") !== "land" || !unit.combat_strength) return false;

    const eras = Technology.getAllEras().map((era) => era.id);
    const unitEra = eras.indexOf(Technology.getEraOf(unit.required_tech ? [unit.required_tech] : []).id);
    return Beliefs.getCityBeliefs(city)
      .map((belief) => belief.effects.faith_units)
      .some((effect) => effect && unitEra < eras.indexOf(effect.before_era));
  }

  /**
   * Interfaith Dialogue: a Missionary has spread the religion to a city where `otherFollowers` citizens
   * followed other religions. Science to the religion's founder, toward what they're researching.
   */
  public static onMissionarySpread(religion: string, city: City, otherFollowers: number) {
    const founder = Religions.getFounderOf(religion);
    if (!founder || otherFollowers <= 0) return;

    Beliefs.getFounderBeliefs(founder)
      .filter((belief) => belief.effects.science_per_other_follower)
      .forEach((belief) => {
        const science = belief.effects.science_per_other_follower * otherFollowers;
        founder.addScience(science);
        founder
          .getNotifications()
          .addMessage("ICON_SCIENCE", `${belief.name}: +${science} Science as ${religion} reaches ${city.getName()}.`);
      });
  }

  // Initiation Rites: the gold the founder gets for a city that has just come to follow their religion.
  public static getGoldOnConversion(founder: Player): { source: string; gold: number }[] {
    return Beliefs.getFounderBeliefs(founder)
      .filter((belief) => belief.effects.gold_on_conversion)
      .map((belief) => ({ source: belief.name, gold: belief.effects.gold_on_conversion }));
  }

  /**
   * God of War: `winner` defeated `loser` on `tile`. Faith equal to the loser's strength, if the battle
   * was close enough to one of the winner's cities that follows it.
   */
  public static onBattleWon(winner: Player, loser: Unit, tile: Tile) {
    const faith = Math.round(loser.getCombatStrength());
    if (faith <= 0) return;

    const rewarded = new Set<string>();
    for (const city of winner.getCities?.() ?? []) {
      for (const belief of Beliefs.getCityBeliefs(city)) {
        const range = belief.effects.faith_from_kills?.range;
        if (range === undefined || rewarded.has(belief.name)) continue;
        if (!BorderGrowth.getRingDistances(city.getTile(), range).has(tile)) continue;

        rewarded.add(belief.name);
        winner.addToAccumulatedStat("faith", faith);
        winner
          .getNotifications()
          .addMessage("ICON_FAITH", `${belief.name}: +${faith} Faith for defeating a ${loser.getName()}.`);
      }
    }
  }

  // How many of the city's citizens follow its religion.
  private static getMajorityFollowers(city: City): number {
    const religion = city.getReligion?.();
    const majority = religion?.getMajority();
    return majority ? religion.getFollowersOf(majority) : 0;
  }

  private static withEffects(beliefs: (BeliefData | undefined)[]): ActiveBelief[] {
    return beliefs.filter((belief) => belief).map((belief) => ({ ...belief, effects: belief.effects ?? {} }));
  }

  // Ceremonial Burial's happiness for every so many cities following, Peace Loving's for every so many
  // followers in friendly foreign cities.
  private static getFounderHappiness(player: Player, belief: ActiveBelief): number {
    const religion = player.getReligion().getFounded()?.name;
    if (!religion) return 0;

    const perCities = belief.effects.happiness_per_cities?.per;
    const fromCities = perCities ? Math.floor(Religions.getCitiesFollowing(religion).length / perCities) : 0;
    const perFollowers = belief.effects.happiness_per_foreign_followers?.per;
    if (!perFollowers) return fromCities;

    const friendly = Religions.getAllCities().filter(
      (city) => city.getPlayer() !== player && !player.getDiplomacy().isAtWarWith(city.getPlayer())
    );
    return fromCities + Math.floor(Religions.countFollowers(religion, friendly) / perFollowers);
  }

  private static getCityStats(city: City): StatEntry[] {
    return Beliefs.getCityBeliefs(city).flatMap((belief) => Beliefs.getCityStatsFrom(belief, city));
  }

  private static getCityStatsFrom(belief: ActiveBelief, city: City): StatEntry[] {
    const effects = belief.effects;
    const followers = Beliefs.getMajorityFollowers(city);
    const buildingYields = (effects.building_yields ?? [])
      .filter((effect) => city.hasBuilding(effect.building))
      .filter((effect) => followers >= (effect.min_followers ?? 0))
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

  private static sumEffect(city: City, effect: "border_growth_percent" | "heal_near_city"): number {
    return Beliefs.getCityBeliefs(city).reduce((total, belief) => total + (belief.effects[effect] ?? 0), 0);
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
