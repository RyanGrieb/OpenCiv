import type { City } from "../city/City";
import { Game } from "../Game";
import type { Player } from "../Player";
import { Unit } from "../unit/Unit";
import { Beliefs } from "./Beliefs";
import { PlayerReligion } from "./PlayerReligion";
import { Religions } from "./Religions";

/**
 * Civ 5's religious units. A Missionary, bought with faith in a city following a religion, carries that
 * religion and spreads it to a city it stands in or next to, twice. A Great Prophet spreads its owner's
 * religion four times, harder, and clears out the other religions first. An Inquisitor, bought once the
 * city's religion is enhanced, keeps other religions' Missionaries and Prophets from spreading to the
 * owner's city it stands in or next to, and Removes Heresy there once. All three cross any borders, but
 * a Missionary ending its turn in another civilization's lands loses a quarter of its strength.
 */
export class ReligiousUnits {
  public static readonly MISSIONARY = "Missionary";
  public static readonly INQUISITOR = "Inquisitor";
  // Guesses at Civ 5's spread strength in this game's pressure (CityReligion.CONVERSION_PRESSURE per
  // citizen): a Missionary converts about 3 citizens, a Great Prophet 4.
  public static readonly MISSIONARY_STRENGTH = 180;
  public static readonly PROPHET_STRENGTH = 240;
  public static readonly ATTRITION_PERCENT = 25;

  // The religion the unit spreads: a Missionary's or Inquisitor's own, a Great Prophet's owner's.
  public static getReligionOf(unit: Unit): string | undefined {
    return unit.getReligion() ?? unit.getPlayer().getReligion().getFounded()?.name;
  }

  // A Missionary or Inquisitor carries the religion of the city it came from.
  public static carriesReligion(unitName: string): boolean {
    return unitName === ReligiousUnits.MISSIONARY || unitName === ReligiousUnits.INQUISITOR;
  }

  /**
   * The religious units faith can buy in the city, with prices: a Missionary of the religion the city
   * follows, and an Inquisitor once that religion is enhanced. Holy Order makes its founder's cheaper.
   */
  public static getFaithOptions(city: City): { name: string; faithCost: number }[] {
    const religion = city.getReligion().getMajority();
    if (!religion) return [];

    const enhanced = !!Religions.getFounderOf(religion)?.getReligion().isEnhanced();
    return [ReligiousUnits.MISSIONARY, ...(enhanced ? [ReligiousUnits.INQUISITOR] : [])].map((name) => ({
      name,
      faithCost: ReligiousUnits.getFaithCost(name, city.getPlayer(), religion)
    }));
  }

  public static canSpread(unit: Unit): boolean {
    return !!ReligiousUnits.getSpreadTarget(unit);
  }

  /**
   * Spreads the unit's religion to the city it stands in or next to: pressure toward it, after a Great
   * Prophet has cleared out the other religions. Uses a charge and the rest of the turn; the last one
   * uses the unit up.
   */
  public static spread(unit: Unit): boolean {
    const city = ReligiousUnits.getSpreadTarget(unit);
    if (!city) return false;

    const religion = ReligiousUnits.getReligionOf(unit);
    const prophet = unit.getName() === PlayerReligion.PROPHET;
    const followers = city.getPopulation() - city.getReligion().getNonFollowers();
    const before = city.getReligion().getFollowersOf(religion);
    const otherReligionFollowers = followers - before;
    if (prophet) city.getReligion().removeOthers(religion);
    const strength = ReligiousUnits.getStrength(unit);
    city.getReligion().addPressure(religion, strength);
    ReligiousUnits.onCityReligionChanged(city);
    if (!prophet) Beliefs.onMissionarySpread(religion, city, otherReligionFollowers);
    // Everyone's client floats "+2 Followers" with the religion's icon up from the city.
    const converted = city.getReligion().getFollowersOf(religion) - before;
    Array.from(Game.getInstance().getPlayers().values()).forEach((player) =>
      player.sendNetworkEvent({ event: "religionSpread", cityName: city.getName(), religion, converted })
    );

    unit.useReligiousAction();
    unit
      .getPlayer()
      .getNotifications()
      .addMessage("ICON_FAITH", `Your ${unit.getName()} spread ${religion} to ${city.getName()}.`);
    if (unit.getSpreadsLeft() <= 0) ReligiousUnits.expend(unit);
    return true;
  }

  public static canRemoveHeresy(unit: Unit): boolean {
    return !!ReligiousUnits.getHeresyTarget(unit);
  }

  // The Inquisitor clears every other religion out of its owner's city, and is used up.
  public static removeHeresy(unit: Unit): boolean {
    const city = ReligiousUnits.getHeresyTarget(unit);
    if (!city) return false;

    const removed = Object.fromEntries(
      Object.entries(city.getReligion().getFollowers()).filter(([religion]) => religion !== unit.getReligion())
    );
    city.getReligion().removeOthers(unit.getReligion());
    ReligiousUnits.onCityReligionChanged(city);
    // Everyone's client floats "-2 Heretics" up from the city, one line per religion removed.
    Array.from(Game.getInstance().getPlayers().values()).forEach((player) =>
      player.sendNetworkEvent({ event: "heresyRemoved", cityName: city.getName(), removed })
    );
    unit
      .getPlayer()
      .getNotifications()
      .addMessage("ICON_FAITH", `Your Inquisitor removed heresy from ${city.getName()}.`);
    unit.delete();
    return true;
  }

  // At each turn's start: the player's Missionaries and Great Prophets in another civilization's lands
  // lose strength, and one with none left is lost.
  public static applyAttrition(player: Player) {
    player
      .getUnits()
      .filter((unit) => unit.canSpread() && ReligiousUnits.isAbroad(unit))
      .forEach((unit) => {
        unit.weakenReligiousStrength(ReligiousUnits.ATTRITION_PERCENT);
        if (unit.getReligiousStrength() > 0) return;

        player
          .getNotifications()
          .addMessage("ICON_FAITH", `Your ${unit.getName()} has lost its strength in foreign lands.`);
        unit.delete();
      });
  }

  // "Spread Islam (2 left)", with the strength once foreign lands have worn it down.
  public static describeSpread(unit: Unit): string {
    const strength = unit.getReligiousStrength() < 100 ? `, ${unit.getReligiousStrength()}% strength` : "";
    const religion = ReligiousUnits.getReligionOf(unit) ?? "Religion";
    return `Spread ${religion} (${unit.getSpreadsLeft()} left${strength})`;
  }

  private static getFaithCost(name: string, buyer: Player, religion: string): number {
    const base = Unit.getUnitYMLTypeDataByName(name)?.faith_cost ?? 0;
    const ownReligion = Religions.getFounderOf(religion) === buyer;
    const percent = ownReligion ? (Beliefs.getOwnEnhancerEffects(buyer).missionary_cost_percent ?? 0) : 0;
    return Math.round((base * (100 + percent)) / 100);
  }

  // A city in or next to the unit's tile its religion can spread to: one no Inquisitor of another
  // religion guards, where it would change something.
  private static getSpreadTarget(unit: Unit): City | undefined {
    const religion = ReligiousUnits.getReligionOf(unit);
    if (!religion || unit.getSpreadsLeft() <= 0 || unit.getAvailableMovement() <= 0) return undefined;

    const prophet = unit.getName() === PlayerReligion.PROPHET;
    return ReligiousUnits.getNearbyCities(unit).find((city) => {
      if (ReligiousUnits.isGuardedAgainst(city, religion)) return false;

      const followers = city.getReligion().getFollowersOf(religion);
      const othersLeft = Object.keys(city.getReligion().getFollowers()).some((name) => name !== religion);
      return followers < city.getPopulation() || (prophet && othersLeft);
    });
  }

  // The Inquisitor's owner's city in or next to its tile, following some religion besides its own.
  private static getHeresyTarget(unit: Unit): City | undefined {
    if (unit.getName() !== ReligiousUnits.INQUISITOR || unit.getAvailableMovement() <= 0) return undefined;

    return ReligiousUnits.getNearbyCities(unit)
      .filter((city) => city.getPlayer() === unit.getPlayer())
      .find((city) => Object.keys(city.getReligion().getFollowers()).some((name) => name !== unit.getReligion()));
  }

  // An Inquisitor of the city's owner in or next to it, of another religion, keeps this one out.
  private static isGuardedAgainst(city: City, religion: string): boolean {
    return [city.getTile(), ...city.getTile().getAdjacentTiles()]
      .filter((tile) => tile)
      .flatMap((tile) => tile.getUnits())
      .some(
        (unit) =>
          unit.getName() === ReligiousUnits.INQUISITOR &&
          unit.getPlayer() === city.getPlayer() &&
          unit.getReligion() !== religion
      );
  }

  private static getNearbyCities(unit: Unit): City[] {
    return [unit.getTile(), ...unit.getTile().getAdjacentTiles()].map((tile) => tile?.getCity()).filter((city) => city);
  }

  // Pressure a spread puts on a city: Missionary Zeal and Messiah make the founder's units stronger,
  // and a Missionary worn down abroad spreads with what strength it has left.
  private static getStrength(unit: Unit): number {
    const prophet = unit.getName() === PlayerReligion.PROPHET;
    const base = prophet ? ReligiousUnits.PROPHET_STRENGTH : ReligiousUnits.MISSIONARY_STRENGTH;
    const religion = ReligiousUnits.getReligionOf(unit);
    const effects =
      Religions.getFounderOf(religion) === unit.getPlayer() ? Beliefs.getOwnEnhancerEffects(unit.getPlayer()) : {};
    const percent = (prophet ? effects.prophet_strength_percent : effects.missionary_strength_percent) ?? 0;
    return Math.round((((base * (100 + percent)) / 100) * unit.getReligiousStrength()) / 100);
  }

  // A Great Prophet used up: Reliquary pays its owner.
  private static expend(unit: Unit) {
    unit.delete();
    if (unit.getName() === PlayerReligion.PROPHET) unit.getPlayer().getReligion().onGreatPersonExpended();
  }

  // The city's beliefs and followers may have changed: its owner's stats, and everyone's view of it.
  private static onCityReligionChanged(city: City) {
    Religions.onMajorityChanged(city);
    Religions.sendCityReligions([city]);
    Array.from(Game.getInstance().getPlayers().values()).forEach((player) => player.sendTotalStatsUpdate());
  }

  // In the lands of another civilization, without Open Borders (which the game doesn't have yet).
  private static isAbroad(unit: Unit): boolean {
    const owner = unit.getTile().getCityTerritoryOf()?.getPlayer();
    return !!owner && owner !== unit.getPlayer();
  }
}
