import { Player } from '../../src/Player';
import { City, CityStats } from '../../src/city/City';
import { ServerEvents } from '../../src/Events';
import { WebSocket } from 'ws';
import { PlayerTreasury } from '../../src/economy/PlayerTreasury';

jest.mock('../../src/city/City');
jest.mock('../../src/Events');

describe('Player', () => {
  let player: Player;
  let mockWebsocket: jest.Mocked<WebSocket>;
  let onSpy: jest.SpyInstance;

  const makeMockCity = (stats: Partial<CityStats>, options: { name?: string; maintenance?: number } = {}): jest.Mocked<City> => {
    return {
      getName: jest.fn().mockReturnValue(options.name ?? 'TestCity'),
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
      getBuildingMaintenance: jest.fn().mockReturnValue(options.maintenance ?? 0),
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
      goldBreakdown: { income: [{ source: 'TestCity', amount: 2 }], expenses: [], net: 2 },
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
      goldBreakdown: { income: [{ source: 'TestCity', amount: 5 }], expenses: [], net: 5 },
    }));
  });

  describe('gold upkeep', () => {
    const addUnits = (count: number, options: { canFight?: boolean } = {}) => {
      const units = Array.from({ length: count }, (_, index) => ({
        getName: jest.fn().mockReturnValue(`Unit${index}`),
        canFight: jest.fn().mockReturnValue(options.canFight ?? true),
        delete: jest.fn(),
      }));
      units.forEach((unit) => player.addUnit(unit as any));
      return units;
    };

    beforeEach(() => {
      player.setCivilizationData({ name: 'Rome', cities: [] });
      player['notifications'] = { addMessage: jest.fn() } as any;
    });

    it('takes building maintenance out of the per-turn gold rate', () => {
      player['cities'].push(makeMockCity({ gold: 5 }, { maintenance: 3 }));

      expect(player.getTotalStats().gold).toBe(2);
    });

    it('charges each unit past the free ones', () => {
      player['cities'].push(makeMockCity({ gold: 5 }));
      addUnits(PlayerTreasury.FREE_UNITS + 2);

      expect(player.getTotalStats().gold).toBe(5 - 2 * PlayerTreasury.GOLD_PER_UNIT);
    });

    it('charges nothing for units within the free allowance', () => {
      player['cities'].push(makeMockCity({ gold: 5 }));
      addUnits(PlayerTreasury.FREE_UNITS);

      expect(player.getTotalStats().gold).toBe(5);
    });

    it('lists income per city and each kind of upkeep in the breakdown', () => {
      player['cities'].push(makeMockCity({ gold: 4 }, { name: 'Rome', maintenance: 1 }), makeMockCity({ gold: 0 }, { name: 'Antium', maintenance: 2 }));
      addUnits(PlayerTreasury.FREE_UNITS + 1);

      expect(player.getTreasury().getBreakdown()).toEqual({
        income: [{ source: 'Rome', amount: 4 }],
        expenses: [
          { source: 'Building maintenance', amount: 3 },
          { source: `Unit maintenance (${PlayerTreasury.FREE_UNITS + 1} units, ${PlayerTreasury.FREE_UNITS} free)`, amount: 1 },
        ],
        net: 0,
      });
    });

    it('empties a treasury in debt and disbands a military unit', () => {
      const [civilian] = addUnits(1, { canFight: false });
      const [soldier] = addUnits(1);
      player.addToAccumulatedStat('gold', -4);

      player.getTreasury().settleDebt();

      expect(player.getAccumulatedStats()).toEqual({ gold: 0 });
      expect(soldier.delete).toHaveBeenCalled();
      expect(civilian.delete).not.toHaveBeenCalled();
    });

    it('leaves a treasury that is not in debt alone', () => {
      const [soldier] = addUnits(1);
      player.addToAccumulatedStat('gold', 0);

      player.getTreasury().settleDebt();

      expect(soldier.delete).not.toHaveBeenCalled();
    });
  });
});
