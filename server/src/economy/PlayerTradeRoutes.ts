import { BuildingEffects } from "../city/BuildingEffects";
import type { City } from "../city/City";
import { PlayerDiplomacy } from "../diplomacy/PlayerDiplomacy";
import { ServerEvents } from "../Events";
import { Improvement } from "../map/Improvement";
import type { StatEntry, Tile } from "../map/Tile";
import type { Player } from "../Player";
import { TechEffects } from "../research/TechEffects";
import { Technology } from "../research/Technology";
import type { Unit } from "../unit/Unit";

// What a route carries. An international route trades gold (and science); a route between two of
// the player's own cities sends food or production to the destination.
export type TradeRouteKind = "gold" | "food" | "production";

export interface TradeRoute {
  owner: Player;
  origin: City;
  destination: City;
  kind: TradeRouteKind;
  // The unit that set it up, sent back to the origin when the route ends.
  unitName: string;
  sea: boolean;
  turnsLeft: number;
}

// What each end of a route gets every turn, e.g. { gold: 5, science: 1 }.
export type TradeYields = Partial<Record<"gold" | "science" | "food" | "production", number>>;

/**
 * Brave New World's trade routes. A Caravan (over land) or Cargo Ship (by sea) standing in one of its
 * owner's cities sets one up from there to a city in range: another civilization's for gold and
 * science at both ends, or another of its owner's own to send it food or production. The unit is used
 * up, and comes back to the origin city when the route ends after ROUTE_TURNS turns. How many routes
 * a player can run at once comes from their techs and wonders (trade_routes in techs.yml and
 * buildings.yml).
 *
 * The yields are a simplified take on BNW's (guesses, to tune):
 *  - International: the origin gets 2 gold + 1 per 2 citizens in the destination + 1 per resource the
 *    destination has that the origin hasn't, and 1 science per 3 techs the destination's owner knows
 *    that its owner doesn't. The destination gets half that gold, and science the same way.
 *  - Domestic: the destination gets 3 food or 3 production.
 *  - Sea routes yield double, and Machu Picchu adds 25% to the origin's gold.
 *
 * Not in yet: plundering, trade routes spreading religion, Caravansary/Harbor range bonuses, and
 * city-state routes beyond treating them like any other civilization.
 */
export class PlayerTradeRoutes {
  public static readonly ROUTE_TURNS = 30;
  public static readonly LAND_RANGE = 10;
  public static readonly SEA_RANGE = 20;
  public static readonly LAND_UNIT = "Caravan";
  public static readonly SEA_UNIT = "Cargo Ship";
  public static readonly DOMESTIC_YIELD = 3;
  public static readonly BASE_GOLD = 2;
  public static readonly TECHS_PER_SCIENCE = 3;

  // Every civilization's routes, so a destination can find the ones coming in.
  private static allRoutes: TradeRoute[] = [];

  private player: Player;

  constructor(player: Player) {
    this.player = player;

    ServerEvents.on({
      eventName: "requestTradeRoutes",
      parentObject: this,
      callback: (data, websocket) => {
        if (this.player.getWebsocket() != websocket) return;

        this.sendOptions(data["unitId"]);
      },
      globalEvent: true
    });

    ServerEvents.on({
      eventName: "establishTradeRoute",
      parentObject: this,
      callback: (data, websocket) => {
        if (this.player.getWebsocket() != websocket) return;

        this.establish(data["unitId"], data["cityName"], data["kind"]);
      },
      globalEvent: true
    });
  }

  public static isTradeUnit(unitName: string): boolean {
    return unitName === PlayerTradeRoutes.LAND_UNIT || unitName === PlayerTradeRoutes.SEA_UNIT;
  }

  // A new game starts with no routes.
  public static clearAll() {
    PlayerTradeRoutes.allRoutes = [];
  }

  // Everything every civilization's routes give the city: as an origin, and as a destination.
  public static getCityYields(city: City): StatEntry[] {
    const yields = PlayerTradeRoutes.allRoutes.flatMap((route) => {
      if (route.origin === city) return [PlayerTradeRoutes.getOriginYields(route)];
      if (route.destination === city) return [PlayerTradeRoutes.getDestinationYields(route)];
      return [];
    });

    return yields.flatMap((entry) =>
      Object.entries(entry)
        .filter(([, amount]) => amount > 0)
        .map(([stat, amount]) => ({ [stat]: amount }) as StatEntry)
    );
  }

  public static getOriginYields(route: TradeRoute): TradeYields {
    if (route.kind !== "gold") return {};

    const multiplier = route.sea ? 2 : 1;
    const gold = PlayerTradeRoutes.getBaseGold(route.origin, route.destination) * multiplier;
    const goldPercent = BuildingEffects.getConnectionGoldPercent(route.origin.getPlayer());
    return {
      gold: Math.floor((gold * (100 + goldPercent)) / 100),
      science: PlayerTradeRoutes.getScience(route.origin.getPlayer(), route.destination.getPlayer()) * multiplier
    };
  }

  public static getDestinationYields(route: TradeRoute): TradeYields {
    const multiplier = route.sea ? 2 : 1;
    if (route.kind !== "gold") return { [route.kind]: PlayerTradeRoutes.DOMESTIC_YIELD * multiplier };

    return {
      gold: Math.floor(PlayerTradeRoutes.getBaseGold(route.origin, route.destination) / 2) * multiplier,
      science: PlayerTradeRoutes.getScience(route.destination.getPlayer(), route.origin.getPlayer()) * multiplier
    };
  }

  // Before the sea route bonus and Machu Picchu.
  private static getBaseGold(origin: City, destination: City): number {
    const originResources = PlayerTradeRoutes.getResources(origin);
    const newResources = PlayerTradeRoutes.getResources(destination).filter(
      (resource) => !originResources.includes(resource)
    );

    return PlayerTradeRoutes.BASE_GOLD + Math.floor(destination.getPopulation() / 2) + newResources.length;
  }

  // Science `learner` gets from trading with `teacher`: one per few techs it doesn't know yet.
  private static getScience(learner: Player, teacher: Player): number {
    const unknown = Technology.getAllTechnologies().filter(
      (tech) => teacher.hasResearchedTech(tech.getName()) && !learner.hasResearchedTech(tech.getName())
    ).length;
    return Math.floor(unknown / PlayerTradeRoutes.TECHS_PER_SCIENCE);
  }

  // The different resources in the city's territory its owner can see, improved or not.
  private static getResources(city: City): string[] {
    const resources = city
      .getTerritory()
      .map((tile) => tile.getResource() ?? Improvement.getImprovedResource(tile))
      .filter((resource) => resource && !TechEffects.isResourceHidden(resource, city.getPlayer()));
    return Array.from(new Set(resources));
  }

  // How many routes the player can run at once.
  public getSlots(): number {
    const fromTechs = Technology.getAllTechnologies()
      .filter((tech) => this.player.hasResearchedTech(tech.getName()))
      .reduce((total, tech) => total + tech.getTradeRoutes(), 0);
    return fromTechs + BuildingEffects.getTradeRouteSlots(this.player);
  }

  public getRoutes(): TradeRoute[] {
    return PlayerTradeRoutes.allRoutes.filter((route) => route.owner === this.player);
  }

  public hasFreeSlot(): boolean {
    return this.getRoutes().length < this.getSlots();
  }

  // Whether the unit could set up a route right now, from the city it's in.
  public canEstablishWith(unit: Unit): boolean {
    return this.hasFreeSlot() && this.getDestinations(unit).length > 0;
  }

  /**
   * The routes the unit could set up from its city: one per city in range for another civilization's,
   * and a food and a production one for each of the player's own. Not to a city it already runs a route
   * to from there, nor to anyone at war with the player.
   */
  public getOptions(unit: Unit): TradeRoute[] {
    return this.getDestinations(unit).flatMap((destination) => {
      const kinds: TradeRouteKind[] = destination.getPlayer() === this.player ? ["food", "production"] : ["gold"];
      return kinds.map((kind) => this.createRoute(unit, destination, kind));
    });
  }

  // Each turn: routes run down, and come to an end once either city changes hands or the two go to war.
  public passTurn() {
    for (const route of this.getRoutes()) {
      if (!this.isStillOpen(route)) {
        this.close(
          route,
          `Your trade route from ${route.origin.getName()} to ${route.destination.getName()} was lost.`
        );
        continue;
      }

      route.turnsLeft--;
      if (route.turnsLeft > 0) continue;

      this.close(
        route,
        `Your trade route from ${route.origin.getName()} to ${route.destination.getName()} has ended. The ${route.unitName} has returned home.`
      );
      route.origin.grantFreeUnit(route.unitName);
    }
  }

  public toJSON(route: TradeRoute) {
    return {
      cityName: route.destination.getName(),
      civilization: route.destination.getPlayer().getCivilizationName() ?? route.destination.getPlayer().getName(),
      kind: route.kind,
      sea: route.sea,
      turns: route.turnsLeft,
      origin: PlayerTradeRoutes.getOriginYields(route),
      destination: PlayerTradeRoutes.getDestinationYields(route)
    };
  }

  /** Sets up the route from the unit's city, using the unit up. False if it can't go. */
  public establish(unitId: number, cityName: string, kind: TradeRouteKind): boolean {
    const unit = this.findUnit(unitId);
    if (!unit || !this.hasFreeSlot()) return false;

    const route = this.getOptions(unit).find(
      (option) => option.destination.getName() === cityName && option.kind === kind
    );
    if (!route) return false;

    PlayerTradeRoutes.allRoutes.push(route);
    unit.delete();
    this.refreshCities(route);
    this.player
      .getNotifications()
      .addMessage(
        "ICON_TRADE",
        `A trade route from ${route.origin.getName()} to ${route.destination.getName()} has been established.`
      );
    return true;
  }

  private sendOptions(unitId: number) {
    const unit = this.findUnit(unitId);
    if (!unit) return;

    this.player.sendNetworkEvent({
      event: "tradeRouteOptions",
      unitId,
      originName: this.getOriginCity(unit)?.getName() ?? "",
      slots: this.getSlots(),
      used: this.getRoutes().length,
      options: this.getOptions(unit).map((route) => this.toJSON(route)),
      routes: this.getRoutes().map((route) => ({ ...this.toJSON(route), originName: route.origin.getName() }))
    });
  }

  private findUnit(unitId: number): Unit | undefined {
    return this.player.getUnits().find((unit) => unit.getId() === unitId);
  }

  // The player's city the unit stands in, which a route it sets up starts from.
  private getOriginCity(unit: Unit): City | undefined {
    const city = unit.getTile().getCity();
    return city?.getPlayer() === this.player ? city : undefined;
  }

  private getDestinations(unit: Unit): City[] {
    const origin = this.getOriginCity(unit);
    if (!origin || !PlayerTradeRoutes.isTradeUnit(unit.getName())) return [];

    const sea = unit.getDomain() === "sea";
    const reachable = sea ? this.reachBySea(origin) : this.reachByLand(origin);
    return reachable.filter(
      (city) =>
        city !== origin &&
        !city.getPlayer().isBarbarian() &&
        !PlayerDiplomacy.areAtWar(this.player, city.getPlayer()) &&
        this.player.getVisibility().hasDiscovered(city.getTile()) &&
        !this.getRoutes().some((route) => route.origin === origin && route.destination === city)
    );
  }

  private createRoute(unit: Unit, destination: City, kind: TradeRouteKind): TradeRoute {
    return {
      owner: this.player,
      origin: this.getOriginCity(unit),
      destination,
      kind,
      unitName: unit.getName(),
      sea: unit.getDomain() === "sea",
      turnsLeft: PlayerTradeRoutes.ROUTE_TURNS
    };
  }

  // Cities a Caravan could walk to within LAND_RANGE tiles, around mountains and the sea.
  private reachByLand(origin: City): City[] {
    return this.reach(
      origin.getTile(),
      PlayerTradeRoutes.LAND_RANGE,
      (tile) => !tile.isWater() && tile.getMovementCost() < 9999
    );
  }

  // Cities a Cargo Ship could sail to within SEA_RANGE tiles: coastal ones, reached across water.
  private reachBySea(origin: City): City[] {
    return this.reach(origin.getTile(), PlayerTradeRoutes.SEA_RANGE, (tile) => tile.isWater());
  }

  // Walks out from `start` across tiles that pass, up to `range` steps, and lists the cities it touches.
  private reach(start: Tile, range: number, passable: (tile: Tile) => boolean): City[] {
    const distances = new Map<Tile, number>([[start, 0]]);
    const queue = [start];
    const cities = new Set<City>();

    while (queue.length > 0) {
      const tile = queue.shift();
      const distance = distances.get(tile);
      if (distance >= range) continue;

      for (const next of tile.getAdjacentTiles()) {
        if (!next || distances.has(next)) continue;

        const city = next.getCity();
        if (city) cities.add(city);
        if (!passable(next)) continue;

        distances.set(next, distance + 1);
        queue.push(next);
      }
    }

    return Array.from(cities);
  }

  private isStillOpen(route: TradeRoute): boolean {
    const origin = route.origin.getPlayer();
    if (origin !== this.player || !this.player.getCities().includes(route.origin)) return false;

    const destinationOwner = route.destination.getPlayer();
    if (!destinationOwner.getCities().includes(route.destination)) return false;
    return !PlayerDiplomacy.areAtWar(origin, destinationOwner);
  }

  private close(route: TradeRoute, message: string) {
    PlayerTradeRoutes.allRoutes = PlayerTradeRoutes.allRoutes.filter((entry) => entry !== route);
    this.refreshCities(route);
    this.player.getNotifications().addMessage("ICON_TRADE", message);
  }

  // Both ends' yields just changed.
  private refreshCities(route: TradeRoute) {
    route.origin.sendStatUpdate(route.origin.getPlayer());
    route.destination.sendStatUpdate(route.destination.getPlayer());
  }
}
