import { ServerEvents } from "../Events";
import { Game } from "../Game";
import { GameMap } from "../map/GameMap";
import type { City } from "../city/City";
import type { Player } from "../Player";
import type { Unit } from "../unit/Unit";
import { BeliefData, Beliefs } from "./Beliefs";
import { PantheonData, Pantheons } from "./Pantheons";
import { Religions } from "./Religions";
import { Technology } from "../research/Technology";

// A religion a player founded, by name, with the founder and follower belief chosen for it, and once
// a later Great Prophet enhances it, a second follower belief and an enhancer belief.
export interface FoundedReligion {
  name: string;
  founderBelief: string;
  followerBelief: string;
  holyCity: string;
  followerBelief2?: string;
  enhancerBelief?: string;
}

/**
 * A player's faith-bought beliefs. Once their faith reaches Pantheons.getCost() they may found a
 * pantheon no other civilization has. With a pantheon, once it reaches getProphetCost(), a Great
 * Prophet is born, and in one of the player's cities the prophet founds a religion with a founder and
 * a follower belief. That holy city follows it at once; from there it spreads to the cities around it,
 * the player's or anyone's (see Religions.spreadPressure()). A later Great Prophet, in one of the
 * player's cities, enhances it with a second follower belief and an enhancer belief.
 */
export class PlayerReligion {
  public static readonly PROPHET = "Great Prophet";
  // Brave New World's standard-speed Great Prophet costs: 200 Faith for a player's first, 100 more for each after.
  public static readonly FIRST_PROPHET_COST = 200;
  public static readonly COST_PER_PROPHET = 100;
  // Civ 5's chance of a Great Prophet each turn, once faith reaches its cost: 5%, and 1% more for
  // each point of faith past the cost.
  public static readonly BASE_PROPHET_CHANCE = 5;
  // Until this era a Great Prophet takes all the faith banked, not just its cost.
  public static readonly PROPHET_TAKES_ALL_UNTIL = "industrial";

  private player: Player;
  private pantheonName: string | undefined;
  private religion: FoundedReligion | undefined;
  private holyCity: City | undefined;
  private prophetsEarned = 0;
  // Cities that have come to follow the religion, each paid Initiation Rites' gold once.
  private convertedCities = new Set<City>();

  constructor(player: Player) {
    this.player = player;

    ServerEvents.on({
      eventName: "requestPantheons",
      parentObject: this,
      callback: (data, websocket) => {
        if (this.player.getWebsocket() != websocket) return;

        this.sendPantheons();
      },
      globalEvent: true
    });

    ServerEvents.on({
      eventName: "requestReligionOverview",
      parentObject: this,
      callback: (data, websocket) => {
        if (this.player.getWebsocket() != websocket) return;

        this.sendOverview();
      },
      globalEvent: true
    });

    ServerEvents.on({
      eventName: "requestReligions",
      parentObject: this,
      callback: (data, websocket) => {
        if (this.player.getWebsocket() != websocket) return;

        this.sendReligions(data["unitId"]);
      },
      globalEvent: true
    });

    ServerEvents.on({
      eventName: "foundReligion",
      parentObject: this,
      callback: (data, websocket) => {
        if (this.player.getWebsocket() != websocket) return;

        this.foundReligion(data["name"], data["founderBelief"], data["followerBelief"], data["unitId"]);
      },
      globalEvent: true
    });

    ServerEvents.on({
      eventName: "enhanceReligion",
      parentObject: this,
      callback: (data, websocket) => {
        if (this.player.getWebsocket() != websocket) return;

        this.enhanceReligion(data["followerBelief"], data["enhancerBelief"], data["unitId"]);
      },
      globalEvent: true
    });

    ServerEvents.on({
      eventName: "foundPantheon",
      parentObject: this,
      callback: (data, websocket) => {
        if (this.player.getWebsocket() != websocket) return;

        this.foundPantheon(data["name"]);
      },
      globalEvent: true
    });
  }

  public getPantheonName(): string | undefined {
    return this.pantheonName;
  }

  public getPantheon(): PantheonData | undefined {
    return this.pantheonName ? Pantheons.getByName(this.pantheonName) : undefined;
  }

  public getFounded(): FoundedReligion | undefined {
    return this.religion;
  }

  // Where the religion was founded, whoever owns it now.
  public getHolyCity(): City | undefined {
    return this.holyCity;
  }

  // The pantheon, then the religion's beliefs: whatever of them the player has.
  public getBeliefs(): BeliefData[] {
    const religion = this.religion;
    return [
      this.getPantheon(),
      religion ? Religions.getFounderBelief(religion.founderBelief) : undefined,
      religion ? Religions.getFollowerBelief(religion.followerBelief) : undefined,
      religion?.followerBelief2 ? Religions.getFollowerBelief(religion.followerBelief2) : undefined,
      religion?.enhancerBelief ? Religions.getEnhancerBelief(religion.enhancerBelief) : undefined
    ].filter((belief) => belief);
  }

  public isEnhanced(): boolean {
    return !!this.religion?.enhancerBelief;
  }

  // What the status bar's faith tooltip shows: where the player's faith comes from each turn.
  public getFaithBreakdown() {
    const income = this.player
      .getCities()
      .map((city) => ({ source: city.getName(), amount: city.getStatline({ asArray: false }).faith }))
      .concat(
        Beliefs.getEmpireYieldSources(this.player).map((source) => ({
          source: source.source,
          amount: source.stats.reduce((total, stat) => total + (stat.faith ?? 0), 0)
        }))
      )
      .filter((entry) => entry.amount !== 0);
    return { income, net: income.reduce((total, entry) => total + entry.amount, 0) };
  }

  // 200 Faith for the first, 100 more for each after, a quarter less with Messiah.
  public getProphetCost(): number {
    const cost = PlayerReligion.FIRST_PROPHET_COST + PlayerReligion.COST_PER_PROPHET * this.prophetsEarned;
    return Beliefs.getProphetCost(this.player, cost);
  }

  // The percent chance of a Great Prophet being born this turn: none short of its cost, then 5% and 1%
  // more for each point of faith past it.
  public getProphetChance(): number {
    const faith = this.player.getAccumulatedStats()["faith"] ?? 0;
    const cost = this.getProphetCost();
    if (faith < cost) return 0;

    return Math.min(100, PlayerReligion.BASE_PROPHET_CHANCE + faith - cost);
  }

  // Enough faith, no pantheon yet, and one left to found. The barbarians never found one.
  public canFoundPantheon(): boolean {
    if (this.pantheonName || this.player.isBarbarian() || !this.player.hasClient()) return false;
    if ((this.player.getAccumulatedStats()["faith"] ?? 0) < Pantheons.getCost()) return false;

    return Pantheons.getAvailable().length > 0;
  }

  /** Founds the pantheon, spending the faith it costs. False if the player can't found that one. */
  public foundPantheon(name: string): boolean {
    const pantheon = Pantheons.getAvailable().find((available) => available.name === name);
    if (!pantheon || !this.canFoundPantheon()) return false;

    this.player.addToAccumulatedStat("faith", -Pantheons.getCost());
    this.pantheonName = pantheon.name;

    this.player.getNotifications().addMessage("ICON_FAITH", `You have founded a pantheon: ${pantheon.name}.`);
    this.announceToOthers(pantheon);
    this.applyFounded();
    return true;
  }

  /**
   * Called each turn once faith is banked: whether a Great Prophet is born, by the chance
   * getProphetChance() gives. Before the Industrial Era it takes all the faith banked, after it only
   * its cost. It's born in the holy city while the player holds it, else in their capital.
   */
  public checkForProphet(roll: () => number = Math.random) {
    if (!this.canEarnProphet() || roll() * 100 >= this.getProphetChance()) return;

    const city = this.getProphetBirthCity();
    if (!city.spawnFreeUnit(PlayerReligion.PROPHET)) return;

    const faith = this.player.getAccumulatedStats()["faith"] ?? 0;
    this.player.addToAccumulatedStat("faith", -(this.takesAllFaith() ? faith : this.getProphetCost()));
    this.prophetsEarned++;
    const can = this.religion ? "enhance your religion or spread it" : "found a religion";
    this.player
      .getNotifications()
      .addMessage("ICON_FAITH", `A Great Prophet has been born in ${city.getName()}. In a city, it can ${can}.`);
    this.player.sendTotalStatsUpdate();
  }

  // A pantheon, a city and the faith, and unless the player has founded a religion, one left to found.
  public canEarnProphet(): boolean {
    if (!this.pantheonName || this.player.isBarbarian() || !this.player.hasClient()) return false;
    if (this.player.getCities().length < 1 || this.getProphetChance() <= 0) return false;

    return !!this.religion || Religions.hasRoomForAnother();
  }

  // The player's Great Prophet can found their religion, standing in one of their cities.
  public canFoundReligionWith(prophet: Unit | undefined): boolean {
    if (this.religion || !prophet || prophet.getPlayer() !== this.player) return false;
    if (prophet.getName() !== PlayerReligion.PROPHET) return false;
    if (prophet.getTile().getCity()?.getPlayer() !== this.player) return false;

    return Religions.hasRoomForAnother();
  }

  /**
   * The Great Prophet founds the religion with the two beliefs, and is used up. The city it stands in
   * becomes the holy city. False if it can't, or another religion has the name or either belief.
   */
  public foundReligion(
    name: string,
    founderBeliefName: string,
    followerBeliefName: string,
    prophetId: number
  ): boolean {
    const available = Religions.getAvailable();
    const founderBelief = available.founderBeliefs.find((belief) => belief.name === founderBeliefName);
    const followerBelief = available.followerBeliefs.find((belief) => belief.name === followerBeliefName);
    if (!available.religions.includes(name) || !founderBelief || !followerBelief) return false;

    const prophet = this.getProphet(prophetId);
    if (!this.canFoundReligionWith(prophet)) return false;

    const holyCity = prophet.getTile().getCity();
    prophet.delete();
    this.religion = {
      name,
      founderBelief: founderBelief.name,
      followerBelief: followerBelief.name,
      holyCity: holyCity.getName()
    };
    this.holyCity = holyCity;

    this.player
      .getNotifications()
      .addMessage(
        "ICON_FAITH",
        `You have founded ${name} in ${holyCity.getName()}, with ${founderBelief.name} and ${followerBelief.name}.`
      );
    this.announceReligionToOthers();
    holyCity.getReligion().convertAll(name);
    Religions.onMajorityChanged(holyCity);
    Religions.sendCityReligions([holyCity]);
    this.applyFounded();
    return true;
  }

  // The player's Great Prophet can enhance their religion, standing in one of their cities.
  public canEnhanceWith(prophet: Unit | undefined): boolean {
    if (!this.religion || this.isEnhanced() || !prophet || prophet.getPlayer() !== this.player) return false;
    if (prophet.getName() !== PlayerReligion.PROPHET) return false;
    if (prophet.getTile().getCity()?.getPlayer() !== this.player) return false;

    const available = Religions.getAvailable();
    return available.followerBeliefs.length > 0 && available.enhancerBeliefs.length > 0;
  }

  /**
   * The Great Prophet enhances the religion with a second follower belief and an enhancer belief, and
   * is used up. False if it can't, or another religion has either belief.
   */
  public enhanceReligion(followerBeliefName: string, enhancerBeliefName: string, prophetId: number): boolean {
    const available = Religions.getAvailable();
    const followerBelief = available.followerBeliefs.find((belief) => belief.name === followerBeliefName);
    const enhancerBelief = available.enhancerBeliefs.find((belief) => belief.name === enhancerBeliefName);
    const prophet = this.getProphet(prophetId);
    if (!followerBelief || !enhancerBelief || !this.canEnhanceWith(prophet)) return false;

    prophet.delete();
    this.religion.followerBelief2 = followerBelief.name;
    this.religion.enhancerBelief = enhancerBelief.name;

    this.player
      .getNotifications()
      .addMessage(
        "ICON_FAITH",
        `You have enhanced ${this.religion.name} with ${followerBelief.name} and ${enhancerBelief.name}.`
      );
    this.announceEnhancedToOthers();
    Religions.getCitiesFollowing(this.religion.name).forEach((city) => city.refreshBeliefs());
    this.applyFounded();
    return true;
  }

  // Initiation Rites pays out the first time each city comes to follow the player's religion.
  public onCityConverted(city: City) {
    if (this.convertedCities.has(city)) return;

    this.convertedCities.add(city);
    Beliefs.getGoldOnConversion(this.player).forEach(({ source, gold }) => {
      this.player.addToAccumulatedStat("gold", gold);
      this.player
        .getNotifications()
        .addMessage("ICON_GOLD", `${source}: +${gold} Gold as ${city.getName()} follows ${this.religion.name}.`);
    });
    this.player.sendTotalStatsUpdate();
  }

  // What the client's religion founding window shows: the names and beliefs left, and whether the
  // Great Prophet it was opened from can found or enhance a religion where it stands.
  public sendReligions(prophetId?: number) {
    const available = Religions.getAvailable();
    this.player.sendNetworkEvent({
      event: "religions",
      faith: this.player.getAccumulatedStats()["faith"] ?? 0,
      religion: this.religion ?? null,
      canFound: this.canFoundReligionWith(this.getProphet(prophetId)),
      canEnhance: this.canEnhanceWith(this.getProphet(prophetId)),
      hasPantheon: !!this.pantheonName,
      religions: available.religions,
      founderBeliefs: available.founderBeliefs,
      followerBeliefs: available.followerBeliefs,
      enhancerBeliefs: available.enhancerBeliefs
    });
  }

  // The list the client's pantheon picker shows, and what founding one costs.
  public sendPantheons() {
    this.player.sendNetworkEvent({
      event: "pantheons",
      cost: Pantheons.getCost(),
      faith: this.player.getAccumulatedStats()["faith"] ?? 0,
      pantheon: this.pantheonName ?? null,
      canFound: this.canFoundPantheon(),
      available: Pantheons.getAvailable()
    });
  }

  /**
   * What the client's religion window shows: the pantheon, the religion and its beliefs, each city
   * following them (the player's own with what it gets from them, and other civilizations' following
   * the religion), what the empire gets besides, and all of it added up.
   */
  public sendOverview() {
    const pantheon = this.getPantheon();
    const following = this.getBeliefs().length > 0;
    const ownCities = following ? this.player.getCities().map((city) => this.describeCity(city)) : [];
    const foreignCities = this.religion
      ? Religions.getCitiesFollowing(this.religion.name)
          .filter((city) => city.getPlayer() !== this.player)
          .map((city) => this.describeCity(city))
      : [];
    const cities = [...ownCities, ...foreignCities];
    const empire = following ? Beliefs.getEmpireBonuses(this.player) : {};
    const totals: Record<string, number> = {};
    [...cities.map((city) => city.bonuses), empire]
      .flatMap((bonuses) => Object.entries(bonuses))
      .forEach(([stat, value]) => (totals[stat] = (totals[stat] ?? 0) + value));

    this.player.sendNetworkEvent({
      event: "religionOverview",
      pantheon: PlayerReligion.describe(pantheon),
      religion: this.religion ? { name: this.religion.name, holyCity: this.religion.holyCity } : null,
      prophetCost: this.getProphetCost(),
      hasProphet: this.getProphets().length > 0,
      faith: this.player.getAccumulatedStats()["faith"] ?? 0,
      pantheonCost: Pantheons.getCost(),
      canFoundPantheon: this.canFoundPantheon(),
      founderBelief: PlayerReligion.describe(this.religion && Religions.getFounderBelief(this.religion.founderBelief)),
      followerBelief: PlayerReligion.describe(
        this.religion && Religions.getFollowerBelief(this.religion.followerBelief)
      ),
      followerBelief2: PlayerReligion.describe(
        this.religion?.followerBelief2 && Religions.getFollowerBelief(this.religion.followerBelief2)
      ),
      enhancerBelief: PlayerReligion.describe(
        this.religion?.enhancerBelief && Religions.getEnhancerBelief(this.religion.enhancerBelief)
      ),
      prophetChance: this.getProphetChance(),
      cities,
      empire,
      totals
    });
  }

  // A row of the religion window's city list. Only the player's own cities' bonuses are theirs.
  private describeCity(city: City) {
    const own = city.getPlayer() === this.player;
    return {
      name: city.getName(),
      civilization: own ? null : (city.getPlayer().getCivilizationName() ?? city.getPlayer().getName()),
      followers: this.religion ? city.getReligion().getFollowersOf(this.religion.name) : 0,
      population: city.getPopulation(),
      bonuses: own ? Beliefs.getCityBonuses(city) : {}
    };
  }

  // The holy city while the player holds it, else the capital.
  private getProphetBirthCity(): City {
    const cities = this.player.getCities();
    if (this.holyCity && cities.includes(this.holyCity)) return this.holyCity;

    return cities.find((candidate) => candidate.hasBuilding("Palace")) ?? cities[0];
  }

  private takesAllFaith(): boolean {
    const eras = Technology.getAllEras().map((era) => era.id);
    return eras.indexOf(this.player.getEra().id) < eras.indexOf(PlayerReligion.PROPHET_TAKES_ALL_UNTIL);
  }

  private getProphets(): Unit[] {
    return this.player.getUnits().filter((unit) => unit.getName() === PlayerReligion.PROPHET);
  }

  private getProphet(id: number | undefined): Unit | undefined {
    return this.getProphets().find((unit) => unit.getId() === id);
  }

  private announceReligionToOthers() {
    const civName = this.player.getCivilizationName() ?? this.player.getName();

    Game.getInstance()
      .getPlayers()
      .forEach((other) => {
        if (other === this.player) return;

        other.getNotifications().addMessage("ICON_FAITH", `${civName} has founded ${this.religion.name}.`);
        other.getReligion().sendReligions();
      });
  }

  private announceEnhancedToOthers() {
    const civName = this.player.getCivilizationName() ?? this.player.getName();

    Game.getInstance()
      .getPlayers()
      .forEach((other) => {
        if (other === this.player) return;

        other.getNotifications().addMessage("ICON_FAITH", `${civName} has enhanced ${this.religion.name}.`);
        other.getReligion().sendReligions();
      });
  }

  private announceToOthers(pantheon: PantheonData) {
    const civName = this.player.getCivilizationName() ?? this.player.getName();

    Game.getInstance()
      .getPlayers()
      .forEach((other) => {
        if (other === this.player) return;

        other.getNotifications().addMessage("ICON_FAITH", `${civName} has founded a pantheon: ${pantheon.name}.`);
        other.getReligion().sendPantheons();
      });
  }

  // What a window shows of a pantheon or belief.
  private static describe(belief: BeliefData | undefined) {
    return belief ? { name: belief.name, description: belief.description, not_yet: belief.not_yet ?? [] } : null;
  }

  // A pantheon or religion can change tile yields, every city's stats and the empire's happiness.
  private applyFounded() {
    const territory = this.player.getCities().flatMap((city) => city.getTerritory());
    if (territory.length > 0) GameMap.getInstance().sendTilesToPlayer(this.player, territory);

    this.player.getCities().forEach((city) => city.updateWorkedTiles({ sendStatUpdate: true }));
    this.player.sendTotalStatsUpdate();
    this.sendPantheons();
    this.sendReligions();
  }
}
