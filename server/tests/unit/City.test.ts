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

    mockPlayer = {
      getNextAvailableCityName: jest.fn().mockReturnValue('TestCity'),
      sendNetworkEvent: jest.fn(),
      sendTotalStatsUpdate: jest.fn(),
      getCities: jest.fn().mockReturnValue([]),
    } as unknown as jest.Mocked<Player>;

    jest.spyOn(GameMap, 'getInstance').mockReturnValue({
      getTileWithHighestYeild: jest.fn().mockReturnValue(mockTile),
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

  it('appends a valid option to the production queue and re-sends city stats', () => {
    const mockWebsocket = {} as WebSocket;

    triggerServerEvent('addToProductionQueue', { cityName: 'TestCity', type: 'unit', name: 'Warrior' }, mockWebsocket);

    expect(city['productionQueue']).toEqual([{ type: 'unit', name: 'Warrior', cost: 30 }]);
    expect(mockPlayer.sendNetworkEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'updateCityStats',
        productionQueue: [{ type: 'unit', name: 'Warrior', cost: 30 }],
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
      { type: 'unit', name: 'Scout', cost: 20 },
      { type: 'building', name: 'Monument', cost: 60 },
    ]);
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

      expect(city['productionQueue']).toEqual([{ type: 'unit', name: 'Scout', cost: 20 }]);
      expect(mockPlayer.sendNetworkEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'updateCityStats',
          productionQueue: [{ type: 'unit', name: 'Scout', cost: 20 }],
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
        { type: 'unit', name: 'Scout', cost: 20 },
        { type: 'unit', name: 'Warrior', cost: 30 },
      ]);
    });

    it('swaps an item with the next one when moved down', () => {
      triggerServerEvent('moveProductionQueueItem', { cityName: 'TestCity', index: 0, direction: 'down' }, mockWebsocket);

      expect(city['productionQueue']).toEqual([
        { type: 'unit', name: 'Scout', cost: 20 },
        { type: 'unit', name: 'Warrior', cost: 30 },
      ]);
    });

    it('ignores moving the first item up', () => {
      triggerServerEvent('moveProductionQueueItem', { cityName: 'TestCity', index: 0, direction: 'up' }, mockWebsocket);

      expect(city['productionQueue']).toEqual([
        { type: 'unit', name: 'Warrior', cost: 30 },
        { type: 'unit', name: 'Scout', cost: 20 },
      ]);
      expect(mockPlayer.sendNetworkEvent).not.toHaveBeenCalled();
    });

    it('ignores moving the last item down', () => {
      triggerServerEvent('moveProductionQueueItem', { cityName: 'TestCity', index: 1, direction: 'down' }, mockWebsocket);

      expect(city['productionQueue']).toEqual([
        { type: 'unit', name: 'Warrior', cost: 30 },
        { type: 'unit', name: 'Scout', cost: 20 },
      ]);
      expect(mockPlayer.sendNetworkEvent).not.toHaveBeenCalled();
    });
  });
});
