import { WebSocket } from "ws";
import { ServerEvents } from "./Events";
import { Game } from "./Game";
import { City } from "./city/City";
import { PlayerVisibility } from "./map/PlayerVisibility";
import { Technology } from "./research/Technology";
import { Unit } from "./unit/Unit";

// Stats that pool across a player's whole empire, as opposed to city-specific
// concepts like population/morale/food/defense which don't total meaningfully.
export interface TotalStats {
  science: number;
  gold: number;
  production: number;
  faith: number;
  culture: number;
}

// Stats whose per-turn rate above gets banked into a running total each turn,
// rather than just reflecting the current rate. Add a key here (e.g. "faith") to
// make another stat accumulate - no other changes needed, client included.
const ACCUMULATING_STATS: (keyof TotalStats)[] = ["gold"];

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
  private visibility: PlayerVisibility;

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
    this.visibility = new PlayerVisibility(this);

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
        this.accumulateResearch();
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
      eventName: "cancelResearch",
      parentObject: this,
      callback: (data, websocket) => {
        if (this.wsConnection != websocket) return;

        this.currentResearch = null;
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

  public hasResearchedTech(techName: string): boolean {
    return this.researchedTechs.has(techName);
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

    this.sendTotalStatsUpdate();
  }

  public sendTotalStatsUpdate() {
    this.sendNetworkEvent({
      event: "updateTotalStats",
      stats: this.getTotalStats(),
      accumulatedStats: this.getAccumulatedStats()
    });
  }

  public getCurrentResearch(): CurrentResearch | null {
    return this.currentResearch;
  }

  public sendResearchUpdate() {
    this.sendNetworkEvent({
      event: "updateResearch",
      currentResearch: this.currentResearch,
      researchedTechs: Array.from(this.researchedTechs)
    });
  }

  private chooseResearch(techName: string) {
    const tech = Technology.createFromName(techName);
    if (!tech || this.researchedTechs.has(tech.getName())) return;

    const missingPrerequisite = tech.getPrerequisites().some((prereq) => !this.researchedTechs.has(prereq));
    if (missingPrerequisite) return;

    this.currentResearch = { techName: tech.getName(), assetName: tech.getAssetName(), progress: 0, cost: tech.getCost() };
    this.sendResearchUpdate();
  }

  // Mirrors accumulateTurnStats: banks this turn's science against whatever is
  // currently being researched, completing it once the cost is met.
  private accumulateResearch() {
    if (!this.currentResearch) return;

    this.currentResearch.progress += this.getTotalStats().science;

    if (this.currentResearch.progress >= this.currentResearch.cost) {
      this.researchedTechs.add(this.currentResearch.techName);
      this.currentResearch = null;
      // A new tech can unlock improvements for this player's Builders.
      this.units.forEach((unit) => unit.sendActionsToOwner());
    }

    this.sendResearchUpdate();
  }

  public sendAvailableTechs() {
    this.sendNetworkEvent({
      event: "updateAvailableTechs",
      technologies: Technology.getAllTechnologies().map((tech) => tech.toJSON()),
      eras: Technology.getAllEras()
    });
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
