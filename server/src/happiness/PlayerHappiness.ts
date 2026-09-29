import { Game } from "../Game";
import { DefaultGameOptions } from "../GameOptions";
import { Player } from "../Player";
import { Improvement } from "../map/Improvement";
import { MapResources } from "../map/MapResources";
import { Tile } from "../map/Tile";
import { CombatModifier } from "../unit/Combat";

// One line of the happiness breakdown the status bar's tooltip shows, e.g. { source: "Citrus", amount: 4 }.
export interface HappinessEntry {
  source: string;
  amount: number;
}

export type HappinessStatus = "content" | "unhappy" | "veryUnhappy";

export interface HappinessBreakdown {
  sources: HappinessEntry[];
  unhappiness: HappinessEntry[];
  // Happiness minus unhappiness: what the status bar shows.
  net: number;
  status: HappinessStatus;
  // What the status costs the empire, e.g. "City growth -75%". Empty while content.
  effects: string[];
}

/**
 * Civ 5's empire-wide happiness. Every player starts with some happiness, each city and each citizen
 * costs some, and luxury resources, buildings and wonders make it back. Below zero the empire is
 * unhappy and its cities grow slowly; at VERY_UNHAPPY_THRESHOLD or below they stop growing, can't
 * train Settlers, and its units fight worse. Numbers are Civ 5's on Prince (standard) difficulty.
 *
 * Happiness is a single total for the whole empire, not tracked per city. A building's happiness
 * counts wherever it stands.
 */
export class PlayerHappiness {
  public static readonly UNHAPPINESS_PER_CITY = 3;
  public static readonly UNHAPPINESS_PER_CITIZEN = 1;
  // For each different luxury the empire has improved in its borders. A second tile of the same one adds nothing.
  public static readonly HAPPINESS_PER_LUXURY = 4;
  public static readonly VERY_UNHAPPY_THRESHOLD = -10;
  // The share of a city's food surplus that still goes toward growth while unhappy (Civ 5's -75%).
  public static readonly UNHAPPY_GROWTH_SHARE = 0.25;
  public static readonly VERY_UNHAPPY_COMBAT_PENALTY = 0.33;
  // Units Civ 5 won't let a very unhappy empire train.
  public static readonly VERY_UNHAPPY_BLOCKED_UNITS = ["Settler"];

  private player: Player;
  // What the player was last told their status is, so a change gets a notification.
  private announcedStatus: HappinessStatus;

  constructor(player: Player) {
    this.player = player;
    this.announcedStatus = "content";
  }

  // The luxury on a tile: an improved one, or one under a city, which Civ 5 connects without an improvement.
  public static getLuxuryOn(tile: Tile): string | undefined {
    const resource = tile.getCity() ? tile.getResource() : Improvement.getImprovedResource(tile);
    if (!resource || MapResources.getResourceCategory(resource) !== "luxury") return undefined;

    return resource;
  }

  // "citrus" -> "Citrus"
  private static toDisplayName(resource: string): string {
    return resource.charAt(0).toUpperCase() + resource.slice(1);
  }

  private static getStatusFor(net: number): HappinessStatus {
    if (net <= PlayerHappiness.VERY_UNHAPPY_THRESHOLD) return "veryUnhappy";
    if (net < 0) return "unhappy";
    return "content";
  }

  private static getEffects(status: HappinessStatus): string[] {
    const combatPercent = Math.round(PlayerHappiness.VERY_UNHAPPY_COMBAT_PENALTY * 100);
    const growthPercent = Math.round((1 - PlayerHappiness.UNHAPPY_GROWTH_SHARE) * 100);

    if (status === "veryUnhappy") {
      return ["Cities stop growing", "Can't train Settlers", `Units -${combatPercent}% combat strength`];
    }
    if (status === "unhappy") return [`City growth -${growthPercent}%`];
    return [];
  }

  private static getStatusMessage(status: HappinessStatus): string {
    if (status === "veryUnhappy") {
      return "Your empire is very unhappy! Cities have stopped growing, Settlers can't be trained, and units fight worse.";
    }
    if (status === "unhappy") return "Your empire is unhappy. Cities grow much more slowly.";
    return "Your empire is content again.";
  }

  // Each different luxury the player has connected, e.g. ["citrus", "whales"].
  public getLuxuries(): string[] {
    const luxuries = new Set<string>();
    for (const city of this.player.getCities()) {
      for (const tile of city.getTerritory()) {
        const luxury = PlayerHappiness.getLuxuryOn(tile);
        if (luxury) luxuries.add(luxury);
      }
    }
    return Array.from(luxuries).sort();
  }

  public getBreakdown(): HappinessBreakdown {
    const sources = [
      { source: "Base", amount: this.getBaseHappiness() },
      ...this.getLuxuries().map((luxury) => ({
        source: PlayerHappiness.toDisplayName(luxury),
        amount: PlayerHappiness.HAPPINESS_PER_LUXURY
      })),
      ...this.player
        .getCities()
        .map((city) => ({ source: `Buildings in ${city.getName()}`, amount: city.getBuildingHappiness() }))
    ].filter((entry) => entry.amount !== 0);

    const cities = this.player.getCities();
    const citizens = cities.reduce((total, city) => total + city.getPopulation(), 0);
    const unhappiness = [
      {
        source: `${cities.length} ${cities.length === 1 ? "city" : "cities"}`,
        amount: cities.length * PlayerHappiness.UNHAPPINESS_PER_CITY
      },
      {
        source: `${citizens} ${citizens === 1 ? "citizen" : "citizens"}`,
        amount: citizens * PlayerHappiness.UNHAPPINESS_PER_CITIZEN
      }
    ].filter((entry) => entry.amount !== 0);

    const net =
      sources.reduce((total, entry) => total + entry.amount, 0) -
      unhappiness.reduce((total, entry) => total + entry.amount, 0);
    const status = PlayerHappiness.getStatusFor(net);

    return { sources, unhappiness, net, status, effects: PlayerHappiness.getEffects(status) };
  }

  public getNet(): number {
    return this.getBreakdown().net;
  }

  public getStatus(): HappinessStatus {
    // The barbarians have no happiness to keep up.
    if (this.player.isBarbarian()) return "content";

    return this.getBreakdown().status;
  }

  /** A city's food surplus once unhappiness has slowed its growth. A shortfall isn't touched. */
  public applyToFoodSurplus(food: number): number {
    if (food <= 0) return food;

    const status = this.getStatus();
    if (status === "veryUnhappy") return 0;
    if (status === "unhappy") return Math.round(food * PlayerHappiness.UNHAPPY_GROWTH_SHARE * 100) / 100;
    return food;
  }

  public canTrain(unitName: string): boolean {
    return !PlayerHappiness.VERY_UNHAPPY_BLOCKED_UNITS.includes(unitName) || this.getStatus() !== "veryUnhappy";
  }

  // Added to every fight this player's units take part in, attacking or defending.
  public getCombatModifiers(): CombatModifier[] {
    if (this.getStatus() !== "veryUnhappy") return [];

    return [{ label: "Very unhappy", value: -PlayerHappiness.VERY_UNHAPPY_COMBAT_PENALTY }];
  }

  /**
   * Notifies the player when their status has changed since they were last told. Returns whether it
   * did, since a change alters every city's growth and the caller needs to resend them.
   */
  public announceStatusChange(): boolean {
    const status = this.getStatus();
    if (status === this.announcedStatus) return false;

    this.announcedStatus = status;
    const icon = status === "content" ? "ICON_MORALE" : "ICON_UNHAPPY";
    this.player.getNotifications().addMessage(icon, PlayerHappiness.getStatusMessage(status));
    return true;
  }

  private getBaseHappiness(): number {
    return Game.getInstance().getGameOptions().baseHappiness ?? DefaultGameOptions.baseHappiness;
  }
}
