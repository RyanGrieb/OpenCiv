import { Player } from '../../src/Player';
import { City, CityStats } from '../../src/city/City';
import { ServerEvents } from '../../src/Events';
import { WebSocket } from 'ws';

jest.mock('../../src/city/City');
jest.mock('../../src/Events');

describe('Player', () => {
  let player: Player;
  let mockWebsocket: jest.Mocked<WebSocket>;
  let onSpy: jest.SpyInstance;

  const makeMockCity = (stats: Partial<CityStats>): jest.Mocked<City> => {
    return {
      getStatline: jest.fn().mockReturnValue({
        population: 0,
        science: 0,
        gold: 0,
        production: 0,
        faith: 0,
        culture: 0,
        food: 0,
        morale: 0,
        foodSurplus: 0,
        ...stats,
      }),
    } as unknown as jest.Mocked<City>;
  };

  // Player's constructor registers its listeners through the mocked ServerEvents.on,
  // which never actually dispatches anything - this replays a named listener's
  // callback directly, the way Unit.test.ts replays ServerEvents.call for moveUnit.
  const triggerServerEvent = (eventName: string, data?: any, websocket?: WebSocket) => {
    const registration = onSpy.mock.calls.find(([options]) => options.eventName === eventName);
    registration[0].callback(data, websocket);
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockWebsocket = {
      on: jest.fn(),
      send: jest.fn(),
    } as unknown as jest.Mocked<WebSocket>;

    onSpy = jest.spyOn(ServerEvents, 'on').mockImplementation(() => { });

    player = new Player('TestPlayer', mockWebsocket);
  });

  it('sums stats that pool across the empire from every city', () => {
    player['cities'].push(
      makeMockCity({ science: 2, gold: 3, production: 1, faith: 0, culture: 4 }),
      makeMockCity({ science: 5, gold: 1, production: 2, faith: 6, culture: 0 })
    );

    expect(player.getTotalStats()).toEqual({
      science: 7,
      gold: 4,
      production: 3,
      faith: 6,
      culture: 4,
    });
  });

  it('ignores city-specific stats that should not pool empire-wide', () => {
    player['cities'].push(
      makeMockCity({ science: 1, gold: 1, production: 1, faith: 1, culture: 1, population: 10, morale: 5, food: 8, foodSurplus: 2 })
    );

    expect(player.getTotalStats()).toEqual({
      science: 1,
      gold: 1,
      production: 1,
      faith: 1,
      culture: 1,
    });
  });

  it('returns all-zero totals with no cities', () => {
    expect(player.getTotalStats()).toEqual({
      science: 0,
      gold: 0,
      production: 0,
      faith: 0,
      culture: 0,
    });
  });

  it('starts with no accumulated stats banked', () => {
    expect(player.getAccumulatedStats()).toEqual({});
  });

  it('sends the computed totals to the player over the network', () => {
    player['cities'].push(makeMockCity({ science: 9, gold: 2, production: 0, faith: 0, culture: 3 }));

    player.sendTotalStatsUpdate();

    expect(mockWebsocket.send).toHaveBeenCalledWith(JSON.stringify({
      event: 'updateTotalStats',
      stats: { science: 9, gold: 2, production: 0, faith: 0, culture: 3 },
      accumulatedStats: {},
    }));
  });

  it('banks the current per-turn rate of every accumulating stat on each turn', () => {
    player['cities'].push(makeMockCity({ gold: 5 }));

    triggerServerEvent('nextTurn');
    expect(player.getAccumulatedStats()).toEqual({ gold: 5 });

    triggerServerEvent('nextTurn');
    expect(player.getAccumulatedStats()).toEqual({ gold: 10 });
  });

  it('does not bank stats that are not marked as accumulating', () => {
    player['cities'].push(makeMockCity({ science: 5, faith: 5, culture: 5, production: 5 }));

    triggerServerEvent('nextTurn');

    expect(player.getAccumulatedStats()).toEqual({ gold: 0 });
  });

  it('sends an updated totals packet after banking stats for the turn', () => {
    player['cities'].push(makeMockCity({ gold: 5 }));

    triggerServerEvent('nextTurn');

    expect(mockWebsocket.send).toHaveBeenCalledWith(JSON.stringify({
      event: 'updateTotalStats',
      stats: { science: 0, gold: 5, production: 0, faith: 0, culture: 0 },
      accumulatedStats: { gold: 5 },
    }));
  });
});
