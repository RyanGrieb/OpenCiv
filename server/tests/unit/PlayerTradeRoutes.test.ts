import { City } from '../../src/city/City';
import { PlayerTradeRoutes, TradeRoute } from '../../src/economy/PlayerTradeRoutes';
import { GameMap } from '../../src/map/GameMap';
import { Tile } from '../../src/map/Tile';
import { Player } from '../../src/Player';
import { Unit } from '../../src/unit/Unit';

jest.mock('../../src/Events');

describe('PlayerTradeRoutes', () => {
  let addMessage: jest.Mock;
  let units: Unit[];

  const makePlayer = (techs: string[], cities: City[] = []) =>
    ({
      getCities: () => cities,
      hasResearchedTech: (tech: string) => techs.includes(tech),
      isBarbarian: () => false,
      getName: () => 'Rome',
      getCivilizationName: (): string => undefined,
      getUnits: () => units,
      getWebsocket: (): undefined => undefined,
      getNotifications: () => ({ addMessage }),
      sendTotalStatsUpdate: jest.fn(),
      getVisibility: () => ({ hasDiscovered: () => true }),
      getDiplomacy: () => ({ isAtWarWith: () => false })
    }) as unknown as Player;

  const makeCity = (name: string, owner: () => Player, options: { population?: number; territory?: Tile[]; tile?: Tile } = {}) => {
    const city = {
      getName: () => name,
      getPlayer: owner,
      getPopulation: () => options.population ?? 1,
      getTerritory: () => options.territory ?? [],
      getTile: () => options.tile,
      getBuildings: (): string[] => [],
      sendStatUpdate: jest.fn()
    } as unknown as City;
    options.tile?.setCity(city);
    return city;
  };

  const route = (origin: City, destination: City, kind: TradeRoute['kind'], sea = false): TradeRoute => ({
    owner: origin.getPlayer(),
    origin,
    destination,
    kind,
    unit: {} as Unit,
    path: [],
    position: 0,
    heading: 1,
    sea,
    turnsLeft: PlayerTradeRoutes.ROUTE_TURNS
  });

  // A row of land tiles, each joined to the next.
  const landRow = (length: number) => {
    const tiles = Array.from({ length }, (_, x) => new Tile('grass', x, 0));
    tiles.forEach((tile, index) => {
      if (index === 0) return;
      tile.setAdjacentTile(5, tiles[index - 1]);
      tiles[index - 1].setAdjacentTile(2, tile);
    });
    return tiles;
  };

  beforeEach(() => {
    addMessage = jest.fn();
    units = [];
    PlayerTradeRoutes.clearAll();
    jest.spyOn(GameMap, 'getInstance').mockReturnValue({ broadcastTileUpdate: () => {} } as unknown as GameMap);
  });

  afterEach(() => jest.restoreAllMocks());

  it('gets a trade route slot from each of Animal Husbandry, Sailing and Compass', () => {
    expect(new PlayerTradeRoutes(makePlayer([])).getSlots()).toBe(0);
    expect(new PlayerTradeRoutes(makePlayer(['Animal Husbandry', 'Sailing', 'Compass'])).getSlots()).toBe(3);
  });

  describe('yields', () => {
    let rome: Player;
    let greece: Player;
    let romeCity: City;
    let athens: City;
    let antium: City;

    beforeEach(() => {
      rome = makePlayer(['Pottery']);
      greece = makePlayer(['Pottery', 'Mining', 'Sailing', 'Archery', 'Writing']);
      romeCity = makeCity('Rome', () => rome);
      athens = makeCity('Athens', () => greece, { population: 5 });
      antium = makeCity('Antium', () => rome);
    });

    it('trade gold and science both ways with another civilization', () => {
      // 2 + 5 citizens / 2; Greece knows 4 techs Rome doesn't.
      expect(PlayerTradeRoutes.getOriginYields(route(romeCity, athens, 'gold'))).toEqual({ gold: 4, science: 1 });
      expect(PlayerTradeRoutes.getDestinationYields(route(romeCity, athens, 'gold'))).toEqual({ gold: 2, science: 0 });
    });

    it('pays 1 more gold per resource the destination has and the origin lacks', () => {
      const wine = new Tile('grass', 0, 0);
      wine.addTileType('wine');
      const withWine = makeCity('Sparta', () => greece, { population: 5, territory: [wine] });

      expect(PlayerTradeRoutes.getOriginYields(route(romeCity, withWine, 'gold')).gold).toBe(5);
    });

    it('send food or production to one of their own cities', () => {
      expect(PlayerTradeRoutes.getOriginYields(route(romeCity, antium, 'food'))).toEqual({});
      expect(PlayerTradeRoutes.getDestinationYields(route(romeCity, antium, 'food'))).toEqual({ food: 3 });
      expect(PlayerTradeRoutes.getDestinationYields(route(romeCity, antium, 'production'))).toEqual({ production: 3 });
    });

    it('double by sea', () => {
      expect(PlayerTradeRoutes.getOriginYields(route(romeCity, athens, 'gold', true))).toEqual({ gold: 8, science: 2 });
      expect(PlayerTradeRoutes.getDestinationYields(route(romeCity, antium, 'production', true))).toEqual({ production: 6 });
    });
  });

  describe('a Caravan', () => {
    let player: Player;
    let techs: string[];
    let cities: City[];
    let routes: PlayerTradeRoutes;
    let tiles: Tile[];
    let origin: City;
    let caravan: Unit;

    beforeEach(() => {
      cities = [];
      techs = ['Animal Husbandry'];
      player = makePlayer(techs, cities);
      routes = new PlayerTradeRoutes(player);
      tiles = landRow(14);
      origin = makeCity('Rome', () => player, { tile: tiles[0] });
      cities.push(origin);
      let caravanTile = tiles[0];
      let trading = false;
      caravan = {
        getId: () => 7,
        getName: () => 'Caravan',
        getDomain: () => 'land',
        getTile: () => caravanTile,
        getMaxMovement: () => 2,
        getPlayer: () => player,
        ignoresTerrainCost: () => false,
        isTrading: () => trading,
        setTrading: jest.fn((value: boolean) => (trading = value)),
        moveToTile: jest.fn((options: { targetTile: Tile }) => (caravanTile = options.targetTile))
      } as unknown as Unit;
      units.push(caravan);
    });

    it('offers food and production routes to its own cities within 10 tiles', () => {
      const near = makeCity('Antium', () => player, { tile: tiles[10] });
      makeCity('Far', () => player, { tile: tiles[11] });
      cities.push(near);

      expect(routes.getOptions(caravan).map((option) => [option.destination.getName(), option.kind])).toEqual([
        ['Antium', 'food'],
        ['Antium', 'production']
      ]);
    });

    it('walks the route back and forth, and is home and free again when it ends', () => {
      const antium = makeCity('Antium', () => player, { tile: tiles[3], population: 2 });
      cities.push(antium);

      expect(routes.establish(7, 'Antium', 'food')).toBe(true);
      expect(caravan.isTrading()).toBe(true);
      expect(PlayerTradeRoutes.getCityYields(antium)).toEqual([{ food: 3 }]);
      // The only slot is taken, and a trading unit can't start another.
      expect(routes.hasFreeSlot()).toBe(false);

      // Two tiles a turn, turning round at each city.
      routes.passTurn();
      expect(caravan.getTile()).toBe(tiles[2]);
      routes.passTurn();
      expect(caravan.getTile()).toBe(tiles[3]);
      routes.passTurn();
      expect(caravan.getTile()).toBe(tiles[1]);

      for (let turn = 3; turn < PlayerTradeRoutes.ROUTE_TURNS; turn++) routes.passTurn();

      expect(routes.getRoutes()).toEqual([]);
      expect(caravan.getTile()).toBe(tiles[0]);
      expect(caravan.isTrading()).toBe(false);
      expect(PlayerTradeRoutes.getCityYields(antium)).toEqual([]);
    });

    it("can't set up a route without a free slot", () => {
      const antium = makeCity('Antium', () => player, { tile: tiles[3] });
      cities.push(antium);
      expect(routes.canEstablishWith(caravan)).toBe(true);

      techs.length = 0;
      expect(routes.canEstablishWith(caravan)).toBe(false);
      expect(routes.establish(7, 'Antium', 'food')).toBe(false);
    });
  });
});
