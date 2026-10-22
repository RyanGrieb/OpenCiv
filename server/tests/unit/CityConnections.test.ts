import { City } from '../../src/city/City';
import { CityConnections } from '../../src/economy/CityConnections';
import { GameMap } from '../../src/map/GameMap';
import { Tile } from '../../src/map/Tile';
import { Player } from '../../src/Player';

describe('CityConnections', () => {
  let tiles: Tile[];
  let cities: City[];
  let player: Player;
  let connections: CityConnections;

  // A row of tiles, each joined to the next (side 2 faces right, side 5 left).
  const row = (...tileTypes: string[]) =>
    tileTypes.map((type, x) => {
      const tile = new Tile(type, x, 0);
      tiles.push(tile);
      return tile;
    });
  const join = (line: Tile[]) =>
    line.forEach((tile, index) => {
      if (index === 0) return;
      tile.setAdjacentTile(5, line[index - 1]);
      line[index - 1].setAdjacentTile(2, tile);
    });

  const cityOn = (tile: Tile, options: { population?: number; buildings?: string[]; owner?: Player } = {}) => {
    const city = {
      getTile: () => tile,
      getPlayer: () => options.owner ?? player,
      getPopulation: () => options.population ?? 1,
      hasBuilding: (name: string) => (options.buildings ?? []).includes(name),
      getBuildings: (): string[] => []
    } as unknown as City;
    tile.setCity(city);
    tile.setCityTerritoryOf(city);
    if (!options.owner) cities.push(city);
    return city;
  };

  beforeEach(() => {
    tiles = [];
    cities = [];
    jest.spyOn(GameMap, 'getInstance').mockReturnValue({
      getTiles: () => [tiles],
      broadcastTileUpdate: () => CityConnections.invalidate()
    } as unknown as GameMap);
    player = { getCities: () => cities } as unknown as Player;
    connections = new CityConnections(player);
  });

  afterEach(() => jest.restoreAllMocks());

  it("pays Civ 5's (city pop x 1.1) + (capital pop x 0.15) - 1", () => {
    const capital = { getPopulation: () => 6 } as City;

    expect(CityConnections.getConnectionGold({ getPopulation: () => 4 } as City, capital)).toBeCloseTo(4.3);
    expect(CityConnections.getConnectionGold({ getPopulation: () => 5 } as City, capital)).toBeCloseTo(5.4);
  });

  it('connects a city joined to the capital by road', () => {
    const line = row('grass', 'grass', 'grass', 'grass');
    join(line);
    const capital = cityOn(line[0], { population: 6, buildings: ['Palace'] });
    const antium = cityOn(line[3], { population: 4 });
    expect(connections.getConnectedCities()).toEqual([]);

    line[1].addTileType('road');
    line[2].addTileType('road');
    CityConnections.invalidate();

    expect(connections.getConnectedCities()).toEqual([antium]);
    expect(connections.isConnected(capital)).toBe(false);
    // 4.3 rounded down.
    expect(connections.getGold()).toBe(4);
  });

  it('is cut off by a gap in the road', () => {
    const line = row('grass', 'grass', 'grass', 'grass');
    join(line);
    cityOn(line[0], { buildings: ['Palace'] });
    cityOn(line[3]);
    line[1].addTileType('road');
    CityConnections.invalidate();

    expect(connections.getConnectedCities()).toEqual([]);
  });

  it('connects harbor cities by sea, and a road onward from one', () => {
    // capital (harbor) ~ sea ~ port (harbor) - road - inland
    const line = row('grass', 'shallow_ocean', 'shallow_ocean', 'grass', 'grass', 'grass');
    join(line);
    cityOn(line[0], { buildings: ['Palace', 'Harbor'] });
    const port = cityOn(line[3], { buildings: ['Harbor'] });
    const inland = cityOn(line[5]);
    line[4].addTileType('road');
    CityConnections.invalidate();

    expect(connections.getConnectedCities()).toEqual([port, inland]);
  });

  it("needs a harbor at the capital's end of a sea connection too", () => {
    const line = row('grass', 'shallow_ocean', 'grass');
    join(line);
    cityOn(line[0], { buildings: ['Palace'] });
    cityOn(line[2], { buildings: ['Harbor'] });

    expect(connections.getConnectedCities()).toEqual([]);
  });

  it("doesn't count another civilization's cities", () => {
    const line = row('grass', 'grass', 'grass');
    join(line);
    cityOn(line[0], { buildings: ['Palace'] });
    cityOn(line[2], { owner: {} as Player });
    line[1].addTileType('road');

    expect(connections.getConnectedCities()).toEqual([]);
  });

  it('charges a road to whoever owns its land, else whoever built it', () => {
    const line = row('grass', 'grass', 'grass');
    join(line);
    const capital = cityOn(line[0], { buildings: ['Palace'] });
    line[1].addTileType('road');
    line[1].setCityTerritoryOf(capital);
    line[2].addTileType('road');
    line[2].setRouteBuilder({} as Player);
    CityConnections.invalidate();

    expect(connections.getRoadCount()).toBe(1);
    expect(connections.getRoadMaintenance()).toBe(CityConnections.ROAD_MAINTENANCE);

    line[2].setRouteBuilder(player);
    CityConnections.invalidate();
    expect(connections.getRoadCount()).toBe(2);
  });

  it('charges more for a railroad', () => {
    const line = row('grass', 'grass');
    join(line);
    const capital = cityOn(line[0], { buildings: ['Palace'] });
    line[1].addTileType('road');
    line[1].addTileType('railroad');
    line[1].setCityTerritoryOf(capital);

    expect(connections.getRoadMaintenance()).toBe(CityConnections.RAILROAD_MAINTENANCE);
  });
});
