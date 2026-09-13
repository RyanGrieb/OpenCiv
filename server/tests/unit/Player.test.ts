import { Player } from '../../src/Player';
import { City, CityStats } from '../../src/city/City';
import { ServerEvents } from '../../src/Events';
import { WebSocket } from 'ws';

jest.mock('../../src/city/City');
jest.mock('../../src/Events');

describe('Player', () => {
  let player: Player;
  let mockWebsocket: jest.Mocked<WebSocket>;

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

  beforeEach(() => {
    jest.clearAllMocks();

    mockWebsocket = {
      on: jest.fn(),
      send: jest.fn(),
    } as unknown as jest.Mocked<WebSocket>;

    jest.spyOn(ServerEvents, 'on').mockImplementation(() => { });

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

  it('sends the computed totals to the player over the network', () => {
    player['cities'].push(makeMockCity({ science: 9, gold: 2, production: 0, faith: 0, culture: 3 }));

    player.sendTotalStatsUpdate();

    expect(mockWebsocket.send).toHaveBeenCalledWith(JSON.stringify({
      event: 'updateTotalStats',
      stats: { science: 9, gold: 2, production: 0, faith: 0, culture: 3 },
    }));
  });
});
