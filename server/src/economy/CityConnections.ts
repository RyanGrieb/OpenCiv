import { BuildingEffects } from "../city/BuildingEffects";
import type { City } from "../city/City";
import { GameMap } from "../map/GameMap";
import type { Tile } from "../map/Tile";
import type { Player } from "../Player";

/**
 * Civ 5's city connections (vanilla's trade routes): a city joined to its owner's capital by a chain of
 * roads (or railroads, which are roads too), or by sea between two cities with a Harbor, earns gold every turn. The chain can mix the two -
 * a road out to a harbor city, by sea to another, by road on again - but has to end at the capital.
 *
 * Every road tile costs its owner ROAD_MAINTENANCE gold a turn (a railroad RAILROAD_MAINTENANCE instead):
 * whoever's territory it lies in, or the
 * civilization whose Builder made it when it's out on unowned land.
 *
 * Which cities are connected is worked out again whenever the map changes (a road finished, a city
 * founded or taken, a Harbor built) rather than on every stat lookup.
 *
 * Not in yet: pillaging, and enemy ships blockading a harbor.
 */
export class CityConnections {
  public static readonly ROAD_MAINTENANCE = 1;
  public static readonly RAILROAD_MAINTENANCE = 2;
  public static readonly CITY_POPULATION_GOLD = 1.1;
  public static readonly CAPITAL_POPULATION_GOLD = 0.15;
  public static readonly HARBOR = "Harbor";
  // Floating point slack, so 4 x 0.25 banks the whole gold.
  private static readonly EPSILON = 1e-9;

  // Bumped by invalidate(), so every player knows to work their connections out again.
  private static version = 0;

  private player: Player;
  private connected: Set<City>;
  private roadTiles: Tile[];
  // Connection gold earned but not yet a whole gold.
  private leftoverGold: number;
  private computedAt: number;

  constructor(player: Player) {
    this.player = player;
    this.connected = new Set();
    this.roadTiles = [];
    this.leftoverGold = 0;
    this.computedAt = -1;
  }

  // Something that changes how cities connect has happened: roads, cities, borders or harbors.
  public static invalidate() {
    CityConnections.version++;
  }

  // Civ 5's formula: (city population x 1.1) + (capital population x 0.15) - 1.
  public static getConnectionGold(city: City, capital: City): number {
    const gold =
      city.getPopulation() * CityConnections.CITY_POPULATION_GOLD +
      capital.getPopulation() * CityConnections.CAPITAL_POPULATION_GOLD -
      1;
    return Math.max(0, gold);
  }

  // Whose treasury a road on this tile comes out of.
  public static getRoadPayer(tile: Tile): Player | undefined {
    return tile.getCityTerritoryOf()?.getPlayer() ?? tile.getRouteBuilder();
  }

  public getCapital(): City | undefined {
    return this.player.getCities().find((city) => city.hasBuilding("Palace"));
  }

  // The player's other cities with a connection to their capital.
  public getConnectedCities(): City[] {
    this.refresh();
    return this.player.getCities().filter((city) => this.connected.has(city));
  }

  // The capital and every city connected to it, once there's at least one: the cities whose banners
  // show the connection icon. The capital earns nothing itself, but it's one end of every connection.
  public getNetworkCities(): City[] {
    const connected = this.getConnectedCities();
    return connected.length > 0 ? [this.getCapital(), ...connected] : [];
  }

  public isConnected(city: City): boolean {
    return this.getConnectedCities().includes(city);
  }

  // The gold all connections bring in a turn, fractions included, with Machu Picchu's bonus.
  public getExactGold(): number {
    const capital = this.getCapital();
    if (!capital) return 0;

    const gold = this.getConnectedCities().reduce(
      (total, city) => total + CityConnections.getConnectionGold(city, capital),
      0
    );
    return (gold * (100 + BuildingEffects.getConnectionGoldPercent(this.player))) / 100;
  }

  // The whole gold banked this turn: the fractions left over from earlier turns add up, as Civ 5
  // keeps hundredths of gold, so a pop-1 city's 0.25 still pays 1 gold every 4 turns.
  public getGold(): number {
    return Math.floor(this.getExactGold() + this.leftoverGold + CityConnections.EPSILON);
  }

  // Called once this turn's gold is banked: keeps what didn't make a whole gold for next turn.
  public bankTurn() {
    this.leftoverGold = Math.max(0, this.getExactGold() + this.leftoverGold - this.getGold());
  }

  // Road and railroad tiles this player pays maintenance on.
  public getRoadCount(): number {
    this.refresh();
    return this.roadTiles.length;
  }

  public getRoadMaintenance(): number {
    this.refresh();
    return this.roadTiles.reduce(
      (total, tile) =>
        total +
        (tile.containsTileType("railroad") ? CityConnections.RAILROAD_MAINTENANCE : CityConnections.ROAD_MAINTENANCE),
      0
    );
  }

  private refresh() {
    if (this.computedAt === CityConnections.version) return;

    this.computedAt = CityConnections.version;
    this.connected = this.findConnected();
    this.roadTiles = GameMap.getInstance()
      .getTiles()
      .flat()
      .filter((tile) => tile.containsTileType("road") && CityConnections.getRoadPayer(tile) === this.player);
  }

  // Spreads out from the capital along roads, crossing the sea from one harbor city to the next.
  private findConnected(): Set<City> {
    const capital = this.getCapital();
    if (!capital) return new Set();

    const reached = new Set<City>([capital]);
    const sailedFrom = new Set<City>();
    let frontier = [capital];

    while (frontier.length > 0) {
      frontier.forEach((city) => this.reachByRoad(city, reached));

      const harbors = [...reached].filter((city) => this.hasHarbor(city) && !sailedFrom.has(city));
      harbors.forEach((city) => sailedFrom.add(city));
      frontier = this.reachBySea(harbors, reached);
    }

    reached.delete(capital);
    return reached;
  }

  // Adds every one of the player's cities joined to `start` by road.
  private reachByRoad(start: City, reached: Set<City>) {
    const visited = new Set<Tile>([start.getTile()]);
    const queue = [start.getTile()];

    while (queue.length > 0) {
      const tile = queue.shift();
      const city = tile.getCity();
      if (city?.getPlayer() === this.player) reached.add(city);

      for (const next of tile.getAdjacentTiles()) {
        if (!next || visited.has(next) || !next.hasRoad()) continue;

        visited.add(next);
        queue.push(next);
      }
    }
  }

  // The player's harbor cities, not yet reached, that ships could sail to from the given ones.
  private reachBySea(harbors: City[], reached: Set<City>): City[] {
    if (harbors.length === 0) return [];

    const visited = new Set<Tile>();
    const queue = harbors.flatMap((city) =>
      city
        .getTile()
        .getAdjacentTiles()
        .filter((tile) => tile?.isWater())
    );
    queue.forEach((tile) => visited.add(tile));
    const found: City[] = [];

    while (queue.length > 0) {
      const tile = queue.shift();

      for (const next of tile.getAdjacentTiles()) {
        if (!next || visited.has(next)) continue;
        visited.add(next);

        const city = next.getCity();
        if (city && this.hasHarbor(city) && city.getPlayer() === this.player && !reached.has(city)) {
          reached.add(city);
          found.push(city);
        }
        if (next.isWater()) queue.push(next);
      }
    }

    return found;
  }

  private hasHarbor(city: City): boolean {
    return city.hasBuilding(CityConnections.HARBOR);
  }
}
