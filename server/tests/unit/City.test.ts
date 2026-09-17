import { City } from '../../src/city/City';
import { Tile } from '../../src/map/Tile';
import { GameMap } from '../../src/map/GameMap';
import { Player } from '../../src/Player';
import { Game } from '../../src/Game';
import { ServerEvents } from '../../src/Events';
import { Unit } from '../../src/unit/Unit';
import { WebSocket } from 'ws';

jest.mock('../../src/map/GameMap');
jest.mock('../../src/Player');
jest.mock('../../src/Game');
jest.mock('../../src/Events');
jest.mock('../../src/unit/Unit');

describe('City', () => {
  let city: City;
  let mockPlayer: jest.Mocked<Player>;
  let mockTile: jest.Mocked<Tile>;
  let onSpy: jest.SpyInstance;

  // City's constructor registers its listeners through the mocked ServerEvents.on,
  // which never actually dispatches anything - this replays a named listener's
  // callback directly, the way Unit.test.ts replays ServerEvents.call for moveUnit.
  const triggerServerEvent = (eventName: string, data: any, websocket?: WebSocket) => {
    const registration = onSpy.mock.calls.find(([options]) => options.eventName === eventName);
    registration[0].callback(data, websocket);
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockTile = {
      getX: jest.fn().mockReturnValue(0),
      getY: jest.fn().mockReturnValue(0),
      getAdjacentTiles: jest.fn().mockReturnValue([]),
      getStats: jest.fn().mockReturnValue([]),
      setCity: jest.fn(),
      addUnit: jest.fn(),
    } as unknown as jest.Mocked<Tile>;

    // With population 1, City.updateWorkedTiles works one tile beyond the city's
    // own tile via GameMap.getTileWithHighestYeild - kept distinct (zero stats)
    // from mockTile so the base tile's stats aren't accidentally double-counted.
    const mockWorkedTile = {
      getX: jest.fn().mockReturnValue(1),
      getY: jest.fn().mockReturnValue(0),
      getStats: jest.fn().mockReturnValue([]),
    } as unknown as jest.Mocked<Tile>;

    mockPlayer = {
      getNextAvailableCityName: jest.fn().mockReturnValue('TestCity'),
      sendNetworkEvent: jest.fn(),
      sendTotalStatsUpdate: jest.fn(),
      getCities: jest.fn().mockReturnValue([]),
      hasResearchedTech: jest.fn().mockReturnValue(false),
    } as unknown as jest.Mocked<Player>;

    (Unit.getAllUnitData as jest.Mock).mockReturnValue([
      { name: 'Warrior', attack_type: 'melee', cost: 30 },
      { name: 'Scout', attack_type: 'melee', cost: 20 },
      { name: 'Settler', is_utility: true },
      { name: 'Archer', attack_type: 'ranged', cost: 40, required_tech: 'Archery' },
    ]);

    jest.spyOn(GameMap, 'getInstance').mockReturnValue({
      getTileWithHighestYeild: jest.fn().mockReturnValue(mockWorkedTile),
    } as any);

    jest.spyOn(Game, 'getInstance').mockReturnValue({
      getPlayerFromWebsocket: jest.fn().mockReturnValue(mockPlayer),
    } as any);

    onSpy = jest.spyOn(ServerEvents, 'on').mockImplementation(() => { });

    city = new City({ tile: mockTile, player: mockPlayer });
    // The constructor itself sends an initial updateCityStats - clear it so each
    // test only sees calls triggered by the event it's exercising.
    mockPlayer.sendNetworkEvent.mockClear();
  });

  it('replies to a production-options request with the units/buildings that have no research gate', () => {
    const mockWebsocket = {} as WebSocket;

    triggerServerEvent('requestProductionOptions', { cityName: 'TestCity' }, mockWebsocket);

    expect(mockPlayer.sendNetworkEvent).toHaveBeenCalledWith({
      event: 'updateProductionOptions',
      cityName: 'TestCity',
      units: [
        { type: 'unit', name: 'Warrior', cost: 30 },
        { type: 'unit', name: 'Scout', cost: 20 },
      ],
      buildings: [
        { type: 'building', name: 'Monument', cost: 60 },
      ],
    });
  });

  it('excludes a unit gated by an unresearched technology', () => {
    const mockWebsocket = {} as WebSocket;

    triggerServerEvent('requestProductionOptions', { cityName: 'TestCity' }, mockWebsocket);

    const { units } = (mockPlayer.sendNetworkEvent as jest.Mock).mock.calls[0][0];
    expect(units.find((option: { name: string }) => option.name === 'Archer')).toBeUndefined();
  });

  it('includes a tech-gated unit once its required technology is researched', () => {
    const mockWebsocket = {} as WebSocket;
    mockPlayer.hasResearchedTech.mockImplementation((tech: string) => tech === 'Archery');

    triggerServerEvent('requestProductionOptions', { cityName: 'TestCity' }, mockWebsocket);

    expect(mockPlayer.sendNetworkEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        units: expect.arrayContaining([{ type: 'unit', name: 'Archer', cost: 40 }]),
      })
    );
  });

  it('ignores a production-options request for a city it does not own', () => {
    const mockWebsocket = {} as WebSocket;

    triggerServerEvent('requestProductionOptions', { cityName: 'SomeOtherCity' }, mockWebsocket);

    expect(mockPlayer.sendNetworkEvent).not.toHaveBeenCalled();
  });

  it('appends a valid option to the production queue (with zero progress) and re-sends city stats', () => {
    const mockWebsocket = {} as WebSocket;

    triggerServerEvent('addToProductionQueue', { cityName: 'TestCity', type: 'unit', name: 'Warrior' }, mockWebsocket);

    expect(city['productionQueue']).toEqual([{ type: 'unit', name: 'Warrior', cost: 30, progress: 0 }]);
    expect(mockPlayer.sendNetworkEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'updateCityStats',
        productionQueue: [{ type: 'unit', name: 'Warrior', cost: 30, progress: 0 }],
      })
    );
  });

  it('ignores an unrecognized production option rather than trusting client-supplied data', () => {
    const mockWebsocket = {} as WebSocket;

    triggerServerEvent('addToProductionQueue', { cityName: 'TestCity', type: 'unit', name: 'Nonexistent' }, mockWebsocket);

    expect(city['productionQueue']).toEqual([]);
    expect(mockPlayer.sendNetworkEvent).not.toHaveBeenCalled();
  });

  it('queues multiple items in the order they were added', () => {
    const mockWebsocket = {} as WebSocket;

    triggerServerEvent('addToProductionQueue', { cityName: 'TestCity', type: 'unit', name: 'Scout' }, mockWebsocket);
    triggerServerEvent('addToProductionQueue', { cityName: 'TestCity', type: 'building', name: 'Monument' }, mockWebsocket);

    expect(city['productionQueue']).toEqual([
      { type: 'unit', name: 'Scout', cost: 20, progress: 0 },
      { type: 'building', name: 'Monument', cost: 60, progress: 0 },
    ]);
  });

  it('gives each queued item its own progress rather than sharing the hardcoded option object', () => {
    const mockWebsocket = {} as WebSocket;

    triggerServerEvent('addToProductionQueue', { cityName: 'TestCity', type: 'unit', name: 'Warrior' }, mockWebsocket);
    triggerServerEvent('addToProductionQueue', { cityName: 'TestCity', type: 'unit', name: 'Warrior' }, mockWebsocket);

    city['productionQueue'][0].progress = 15;

    expect(city['productionQueue'][1].progress).toBe(0);
  });

  describe('removeFromProductionQueue', () => {
    const mockWebsocket = {} as WebSocket;

    beforeEach(() => {
      triggerServerEvent('addToProductionQueue', { cityName: 'TestCity', type: 'unit', name: 'Warrior' }, mockWebsocket);
      triggerServerEvent('addToProductionQueue', { cityName: 'TestCity', type: 'unit', name: 'Scout' }, mockWebsocket);
      mockPlayer.sendNetworkEvent.mockClear();
    });

    it('removes the item at the given index and re-sends city stats', () => {
      triggerServerEvent('removeFromProductionQueue', { cityName: 'TestCity', index: 0 }, mockWebsocket);

      expect(city['productionQueue']).toEqual([{ type: 'unit', name: 'Scout', cost: 20, progress: 0 }]);
      expect(mockPlayer.sendNetworkEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'updateCityStats',
          productionQueue: [{ type: 'unit', name: 'Scout', cost: 20, progress: 0 }],
        })
      );
    });

    it('ignores an out-of-range index', () => {
      triggerServerEvent('removeFromProductionQueue', { cityName: 'TestCity', index: 5 }, mockWebsocket);

      expect(city['productionQueue']).toHaveLength(2);
      expect(mockPlayer.sendNetworkEvent).not.toHaveBeenCalled();
    });

    it('ignores a request for a city it does not own', () => {
      triggerServerEvent('removeFromProductionQueue', { cityName: 'SomeOtherCity', index: 0 }, mockWebsocket);

      expect(city['productionQueue']).toHaveLength(2);
      expect(mockPlayer.sendNetworkEvent).not.toHaveBeenCalled();
    });
  });

  describe('moveProductionQueueItem', () => {
    const mockWebsocket = {} as WebSocket;

    beforeEach(() => {
      triggerServerEvent('addToProductionQueue', { cityName: 'TestCity', type: 'unit', name: 'Warrior' }, mockWebsocket);
      triggerServerEvent('addToProductionQueue', { cityName: 'TestCity', type: 'unit', name: 'Scout' }, mockWebsocket);
      mockPlayer.sendNetworkEvent.mockClear();
    });

    it('swaps an item with the previous one when moved up', () => {
      triggerServerEvent('moveProductionQueueItem', { cityName: 'TestCity', index: 1, direction: 'up' }, mockWebsocket);

      expect(city['productionQueue']).toEqual([
        { type: 'unit', name: 'Scout', cost: 20, progress: 0 },
        { type: 'unit', name: 'Warrior', cost: 30, progress: 0 },
      ]);
    });

    it('swaps an item with the next one when moved down', () => {
      triggerServerEvent('moveProductionQueueItem', { cityName: 'TestCity', index: 0, direction: 'down' }, mockWebsocket);

      expect(city['productionQueue']).toEqual([
        { type: 'unit', name: 'Scout', cost: 20, progress: 0 },
        { type: 'unit', name: 'Warrior', cost: 30, progress: 0 },
      ]);
    });

    it('ignores moving the first item up', () => {
      triggerServerEvent('moveProductionQueueItem', { cityName: 'TestCity', index: 0, direction: 'up' }, mockWebsocket);

      expect(city['productionQueue']).toEqual([
        { type: 'unit', name: 'Warrior', cost: 30, progress: 0 },
        { type: 'unit', name: 'Scout', cost: 20, progress: 0 },
      ]);
      expect(mockPlayer.sendNetworkEvent).not.toHaveBeenCalled();
    });

    it('ignores moving the last item down', () => {
      triggerServerEvent('moveProductionQueueItem', { cityName: 'TestCity', index: 1, direction: 'down' }, mockWebsocket);

      expect(city['productionQueue']).toEqual([
        { type: 'unit', name: 'Warrior', cost: 30, progress: 0 },
        { type: 'unit', name: 'Scout', cost: 20, progress: 0 },
      ]);
      expect(mockPlayer.sendNetworkEvent).not.toHaveBeenCalled();
    });

    it('carries accumulated progress along with the item when reordered', () => {
      // Give the front item (Warrior) some progress before reordering it.
      city['productionQueue'][0].progress = 12;
      mockPlayer.sendNetworkEvent.mockClear();

      triggerServerEvent('moveProductionQueueItem', { cityName: 'TestCity', index: 0, direction: 'down' }, mockWebsocket);

      expect(city['productionQueue']).toEqual([
        { type: 'unit', name: 'Scout', cost: 20, progress: 0 },
        { type: 'unit', name: 'Warrior', cost: 30, progress: 12 },
      ]);
    });
  });

  describe('production (nextTurn)', () => {
    const mockWebsocket = {} as WebSocket;

    beforeEach(() => {
      triggerServerEvent('addToProductionQueue', { cityName: 'TestCity', type: 'unit', name: 'Warrior' }, mockWebsocket);
      mockPlayer.sendNetworkEvent.mockClear();
    });

    it('produces nothing when the queue is empty, but still reports the turn\'s stats', () => {
      triggerServerEvent('removeFromProductionQueue', { cityName: 'TestCity', index: 0 }, mockWebsocket);
      mockPlayer.sendNetworkEvent.mockClear();

      triggerServerEvent('nextTurn', { turn: 2 });

      // The food bank advances every turn whether or not anything is being produced,
      // so the client still needs the stat update.
      expect(city['productionQueue']).toEqual([]);
      expect(mockPlayer.sendNetworkEvent).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'updateCityStats', productionQueue: [] })
      );
    });

    it("adds the city's production rate to the front item's progress and re-sends city stats", () => {
      mockTile.getStats.mockReturnValue([{ production: 10 }]);

      triggerServerEvent('nextTurn', { turn: 2 });

      expect(city['productionQueue']).toEqual([{ type: 'unit', name: 'Warrior', cost: 30, progress: 10 }]);
      expect(mockPlayer.sendNetworkEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'updateCityStats',
          productionQueue: [{ type: 'unit', name: 'Warrior', cost: 30, progress: 10 }],
        })
      );
    });

    it('only applies production to the front item, leaving the rest untouched', () => {
      triggerServerEvent('addToProductionQueue', { cityName: 'TestCity', type: 'unit', name: 'Scout' }, mockWebsocket);
      mockTile.getStats.mockReturnValue([{ production: 10 }]);

      triggerServerEvent('nextTurn', { turn: 2 });

      expect(city['productionQueue']).toEqual([
        { type: 'unit', name: 'Warrior', cost: 30, progress: 10 },
        { type: 'unit', name: 'Scout', cost: 20, progress: 0 },
      ]);
    });

    it('accumulates progress across multiple turns', () => {
      mockTile.getStats.mockReturnValue([{ production: 10 }]);

      triggerServerEvent('nextTurn', { turn: 2 });
      triggerServerEvent('nextTurn', { turn: 3 });

      expect(city['productionQueue'][0].progress).toBe(20);
    });

    it('completes and dequeues the item once progress reaches its cost, logging the completion', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
      mockTile.getStats.mockReturnValue([{ production: 30 }]);

      triggerServerEvent('nextTurn', { turn: 2 });

      expect(city['productionQueue']).toEqual([]);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Warrior'));

      logSpy.mockRestore();
    });

    it('does not carry overflow progress into the next queued item on completion', () => {
      triggerServerEvent('addToProductionQueue', { cityName: 'TestCity', type: 'unit', name: 'Scout' }, mockWebsocket);
      mockTile.getStats.mockReturnValue([{ production: 40 }]); // 10 more than Warrior's cost

      triggerServerEvent('nextTurn', { turn: 2 });

      expect(city['productionQueue']).toEqual([{ type: 'unit', name: 'Scout', cost: 20, progress: 0 }]);
    });

    it('constructs the unit via Unit.createFromName and adds it to the city tile on completion', () => {
      const mockUnit = {} as Unit;
      (Unit.createFromName as jest.Mock).mockReturnValue(mockUnit);
      mockTile.getStats.mockReturnValue([{ production: 30 }]);

      triggerServerEvent('nextTurn', { turn: 2 });

      expect(Unit.createFromName).toHaveBeenCalledWith('Warrior', mockTile, mockPlayer);
      expect(mockTile.addUnit).toHaveBeenCalledWith(mockUnit);
    });

    it('does not add a unit to the tile when Unit.createFromName finds no matching config', () => {
      (Unit.createFromName as jest.Mock).mockReturnValue(undefined);
      mockTile.getStats.mockReturnValue([{ production: 30 }]);

      triggerServerEvent('nextTurn', { turn: 2 });

      expect(mockTile.addUnit).not.toHaveBeenCalled();
    });

    it('adds a Building to the city and broadcasts addBuilding when a building item completes', () => {
      triggerServerEvent('addToProductionQueue', { cityName: 'TestCity', type: 'building', name: 'Monument' }, mockWebsocket);
      // Advance the Monument (2nd in queue) to the front by completing the Warrior first.
      mockTile.getStats.mockReturnValue([{ production: 30 }]);
      triggerServerEvent('nextTurn', { turn: 2 });
      mockPlayer.sendNetworkEvent.mockClear();

      mockTile.getStats.mockReturnValue([{ production: 60 }]);
      triggerServerEvent('nextTurn', { turn: 3 });

      expect(city['buildings']).toHaveLength(1);
      expect(city['buildings'][0].getName()).toBe('Monument');
      expect(mockPlayer.sendNetworkEvent).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'addBuilding', cityName: 'TestCity' })
      );
    });
  });

  describe('updateWorkedTiles', () => {
    // Mirrors City's real Tile.getTotalStatValue so the fake GameMap below can rank
    // tiles the same way the real one does, without pulling in the real Tile/GameMap.
    const totalStatValue = (tile: any, stats: string[]) => {
      let total = 0;
      for (const stat of tile.getStats()) {
        const statName = Object.keys(stat)[0];
        if (stats.includes('default') || stats.includes(statName)) {
          total += stat[statName];
        }
      }
      return total;
    };

    const makeTile = (x: number, y: number, stats: Record<string, number>) =>
      ({
        getX: jest.fn().mockReturnValue(x),
        getY: jest.fn().mockReturnValue(y),
        getStats: jest.fn().mockReturnValue(Object.entries(stats).map(([key, value]) => ({ [key]: value }))),
      }) as unknown as jest.Mocked<Tile>;

    const wireHighestYeild = (tiles: any[]) => {
      (GameMap.getInstance as jest.Mock).mockReturnValue({
        getTileWithHighestYeild: jest.fn(({ stats, ignoreTiles }) => {
          const candidates = tiles.filter((tile) => !ignoreTiles.includes(tile));
          if (candidates.length === 0) return undefined;

          return candidates.reduce((best, tile) =>
            totalStatValue(tile, stats) > totalStatValue(best, stats) ? tile : best
          );
        }),
      });
    };

    it("prioritizes a food tile over a higher-yield production tile when food hasn't reached the default growth target", () => {
      const foodTile = makeTile(1, 0, { food: 2 });
      const productionTile = makeTile(0, 1, { production: 5 });
      mockTile.getAdjacentTiles.mockReturnValue([foodTile, productionTile]);
      wireHighestYeild([foodTile, productionTile]);

      city = new City({ tile: mockTile, player: mockPlayer });

      expect(city['workedTiles']).toContain(foodTile);
      expect(city['workedTiles']).not.toContain(productionTile);
    });

    it('chases the best overall yield with remaining population once the growth target is met', () => {
      const foodTile = makeTile(1, 0, { food: 5 });
      const productionTile = makeTile(0, 1, { production: 3 });
      mockTile.getAdjacentTiles.mockReturnValue([foodTile, productionTile]);
      wireHighestYeild([foodTile, productionTile]);

      city = new City({ tile: mockTile, player: mockPlayer });
      city['population'] = 2;
      city.updateWorkedTiles({ sendStatUpdate: false });

      expect(city['workedTiles']).toEqual(expect.arrayContaining([foodTile, productionTile]));
    });

    it('still assigns an available positive-food tile even when the city ends up starving anyway', () => {
      const foodTile = makeTile(1, 0, { food: 1 });
      const desertTile = makeTile(0, 1, {});
      mockTile.getAdjacentTiles.mockReturnValue([foodTile, desertTile]);
      wireHighestYeild([foodTile, desertTile]);

      city = new City({ tile: mockTile, player: mockPlayer });
      city['population'] = 2;
      city.updateWorkedTiles({ sendStatUpdate: false });

      expect(city['workedTiles']).toContain(foodTile);
      expect(city.getStatline({ asArray: false }).food).toBeLessThan(0);
    });
  });

  describe('growth (nextTurn)', () => {
    // Net food per turn is the city tile's yield minus 2-per-citizen upkeep, so giving
    // the city tile a food yield is the simplest way to drive a chosen surplus/deficit.
    const setNetFoodPerTurn = (tileFood: number) => {
      mockTile.getStats.mockReturnValue([{ food: tileFood }]);
    };

    it('banks the net food surplus each turn without growing below the threshold', () => {
      setNetFoodPerTurn(5);

      triggerServerEvent('nextTurn', { turn: 2 });
      triggerServerEvent('nextTurn', { turn: 3 });

      expect(city['foodSurplus']).toBe(6);
      expect(city['population']).toBe(1);
    });

    it('grows the population once the banked food covers the growth cost', () => {
      setNetFoodPerTurn(5);
      city['foodSurplus'] = 20; // 20 + 3 this turn clears the size-1 cost of 23

      triggerServerEvent('nextTurn', { turn: 2 });

      expect(city['population']).toBe(2);
      expect(city['foodSurplus']).toBe(0);
    });

    it('carries leftover food into the next citizen rather than resetting the bank', () => {
      setNetFoodPerTurn(5);
      city['foodSurplus'] = 25; // 25 + 3 clears the cost of 23 with 5 to spare

      triggerServerEvent('nextTurn', { turn: 2 });

      expect(city['population']).toBe(2);
      expect(city['foodSurplus']).toBe(5);
    });

    it('raises the growth cost as the city gets bigger', () => {
      expect(city.getFoodRequiredToGrow()).toBe(City.GROWTH_FOOD_BASE + City.GROWTH_FOOD_PER_POP);

      city['population'] = 4;

      expect(city.getFoodRequiredToGrow()).toBe(City.GROWTH_FOOD_BASE + City.GROWTH_FOOD_PER_POP * 4);
    });

    it('starves a citizen off and empties the bank when food runs negative', () => {
      setNetFoodPerTurn(0); // -2 per citizen, with nothing coming in
      city['population'] = 2;

      triggerServerEvent('nextTurn', { turn: 2 });

      expect(city['population']).toBe(1);
      expect(city['foodSurplus']).toBe(0);
    });

    it('holds a size-1 city at one citizen instead of starving it out of existence', () => {
      setNetFoodPerTurn(0);

      triggerServerEvent('nextTurn', { turn: 2 });

      expect(city['population']).toBe(1);
      expect(city['foodSurplus']).toBe(0);
    });

    it('reports the banked food and growth cost to the client', () => {
      setNetFoodPerTurn(5);

      triggerServerEvent('nextTurn', { turn: 2 });

      const statline = city.getStatline({ asArray: false });
      expect(statline.foodSurplus).toBe(3);
      expect(statline.foodRequiredToGrow).toBe(23);
      expect(mockPlayer.sendNetworkEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'updateCityStats',
          cityStats: expect.arrayContaining([{ foodSurplus: 3 }, { foodRequiredToGrow: 23 }]),
        })
      );
    });
  });
});
