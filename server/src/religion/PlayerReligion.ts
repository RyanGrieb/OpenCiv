import { ServerEvents } from "../Events";
import { Game } from "../Game";
import { GameMap } from "../map/GameMap";
import type { City } from "../city/City";
import type { Player } from "../Player";
import type { Unit } from "../unit/Unit";
import { BeliefData, Beliefs } from "./Beliefs";
import { PantheonData, Pantheons } from "./Pantheons";
import { Religions } from "./Religions";

// A religion a player founded, by name, with the founder and follower belief chosen for it.
export interface FoundedReligion {
  name: string;
  founderBelief: string;
  followerBelief: string;
  holyCity: string;
}

/**
 * A player's faith-bought beliefs. Once their faith reaches Pantheons.getCost() they may found a
 * pantheon no other civilization has. With a pantheon, once it reaches getProphetCost(), a Great
 * Prophet is born, and in one of the player's cities the prophet founds a religion with a founder and
 * a follower belief. That holy city follows it at once; from there it spreads to the cities around it,
 * the player's or anyone's (see Religions.spreadPressure()).
 */
export class PlayerReligion {
  public static readonly PROPHET = "Great Prophet";
  // Brave New World's standard-speed Great Prophet costs: 200 Faith for a player's first, 100 more for each after.
  public static readonly FIRST_PROPHET_COST = 200;
  public static readonly COST_PER_PROPHET = 100;

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

  // The pantheon, then the religion's founder and follower beliefs: whatever of them the player has.
  public getBeliefs(): BeliefData[] {
    return [
      this.getPantheon(),
      this.religion ? Religions.getFounderBelief(this.religion.founderBelief) : undefined,
      this.religion ? Religions.getFollowerBelief(this.religion.followerBelief) : undefined
    ].filter((belief) => belief);
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

  public getProphetCost(): number {
    return PlayerReligion.FIRST_PROPHET_COST + PlayerReligion.COST_PER_PROPHET * this.prophetsEarned;
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
   * A Great Prophet is born once the player has a pantheon, no religion and no prophet yet, and the
   * faith for one, while a religion is left to found. Called each turn once faith is banked.
   */
  public checkForProphet() {
    if (!this.canEarnProphet()) return;

    const cities = this.player.getCities();
    const city = cities.find((candidate) => candidate.hasBuilding("Palace")) ?? cities[0];
    if (!city.spawnFreeUnit(PlayerReligion.PROPHET)) return;

    this.player.addToAccumulatedStat("faith", -this.getProphetCost());
    this.prophetsEarned++;
    this.player
      .getNotifications()
      .addMessage("ICON_FAITH", `A Great Prophet has been born in ${city.getName()}. In a city, it can found a religion.`);
    this.player.sendTotalStatsUpdate();
  }

  public canEarnProphet(): boolean {
    if (this.religion || !this.pantheonName || this.player.isBarbarian() || !this.player.hasClient()) return false;
    if (this.getProphets().length > 0 || this.player.getCities().length < 1) return false;
    if ((this.player.getAccumulatedStats()["faith"] ?? 0) < this.getProphetCost()) return false;

    return Religions.hasRoomForAnother();
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
  public foundReligion(name: string, founderBeliefName: string, followerBeliefName: string, prophetId: number): boolean {
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
  // Great Prophet it was opened from can found a religion where it stands.
  public sendReligions(prophetId?: number) {
    const available = Religions.getAvailable();
    this.player.sendNetworkEvent({
      event: "religions",
      faith: this.player.getAccumulatedStats()["faith"] ?? 0,
      religion: this.religion ?? null,
      canFound: this.canFoundReligionWith(this.getProphet(prophetId)),
      hasPantheon: !!this.pantheonName,
      religions: available.religions,
      founderBeliefs: available.founderBeliefs,
      followerBeliefs: available.followerBeliefs
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
   * following them with what it gets from them, what the empire gets besides, and all of it added up.
   */
  public sendOverview() {
    const pantheon = this.getPantheon();
    const following = this.getBeliefs().length > 0;
    const cities = following
      ? this.player.getCities().map((city) => ({ name: city.getName(), bonuses: Beliefs.getCityBonuses(city) }))
      : [];
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
      cities,
      empire,
      totals
    });
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
