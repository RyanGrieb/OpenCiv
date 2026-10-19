import type { City } from "../city/City";
import { Game } from "../Game";
import { Tile } from "../map/Tile";
import type { Player } from "../Player";
import { ConfigLoader } from "../util/ConfigLoader";
import type { BeliefData } from "./Beliefs";

interface ReligionsConfig {
  religions: string[];
  founder_beliefs: BeliefData[];
  follower_beliefs: BeliefData[];
}

/**
 * Civ 5's religions and the beliefs a founder chooses for one, from config/religions.yml. No two
 * religions share a name or a belief. PlayerReligion founds them, Beliefs applies a founded
 * religion's beliefs, and spreadPressure() spreads them from city to city.
 */
export class Religions {
  // Civ 5's standard-speed spread: a city following a religion presses it on every city within this
  // many tiles each turn, its holy city twice as hard (a guess at BNW's holy city bonus).
  public static readonly PRESSURE_RANGE = 10;
  public static readonly PRESSURE = 6;
  public static readonly HOLY_CITY_PRESSURE = 12;

  /**
   * One turn of spreading: every city following a religion presses it on the cities around it (see
   * CityReligion), all at once so the order cities are visited in doesn't matter. Cities whose
   * religion changed get their new beliefs, and everyone hears who follows what now.
   */
  public static spreadPressure() {
    const cities = Religions.getAllCities();
    const before = new Map(cities.map((city) => [city, city.getReligion().getMajority()]));

    cities
      .flatMap((source) => Religions.getPressureFrom(source, cities))
      .forEach(({ target, religion, amount }) => target.getReligion().addPressure(religion, amount));

    const changed = cities.filter((city) => city.getReligion().getMajority() !== before.get(city));
    changed.forEach((city) => Religions.onMajorityChanged(city));
    Religions.sendCityReligions(cities);
    Religions.getPlayers().forEach((player) => player.sendTotalStatsUpdate());
  }

  // A city has come to follow another religion, or none: its beliefs change, and its founder may be paid.
  public static onMajorityChanged(city: City) {
    const majority = city.getReligion().getMajority();
    if (majority) Religions.getFounderOf(majority)?.getReligion().onCityConverted(city);
    city.refreshBeliefs();
  }

  // Tells every player which religions the cities' citizens follow.
  public static sendCityReligions(cities: City[]) {
    if (cities.length < 1) return;

    const religions = cities.map((city) => ({ cityName: city.getName(), ...city.getReligion().toJSON() }));
    Religions.getPlayers().forEach((player) => player.sendNetworkEvent({ event: "cityReligions", cities: religions }));
  }

  // Who founded the religion, if anyone has.
  public static getFounderOf(religion: string): Player | undefined {
    return Religions.getFounders().find((player) => player.getReligion().getFounded().name === religion);
  }

  // The cities whose majority follows the religion.
  public static getCitiesFollowing(religion: string): City[] {
    return Religions.getAllCities().filter((city) => city.getReligion().getMajority() === religion);
  }

  // How many citizens of these cities follow the religion.
  public static countFollowers(religion: string, cities: City[]): number {
    return cities.reduce((total, city) => total + city.getReligion().getFollowersOf(religion), 0);
  }

  public static getAllCities(): City[] {
    return Religions.getPlayers().flatMap((player) => player.getCities());
  }

  public static getNames(): string[] {
    return Religions.getConfig().religions;
  }

  public static getFounderBeliefs(): BeliefData[] {
    return Religions.getConfig().founder_beliefs;
  }

  public static getFollowerBeliefs(): BeliefData[] {
    return Religions.getConfig().follower_beliefs;
  }

  public static getFounderBelief(name: string): BeliefData | undefined {
    return Religions.getFounderBeliefs().find((belief) => belief.name === name);
  }

  public static getFollowerBelief(name: string): BeliefData | undefined {
    return Religions.getFollowerBeliefs().find((belief) => belief.name === name);
  }

  // Every player who has founded a religion so far.
  public static getFounders(): Player[] {
    return Religions.getPlayers().filter((player) => !!player.getReligion().getFounded());
  }

  // Whether a religion can still be founded: a name, a founder belief and a follower belief are left.
  public static hasRoomForAnother(): boolean {
    const available = Religions.getAvailable();
    return (
      available.religions.length > 0 && available.founderBeliefs.length > 0 && available.followerBeliefs.length > 0
    );
  }

  // What's still free to found: religion names, and founder and follower beliefs no religion has taken.
  public static getAvailable() {
    const founded = Religions.getFounders().map((player) => player.getReligion().getFounded());
    const taken = new Set(
      founded.flatMap((religion) => [religion.name, religion.founderBelief, religion.followerBelief])
    );

    return {
      religions: Religions.getNames().filter((name) => !taken.has(name)),
      founderBeliefs: Religions.getFounderBeliefs().filter((belief) => !taken.has(belief.name)),
      followerBeliefs: Religions.getFollowerBeliefs().filter((belief) => !taken.has(belief.name))
    };
  }

  private static getPressureFrom(source: City, cities: City[]) {
    const religion = source.getReligion().getMajority();
    if (!religion) return [];

    const holyCity = Religions.getFounderOf(religion)?.getReligion().getHolyCity();
    const amount = holyCity === source ? Religions.HOLY_CITY_PRESSURE : Religions.PRESSURE;
    return cities
      .filter((target) => target !== source)
      .filter((target) => Tile.gridDistance(source.getTile(), target.getTile()) <= Religions.PRESSURE_RANGE)
      .map((target) => ({ target, religion, amount }));
  }

  private static getPlayers(): Player[] {
    return Array.from(Game.getInstance().getPlayers().values());
  }

  private static getConfig(): ReligionsConfig {
    return ConfigLoader.load<ReligionsConfig>("./config/religions.yml");
  }
}
