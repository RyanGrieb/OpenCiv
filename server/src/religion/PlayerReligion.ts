import { ServerEvents } from "../Events";
import { Game } from "../Game";
import { GameMap } from "../map/GameMap";
import type { City } from "../city/City";
import type { Player } from "../Player";
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
 * pantheon no other civilization has; with a pantheon, once it reaches Religions.getCost(), a religion
 * with a founder and a follower belief. Either spends the faith. Every one of the player's own cities
 * follows their religion; religions don't spread to other civilizations yet.
 */
export class PlayerReligion {
  private player: Player;
  private pantheonName: string | undefined;
  private religion: FoundedReligion | undefined;
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

        this.sendReligions();
      },
      globalEvent: true
    });

    ServerEvents.on({
      eventName: "foundReligion",
      parentObject: this,
      callback: (data, websocket) => {
        if (this.player.getWebsocket() != websocket) return;

        this.foundReligion(data["name"], data["founderBelief"], data["followerBelief"]);
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

  // The pantheon, then the religion's founder and follower beliefs: whatever of them the player has.
  public getBeliefs(): BeliefData[] {
    return [
      this.getPantheon(),
      this.religion ? Religions.getFounderBelief(this.religion.founderBelief) : undefined,
      this.religion ? Religions.getFollowerBelief(this.religion.followerBelief) : undefined
    ].filter((belief) => belief);
  }

  // What the status bar's faith tooltip shows: the pantheon and religion founded, or what the next costs.
  public getFaithBreakdown() {
    const pantheon = this.getPantheon();
    return {
      pantheon: pantheon ? { name: pantheon.name, description: pantheon.description } : null,
      pantheonCost: Pantheons.getCost(),
      pantheonsLeft: Pantheons.getAvailable().length,
      religion: this.religion?.name ?? null,
      religionCost: Religions.getCost(),
      religionsLeft: Religions.getAvailable().religions.length
    };
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

  // A pantheon, enough faith, no religion yet, a city to be its holy city, and a name and beliefs left.
  public canFoundReligion(): boolean {
    if (this.religion || !this.pantheonName || this.player.isBarbarian() || !this.player.hasClient()) return false;
    if (this.player.getCities().length < 1) return false;
    if ((this.player.getAccumulatedStats()["faith"] ?? 0) < Religions.getCost()) return false;

    const available = Religions.getAvailable();
    return (
      available.religions.length > 0 && available.founderBeliefs.length > 0 && available.followerBeliefs.length > 0
    );
  }

  /**
   * Founds the religion with the two beliefs, spending the faith it costs. Its holy city is the capital.
   * False if the player can't found it, or another religion has the name or either belief.
   */
  public foundReligion(name: string, founderBeliefName: string, followerBeliefName: string): boolean {
    const available = Religions.getAvailable();
    const founderBelief = available.founderBeliefs.find((belief) => belief.name === founderBeliefName);
    const followerBelief = available.followerBeliefs.find((belief) => belief.name === followerBeliefName);
    if (!available.religions.includes(name) || !founderBelief || !followerBelief) return false;
    if (!this.canFoundReligion()) return false;

    this.player.addToAccumulatedStat("faith", -Religions.getCost());
    const cities = this.player.getCities();
    const holyCity = cities.find((city) => city.hasBuilding("Palace")) ?? cities[0];
    this.religion = {
      name,
      founderBelief: founderBelief.name,
      followerBelief: followerBelief.name,
      holyCity: holyCity.getName()
    };

    this.player
      .getNotifications()
      .addMessage(
        "ICON_FAITH",
        `You have founded ${name} in ${holyCity.getName()}, with ${founderBelief.name} and ${followerBelief.name}.`
      );
    this.announceReligionToOthers();
    cities.forEach((city) => this.convert(city));
    this.applyFounded();
    return true;
  }

  // A city the player settled or captured comes to follow their religion.
  public onCityJoined(city: City) {
    if (!this.religion) return;

    this.convert(city);
    this.player.sendTotalStatsUpdate();
  }

  // What the client's religion founding window shows: names and beliefs left, and what founding costs.
  public sendReligions() {
    const available = Religions.getAvailable();
    this.player.sendNetworkEvent({
      event: "religions",
      cost: Religions.getCost(),
      faith: this.player.getAccumulatedStats()["faith"] ?? 0,
      religion: this.religion ?? null,
      canFound: this.canFoundReligion(),
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
      religionCost: Religions.getCost(),
      canFoundReligion: this.canFoundReligion(),
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

  // Initiation Rites pays out the first time each city follows the religion.
  private convert(city: City) {
    if (this.convertedCities.has(city)) return;

    this.convertedCities.add(city);
    Beliefs.getGoldOnConversion(this.player).forEach(({ source, gold }) => {
      this.player.addToAccumulatedStat("gold", gold);
      this.player
        .getNotifications()
        .addMessage("ICON_GOLD", `${source}: +${gold} Gold as ${city.getName()} follows ${this.religion.name}.`);
    });
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
