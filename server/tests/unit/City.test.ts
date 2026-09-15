import { City } from '../../src/city/City';
import { Tile } from '../../src/map/Tile';
import { GameMap } from '../../src/map/GameMap';
import { Player } from '../../src/Player';
import { Game } from '../../src/Game';
import { ServerEvents } from '../../src/Events';
import { WebSocket } from 'ws';

jest.mock('../../src/map/GameMap');
jest.mock('../../src/Player');
jest.mock('../../src/Game');
jest.mock('../../src/Events');

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
    } as unknown as jest.Mocked<Player>;

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

  it('replies to a production-options request with the hardcoded units/buildings split', () => {
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

    it('does nothing when the queue is empty', () => {
      triggerServerEvent('removeFromProductionQueue', { cityName: 'TestCity', index: 0 }, mockWebsocket);
      mockPlayer.sendNetworkEvent.mockClear();

      triggerServerEvent('nextTurn', { turn: 2 });

      expect(mockPlayer.sendNetworkEvent).not.toHaveBeenCalled();
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
  });
});
