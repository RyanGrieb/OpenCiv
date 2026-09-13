import { WebSocket } from "ws";
import { ServerEvents } from "./Events";
import { Game } from "./Game";
import { City } from "./city/City";
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

/**
 * Represents a player in the game.
 */
export class Player {
  /** The name of the player. */
  private name: string;
  /** The WebSocket connection of the player. */
  private wsConnection: WebSocket;
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

  /**
   * Creates a new player object.
   * @param name The name of the player.
   * @param wsConnection The WebSocket connection of the player.
   */
  constructor(name: string, wsConnection: WebSocket) {
    this.name = name;
    this.wsConnection = wsConnection;
    this.loadedIn = false;
    this.requestedNextTurn = false;
    this.cities = [];
    this.units = [];
    this.accumulatedStats = new Map();

    // Add event listener for when the player disconnects
    this.wsConnection.on("close", (data) => {
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
    this.wsConnection.send(JSON.stringify(event));
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
