import { BuildingEffects } from "../city/BuildingEffects";
import type { City } from "../city/City";
import { PlayerDiplomacy } from "../diplomacy/PlayerDiplomacy";
import { ServerEvents } from "../Events";
import { Improvement } from "../map/Improvement";
import { StatEntry, Tile } from "../map/Tile";
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
  // The Caravan or Cargo Ship walking the route, back and forth between the two cities.
  unit: Unit;
  // The tiles it walks, from the origin city's to the destination's, where it is on them, and which
  // way it's heading (1 toward the destination, -1 back home).
  path: Tile[];
  position: number;
  heading: 1 | -1;
  sea: boolean;
  turnsLeft: number;
}

// What each end of a route gets every turn, e.g. { gold: 5, science: 1 }.
export type TradeYields = Partial<Record<"gold" | "science" | "food" | "production", number>>;

/**
 * Brave New World's trade routes. A Caravan (over land) or Cargo Ship (by sea) standing in one of its
 * owner's cities sets one up from there to a city in range: another civilization's for gold and
 * science at both ends, or another of its owner's own to send it food or production. The unit then
 * walks the route on its own, back and forth between the two cities, taking no orders, until the route
 * ends after ROUTE_TURNS turns and it's back in the origin city for a new one. How many routes
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
 * The route is lost, and the unit free again wherever it stands, if either city changes hands, the
 * two civilizations go to war, or the unit dies.
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

  // Moves the unit along its route as far as a turn's movement takes it, turning round at either end.
  private static walk(route: TradeRoute) {
    let movement = route.unit.getMaxMovement();
    while (movement > 0) {
      const next = route.position + route.heading;
      const cost = Tile.getWeight(route.path[route.position], route.path[next], route.unit);
      movement = Math.max(0, movement - cost);
      route.position = next;
      PlayerTradeRoutes.stepTo(route.unit, route.path[next], movement);

      // Each arrival ends the turn's walk, like a caravan unloading.
      if (next === 0 || next === route.path.length - 1) {
        route.heading = route.heading === 1 ? -1 : 1;
        return;
      }
    }
  }

  private static stepTo(unit: Unit, tile: Tile, remainingMovement: number) {
    if (unit.getTile() === tile) return;

    unit.moveToTile({ previousTile: unit.getTile(), targetTile: tile, remainingTiles: [], remainingMovement });
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
    return this.hasFreeSlot() && this.getDestinations(unit).size > 0;
  }

  /**
   * The routes the unit could set up from its city: one per city in range for another civilization's,
   * and a food and a production one for each of the player's own. Not to a city it already runs a route
   * to from there, nor to anyone at war with the player.
   */
  public getOptions(unit: Unit): TradeRoute[] {
    return Array.from(this.getDestinations(unit)).flatMap(([destination, path]) => {
      const kinds: TradeRouteKind[] = destination.getPlayer() === this.player ? ["food", "production"] : ["gold"];
      return kinds.map((kind) => this.createRoute(unit, destination, kind, path));
    });
  }

  // Each turn: units walk their routes and routes run down. A route comes to an end once either city
  // changes hands, the two go to war, or its unit is gone.
  public passTurn() {
    for (const route of this.getRoutes()) {
      const names = `${route.origin.getName()} to ${route.destination.getName()}`;
      if (!this.isStillOpen(route)) {
        this.close(route, `Your trade route from ${names} was lost.`);
        continue;
      }

      route.turnsLeft--;
      if (route.turnsLeft > 0) {
        PlayerTradeRoutes.walk(route);
        continue;
      }

      this.close(route, `Your trade route from ${names} has ended. The ${route.unit.getName()} is back home.`);
      PlayerTradeRoutes.stepTo(route.unit, route.origin.getTile(), 0);
    }
  }

  // Trade routes running, and how many more there's room for.
  public getSummary() {
    return {
      slots: this.getSlots(),
      routes: this.getRoutes().map((route) => ({ ...this.toJSON(route), originName: route.origin.getName() }))
    };
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

  /** Sets up the route from the unit's city, sending the unit along it. False if it can't go. */
  public establish(unitId: number, cityName: string, kind: TradeRouteKind): boolean {
    const unit = this.findUnit(unitId);
    if (!unit || !this.hasFreeSlot()) return false;

    const route = this.getOptions(unit).find(
      (option) => option.destination.getName() === cityName && option.kind === kind
    );
    if (!route) return false;

    PlayerTradeRoutes.allRoutes.push(route);
    unit.setTrading(true);
    this.refreshCities(route);
    this.player.sendTotalStatsUpdate();
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
      routes: this.getSummary().routes
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

  // Each city the unit could trade with, and the way there.
  private getDestinations(unit: Unit): Map<City, Tile[]> {
    const origin = this.getOriginCity(unit);
    if (!origin || unit.isTrading() || !PlayerTradeRoutes.isTradeUnit(unit.getName())) return new Map();

    const sea = unit.getDomain() === "sea";
    const reachable = sea ? this.reachBySea(origin) : this.reachByLand(origin);
    const allowed = Array.from(reachable).filter(
      ([city]) =>
        city !== origin &&
        !city.getPlayer().isBarbarian() &&
        !PlayerDiplomacy.areAtWar(this.player, city.getPlayer()) &&
        this.player.getVisibility().hasDiscovered(city.getTile()) &&
        !this.getRoutes().some((route) => route.origin === origin && route.destination === city)
    );
    return new Map(allowed);
  }

  private createRoute(unit: Unit, destination: City, kind: TradeRouteKind, path: Tile[]): TradeRoute {
    return {
      owner: this.player,
      origin: this.getOriginCity(unit),
      destination,
      kind,
      unit,
      path,
      position: 0,
      heading: 1,
      sea: unit.getDomain() === "sea",
      turnsLeft: PlayerTradeRoutes.ROUTE_TURNS
    };
  }

  // Cities a Caravan could walk to within LAND_RANGE tiles, around mountains and the sea.
  private reachByLand(origin: City): Map<City, Tile[]> {
    return this.reach(
      origin.getTile(),
      PlayerTradeRoutes.LAND_RANGE,
      (tile) => !tile.isWater() && tile.getMovementCost() < 9999
    );
  }

  // Cities a Cargo Ship could sail to within SEA_RANGE tiles: coastal ones, reached across water.
  private reachBySea(origin: City): Map<City, Tile[]> {
    return this.reach(origin.getTile(), PlayerTradeRoutes.SEA_RANGE, (tile) => tile.isWater());
  }

  /**
   * Walks out from `start` across tiles that pass, up to `range` steps, and lists the cities it touches,
   * each with the shortest way there (`start` to the city's tile).
   */
  private reach(start: Tile, range: number, passable: (tile: Tile) => boolean): Map<City, Tile[]> {
    const distances = new Map<Tile, number>([[start, 0]]);
    const cameFrom = new Map<Tile, Tile>();
    const queue = [start];
    const cities = new Map<City, Tile[]>();
    const pathTo = (tile: Tile) => {
      const path = [tile];
      while (cameFrom.has(path[0])) path.unshift(cameFrom.get(path[0]));
      return path;
    };

    while (queue.length > 0) {
      const tile = queue.shift();
      const distance = distances.get(tile);
      if (distance >= range) continue;

      for (const next of tile.getAdjacentTiles()) {
        if (!next || distances.has(next)) continue;

        const city = next.getCity();
        if (city && !cities.has(city)) {
          cameFrom.set(next, tile);
          cities.set(city, pathTo(next));
        }
        if (!passable(next)) continue;

        cameFrom.set(next, tile);
        distances.set(next, distance + 1);
        queue.push(next);
      }
    }

    return cities;
  }

  private isStillOpen(route: TradeRoute): boolean {
    const origin = route.origin.getPlayer();
    if (origin !== this.player || !this.player.getCities().includes(route.origin)) return false;

    const destinationOwner = route.destination.getPlayer();
    if (!destinationOwner.getCities().includes(route.destination)) return false;
    if (!this.player.getUnits().includes(route.unit)) return false;
    return !PlayerDiplomacy.areAtWar(origin, destinationOwner);
  }

  private close(route: TradeRoute, message: string) {
    PlayerTradeRoutes.allRoutes = PlayerTradeRoutes.allRoutes.filter((entry) => entry !== route);
    route.unit.setTrading(false);
    this.refreshCities(route);
    this.player.getNotifications().addMessage("ICON_TRADE", message);
  }

  // Both ends' yields just changed.
  private refreshCities(route: TradeRoute) {
    route.origin.sendStatUpdate(route.origin.getPlayer());
    route.destination.sendStatUpdate(route.destination.getPlayer());
  }
}
