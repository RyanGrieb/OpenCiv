import { WebSocket } from "ws";
import { ServerEvents } from "./Events";
import { Game } from "./Game";
import { City } from "./city/City";
import { PlayerDiplomacy } from "./diplomacy/PlayerDiplomacy";
import { CityConnections } from "./economy/CityConnections";
import { PlayerTradeRoutes } from "./economy/PlayerTradeRoutes";
import { PlayerTreasury } from "./economy/PlayerTreasury";
import { PlayerHappiness } from "./happiness/PlayerHappiness";
import { GameMap } from "./map/GameMap";
import { PlayerVisibility } from "./map/PlayerVisibility";
import { PlayerNotifications } from "./notification/PlayerNotifications";
import { Beliefs } from "./religion/Beliefs";
import { PlayerReligion } from "./religion/PlayerReligion";
import { ReligiousUnits } from "./religion/ReligiousUnits";
import { ResearchPath } from "./research/ResearchPath";
import { TechEffects } from "./research/TechEffects";
import { EraData, Technology } from "./research/Technology";
import { Unit } from "./unit/Unit";

// Stats that pool across a player's whole empire, as opposed to city-specific
// concepts like population/food/defense which don't total meaningfully.
export interface TotalStats {
  science: number;
  gold: number;
  production: number;
  faith: number;
  culture: number;
}

// Stats whose per-turn rate above gets banked into a running total each turn,
// rather than just reflecting the current rate. Add a key here to make another
// stat accumulate - no other changes needed, client included.
const ACCUMULATING_STATS: (keyof TotalStats)[] = ["gold", "faith"];

export interface CurrentResearch {
  techName: string;
  assetName: string;
  progress: number;
  cost: number;
}

/**
 * Represents a player in the game.
 */
export class Player {
  /** The name of the player. */
  private name: string;
  /** The WebSocket connection of the player. Absent for a player the server runs itself, like the barbarians. */
  private wsConnection?: WebSocket;
  /** Whether the player has loaded into the game. */
  private loadedIn: boolean;
  /** The callback to execute when the player has loaded into the game. */
  private loadedInCallback: () => void;
  /** The callback to execute when the player resizes their window. */
  private resizeWindowCallback: () => void;
  private requestedNextTurn: boolean;
  private civilizationData: Record<string, any>;
  private cities: City[];
  private units: Unit[];
  private accumulatedStats: Map<string, number>;
  private currentResearch: CurrentResearch | null;
  private researchedTechs: Set<string>;
  // Techs to research after the current one, in order (Civ 5's research queue).
  private researchQueue: string[];
  // Science put into techs that were started and then switched away from, kept for when they're picked again.
  private techProgress: Map<string, number>;
  // The science rate the research tree's turn counts were last sent at, so a new rate resends them.
  private researchSentAtScience: number;
  private visibility: PlayerVisibility;
  private notifications: PlayerNotifications;
  private diplomacy: PlayerDiplomacy;
  private treasury: PlayerTreasury;
  private connections: CityConnections;
  private tradeRoutes: PlayerTradeRoutes;
  private happiness: PlayerHappiness;
  private religion: PlayerReligion;
  // Free techs (from a wonder) banked while nothing was being researched: the next tech chosen is free.
  private freeTechs: number;

  /**
   * Creates a new player object.
   * @param name The name of the player.
   * @param wsConnection The WebSocket connection of the player, or none for a player the server runs itself.
   */
  constructor(name: string, wsConnection?: WebSocket) {
    this.name = name;
    this.wsConnection = wsConnection;
    this.loadedIn = false;
    this.requestedNextTurn = false;
    this.cities = [];
    this.units = [];
    this.accumulatedStats = new Map();
    this.currentResearch = null;
    this.researchedTechs = new Set();
    this.researchQueue = [];
    this.techProgress = new Map();
    this.researchSentAtScience = 0;
    this.visibility = new PlayerVisibility(this);
    this.notifications = new PlayerNotifications(this);
    this.diplomacy = new PlayerDiplomacy(this);
    this.treasury = new PlayerTreasury(this);
    this.connections = new CityConnections(this);
    this.tradeRoutes = new PlayerTradeRoutes(this);
    this.happiness = new PlayerHappiness(this);
    this.religion = new PlayerReligion(this);
    this.freeTechs = 0;

    // Add event listener for when the player disconnects
    this.wsConnection?.on("close", (data) => {
      console.log(name + " quit");
      ServerEvents.call("playerQuit", {}, this.wsConnection);
      Game.getInstance().getPlayers().delete(this.name);

      // Send playerQuit data to other connected players
      for (const player of Array.from(Game.getInstance().getPlayers().values())) {
        if (player === this) {
          continue;
        }
        player.sendNetworkEvent({ event: "playerQuit", playerName: this.name });
      }
    });

    // Add event listener for when the player has loaded into the game
    ServerEvents.on({
      eventName: "loadedIn",
      parentObject: this,
      callback: (data, websocket) => {
        if (this.wsConnection != websocket) return;

        this.loadedIn = true;
        this.loadedInCallback.call(undefined);
      },
      globalEvent: true
    });

    ServerEvents.on({
      eventName: "resizeWindow",
      parentObject: this,
      callback: (data, websocket) => {
        if (this.wsConnection != websocket) return;

        this.resizeWindowCallback.call(undefined);
      },
      globalEvent: true
    });

    // "nextTurn" is a global broadcast (no websocket to filter by) fired once per
    // turn increment - bank this turn's rate for each accumulating stat.
    ServerEvents.on({
      eventName: "nextTurn",
      parentObject: this,
      callback: () => {
        this.accumulateTurnStats();
        this.tradeRoutes.passTurn();
        this.religion.checkForProphet();
        ReligiousUnits.applyAttrition(this);
        this.accumulateResearch();
        this.diplomacy.passTurn();
      },
      globalEvent: true
    });

    ServerEvents.on({
      eventName: "requestTotalStats",
      parentObject: this,
      callback: (data, websocket) => {
        if (this.wsConnection != websocket) return;

        this.sendTotalStatsUpdate();
      },
      globalEvent: true
    });

    ServerEvents.on({
      eventName: "requestResearch",
      parentObject: this,
      callback: (data, websocket) => {
        if (this.wsConnection != websocket) return;

        this.sendResearchUpdate();
      },
      globalEvent: true
    });

    ServerEvents.on({
      eventName: "requestAvailableTechs",
      parentObject: this,
      callback: (data, websocket) => {
        if (this.wsConnection != websocket) return;

        this.sendAvailableTechs();
      },
      globalEvent: true
    });

    ServerEvents.on({
      eventName: "chooseResearch",
      parentObject: this,
      callback: (data, websocket) => {
        if (this.wsConnection != websocket) return;

        this.chooseResearch(data["techName"]);
      },
      globalEvent: true
    });

    ServerEvents.on({
      eventName: "requestFreeTechs",
      parentObject: this,
      callback: (data, websocket) => {
        if (this.wsConnection != websocket) return;

        this.sendFreeTechs();
      },
      globalEvent: true
    });

    ServerEvents.on({
      eventName: "chooseFreeTech",
      parentObject: this,
      callback: (data, websocket) => {
        if (this.wsConnection != websocket) return;

        this.chooseFreeTech(data["techName"]);
      },
      globalEvent: true
    });

    ServerEvents.on({
      eventName: "cancelResearch",
      parentObject: this,
      callback: (data, websocket) => {
        if (this.wsConnection != websocket) return;

        this.setCurrentResearch(null);
        this.researchQueue = [];
        this.sendResearchUpdate();
      },
      globalEvent: true
    });
  }

  /**
   * Instruct all players to zoom onto a specified location.
   * @param x The x coordinate of the location.
   * @param y The y coordinate of the location.
   * @param zoomAmount The zoom amount to apply.
   */
  public static allZoomOnto(x: number, y: number, zoomAmount: number) {
    for (let player of Game.getInstance().getPlayers().values()) {
      player.zoomToLocation(x, y, zoomAmount);
    }
  }

  /**
   * Registers a callback to execute when the player has loaded into the game.
   * @param callback The callback function to execute.
   */
  public onLoadedIn(callback: () => void) {
    this.loadedInCallback = callback;
  }

  public onResizeWindow(callback: () => void) {
    this.resizeWindowCallback = callback;
  }

  public setRequestedNextTurn(value: boolean) {
    this.requestedNextTurn = value;
  }

  public hasRequestedNextTurn() {
    return this.requestedNextTurn;
  }

  public setCivilizationData(civilizationData: Record<string, any>) {
    this.civilizationData = civilizationData;
  }

  /**
   * Send a network packet to instruct the client to zoom onto a specified location.
   * @param x The x coordinate of the location.
   * @param y The y coordinate of the location.
   * @param zoomAmount The zoom amount to apply.
   */
  public zoomToLocation(x: number, y: number, zoomAmount: number) {
    this.sendNetworkEvent({
      event: "zoomToLocation",
      x: x,
      y: y,
      zoomAmount: zoomAmount
    });
  }

  /**
   * Sends a network event to the player.
   * @param event The network event to send.
   */
  public sendNetworkEvent(event: Record<string, any>) {
    this.wsConnection?.send(JSON.stringify(event));
  }

  /** Whether a person is playing this player, rather than the server (e.g. the barbarians). */
  public hasClient(): boolean {
    return this.wsConnection !== undefined;
  }

  /**
   * Returns the name of the player.
   * @returns The name of the player.
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Returns the WebSocket connection of the player.
   * @returns The WebSocket connection of the player.
   */
  public getWebsocket() {
    return this.wsConnection;
  }

  public isLoadedIn() {
    return this.loadedIn;
  }

  public toJSON() {
    return {
      name: this.name,
      civData: this.civilizationData,
      requestedNextTurn: this.requestedNextTurn
    };
  }

  public getCivilizationData() {
    return this.civilizationData;
  }

  // Undefined until the player picks (or is assigned) a civ in the lobby.
  public getCivilizationName(): string | undefined {
    return this.civilizationData?.["name"];
  }

  // A SpriteRegion key on the client, e.g. ICON_ROME.
  public getCivIconName(): string {
    return this.civilizationData?.["icon_name"] ?? "ICON_UNKNOWN";
  }

  // Only set on the barbarians (config/barbarians.yml), which the server plays itself.
  public isBarbarian(): boolean {
    return this.civilizationData?.["barbarian"] === true;
  }

  /**
   * Checks for exsting city names, and returns the next available city name.
   */
  public getNextAvailableCityName(): string {
    const eixtingNames = [];
    const allCityNames = this.civilizationData["cities"];
    for (const city of this.cities) {
      eixtingNames.push(city.getName());
    }

    for (const name of allCityNames) {
      if (!eixtingNames.includes(name)) {
        return name;
      }
    }

    return "MAX_CITIES_REACHED";
  }

  public getCities() {
    return this.cities;
  }

  public removeCity(city: City) {
    this.cities = this.cities.filter((existingCity) => existingCity !== city);
  }

  public getTotalStats(): TotalStats {
    const totals: TotalStats = {
      science: 0,
      gold: 0,
      production: 0,
      faith: 0,
      culture: 0
    };

    for (const city of this.cities) {
      const cityStats = city.getStatline({ asArray: false });
      totals.science += cityStats.science;
      totals.gold += cityStats.gold;
      totals.production += cityStats.production;
      totals.faith += cityStats.faith;
      totals.culture += cityStats.culture;
    }

    const empire = Beliefs.getEmpireYields(this);
    totals.gold += empire.gold ?? 0;
    totals.faith += empire.faith ?? 0;
    totals.culture += empire.culture ?? 0;
    totals.gold += this.treasury.getEmpireIncome();
    totals.gold -= this.treasury.getUpkeep();

    return totals;
  }

  public getAccumulatedStats(): Record<string, number> {
    return Object.fromEntries(this.accumulatedStats);
  }

  // A one-off lump into a banked stat, e.g. the gold for clearing a barbarian camp.
  public addToAccumulatedStat(stat: keyof TotalStats, amount: number) {
    this.accumulatedStats.set(stat, (this.accumulatedStats.get(stat) ?? 0) + amount);
    this.sendTotalStatsUpdate();
  }

  // The latest era any of this player's techs belongs to (see Technology.getEraOf()).
  public getEra(): EraData {
    return Technology.getEraOf(this.researchedTechs);
  }

  public hasResearchedTech(techName: string): boolean {
    return this.researchedTechs.has(techName);
  }

  // False once every tech is researched, so there's nothing left to choose.
  public hasTechsLeftToResearch(): boolean {
    return Technology.getAllTechnologies().some((tech) => !this.researchedTechs.has(tech.getName()));
  }

  // Science from elsewhere than the turn's yields (Interfaith Dialogue), toward the current research.
  public addScience(amount: number) {
    if (!this.currentResearch || amount <= 0) return;

    this.currentResearch.progress += amount;
    if (this.currentResearch.progress >= this.currentResearch.cost) {
      this.completeResearch();
      return;
    }

    this.sendResearchUpdate();
  }

  // For the startWithAllTechs game option. Sent to the client once it asks for its research.
  public researchAllTechs() {
    Technology.getAllTechnologies().forEach((tech) => this.researchedTechs.add(tech.getName()));
  }

  private accumulateTurnStats() {
    const rates = this.getTotalStats();

    for (const stat of ACCUMULATING_STATS) {
      const current = this.accumulatedStats.get(stat) ?? 0;
      this.accumulatedStats.set(stat, current + rates[stat]);
    }
    this.connections.bankTurn();

    this.sendTotalStatsUpdate();
  }

  public sendTotalStatsUpdate() {
    const statusChanged = this.happiness.announceStatusChange();
    // The tech tree's turn counts go stale when the science rate changes.
    if (this.getTotalStats().science !== this.researchSentAtScience) this.sendResearchUpdate();

    this.sendNetworkEvent({
      event: "updateTotalStats",
      stats: this.getTotalStats(),
      accumulatedStats: this.getAccumulatedStats(),
      goldBreakdown: this.treasury.getBreakdown(),
      happinessBreakdown: this.happiness.getBreakdown(),
      faithBreakdown: this.religion.getFaithBreakdown(),
      tradeRoutes: this.tradeRoutes.getSummary(),
      connectedCities: this.connections.getConnectedCities().map((city) => city.getName())
    });

    // Every city's growth depends on the status, so each one's food needs resending.
    if (statusChanged) this.cities.forEach((city) => city.sendStatUpdate(this));
  }

  public getCurrentResearch(): CurrentResearch | null {
    return this.currentResearch;
  }

  public sendResearchUpdate() {
    this.researchSentAtScience = this.getTotalStats().science;
    this.sendNetworkEvent({
      event: "updateResearch",
      currentResearch: this.currentResearch,
      researchedTechs: Array.from(this.researchedTechs),
      queue: this.researchQueue,
      turns: this.getTurnsToResearch()
    });
  }

  public getResearchQueue(): string[] {
    return this.researchQueue;
  }

  /**
   * Turns each unresearched tech takes on its own at this player's science rate, as Civ 5's tech tree
   * shows them: the science still to put into it, not the techs needed before it. null with no science
   * coming in.
   */
  public getTurnsToResearch(): Record<string, number | null> {
    const science = this.getTotalStats().science;
    const turns: Record<string, number | null> = {};

    for (const tech of Technology.getAllTechnologies()) {
      const techName = tech.getName();
      if (this.researchedTechs.has(techName)) continue;

      const remaining = this.getResearchCost(techName) - this.getResearchProgress(techName);
      turns[techName] = science > 0 ? Math.max(1, Math.ceil(remaining / science)) : null;
    }
    return turns;
  }

  /**
   * A free tech, e.g. from the Great Library. As in Civ 5 the player picks it, from the techs they could
   * research now: the turn button reads Pick Free Tech until they do (see PlayerNotifications).
   */
  public grantFreeTech(source: string) {
    if (!this.hasTechsLeftToResearch()) return;

    this.freeTechs++;
    this.notifications.addMessage("ICON_SCIENCE", `${source} gives you a free tech.`);
  }

  public getFreeTechs(): number {
    return this.freeTechs;
  }

  /** The techs a free tech can be spent on: every one not researched yet whose prerequisites are. */
  public getFreeTechChoices(): Technology[] {
    if (this.freeTechs < 1) return [];

    return Technology.getAllTechnologies().filter((tech) => this.canResearch(tech));
  }

  /** The free techs left and what they can go on. The whole tree comes too, for the tech's detail window. */
  public sendFreeTechs() {
    this.sendNetworkEvent({
      event: "freeTechs",
      count: this.freeTechs,
      choices: this.getFreeTechChoices().map((tech) => tech.getName()),
      technologies: Technology.getAllTechnologies().map((tech) => tech.toJSON(this.getCivilizationName()))
    });
  }

  private chooseFreeTech(techName: string) {
    const tech = this.getFreeTechChoices().find((choice) => choice.getName() === techName);
    if (!tech) return;

    this.freeTechs--;
    if (this.currentResearch?.techName === tech.getName()) this.currentResearch = null;
    this.completeTech(tech.getName(), tech.getAssetName());
    this.sendFreeTechs();
  }

  private canResearch(tech: Technology): boolean {
    if (this.researchedTechs.has(tech.getName())) return false;

    return tech.getPrerequisites().every((prereq) => this.researchedTechs.has(prereq));
  }

  // A tech that isn't available yet queues every tech on the way to it, as in Civ 5.
  private chooseResearch(techName: string) {
    const path = ResearchPath.to(techName, (name) => this.researchedTechs.has(name));
    if (path.length < 1) return;

    this.setCurrentResearch(path[0]);
    this.researchQueue = path.slice(1);
    this.sendResearchUpdate();
  }

  // Switching away keeps the science already put into the old tech for later.
  private setCurrentResearch(techName: string | null) {
    if (this.currentResearch) this.techProgress.set(this.currentResearch.techName, this.currentResearch.progress);

    const tech = techName ? Technology.createFromName(techName) : undefined;
    if (!tech || !this.canResearch(tech)) {
      this.currentResearch = null;
      return;
    }

    this.currentResearch = {
      techName: tech.getName(),
      assetName: tech.getAssetName(),
      progress: this.getResearchProgress(tech.getName()),
      cost: this.getResearchCost(tech.getName())
    };
  }

  // Starts the next queued tech once nothing is being researched, skipping any that came in some other way.
  private advanceResearchQueue() {
    this.researchQueue = this.researchQueue.filter((techName) => !this.researchedTechs.has(techName));
    if (this.currentResearch || this.researchQueue.length < 1) return;

    this.setCurrentResearch(this.researchQueue.shift());
  }

  private getResearchProgress(techName: string): number {
    if (this.currentResearch?.techName === techName) return this.currentResearch.progress;
    return this.techProgress.get(techName) ?? 0;
  }

  // A tech's science cost, scaled by the techCostPercent game option.
  private getResearchCost(techName: string): number {
    const tech = Technology.createFromName(techName);
    const costPercent = Game.getInstance().getGameOptions().techCostPercent;
    return Math.max(1, Math.round(((tech?.getCost() ?? 0) * costPercent) / 100));
  }

  // Mirrors accumulateTurnStats: banks this turn's science against whatever is
  // currently being researched, completing it once the cost is met.
  private accumulateResearch() {
    if (!this.currentResearch) return;

    this.currentResearch.progress += this.getTotalStats().science;

    if (this.currentResearch.progress >= this.currentResearch.cost) {
      this.completeResearch();
      return;
    }

    this.sendResearchUpdate();
  }

  // Finishes the tech being researched, once the science is in.
  private completeResearch() {
    const { techName, assetName } = this.currentResearch;
    this.currentResearch = null;
    this.completeTech(techName, assetName);
  }

  // Adds a tech to the researched ones, whether the science is in or it came free.
  private completeTech(techName: string, assetName: string) {
    const previousEra = this.getEra();
    this.researchedTechs.add(techName);
    this.techProgress.delete(techName);
    this.advanceResearchQueue();
    this.notifications.addMessage(assetName, `You have discovered ${techName}.`);
    // A new tech can unlock improvements for this player's Builders.
    this.units.forEach((unit) => unit.sendActionsToOwner());
    // ...and make units their cities had queued obsolete.
    this.cities.forEach((city) => city.removeObsoleteUnitsFromQueue());
    this.sendTilesChangedByTech(techName);
    if (this.getEra().id !== previousEra.id) this.onEnteredEra();
    else if (City.changesWallLook(techName)) this.cities.forEach((city) => city.sendAppearanceUpdate());
    this.sendResearchUpdate();
  }

  // A new era rebuilds this player's cities in its style, as in Civ 5.
  private onEnteredEra() {
    const era = this.getEra();
    this.notifications.addMessage(`TILE_CITY_${era.id.toUpperCase()}_1`, `You have entered the ${era.name}.`);
    this.cities.forEach((city) => city.sendAppearanceUpdate());
  }

  // Resends the tiles a new tech changes for this player - resources it reveals, tiles it boosts - and
  // updates their cities' yields to match.
  private sendTilesChangedByTech(techName: string) {
    const changedTiles = GameMap.getInstance()
      .getTiles()
      .flat()
      .filter((tile) => this.visibility.hasDiscovered(tile) && TechEffects.changesTile(techName, tile));
    if (changedTiles.length < 1) return;

    GameMap.getInstance().sendTilesToPlayer(this, changedTiles);
    this.cities.forEach((city) => city.updateWorkedTiles({ sendStatUpdate: true }));
  }

  public sendAvailableTechs() {
    this.sendNetworkEvent({
      event: "updateAvailableTechs",
      technologies: Technology.getAllTechnologies().map((tech) => tech.toJSON(this.getCivilizationName())),
      eras: Technology.getAllEras()
    });
  }

  public getNotifications() {
    return this.notifications;
  }

  /** Where this player's gold comes from and goes, and what it can afford. */
  public getTreasury() {
    return this.treasury;
  }

  /** Which of this player's cities are connected to their capital, and what their roads cost. */
  public getConnections() {
    return this.connections;
  }

  /** The trade routes this player's Caravans and Cargo Ships run. */
  public getTradeRoutes() {
    return this.tradeRoutes;
  }

  /** The empire-wide happiness, and what unhappiness costs this player. */
  public getHappiness() {
    return this.happiness;
  }

  /** This player's faith-bought beliefs: their pantheon. */
  public getReligion() {
    return this.religion;
  }

  /** Who this player has met, and who they're at war with. */
  public getDiplomacy() {
    return this.diplomacy;
  }

  /** This player's fog of war - what they've discovered, and what they can see right now. */
  public getVisibility() {
    return this.visibility;
  }

  public getUnits() {
    return this.units;
  }

  public addUnit(unit: Unit) {
    this.units.push(unit);
  }

  public removeUnit(unit: Unit) {
    this.units = this.units.filter((u) => u !== unit);
  }
}
