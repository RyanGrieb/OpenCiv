import { Game } from '../../src/Game';
import { DefaultGameOptions } from '../../src/GameOptions';
import { Player } from '../../src/Player';
import { City } from '../../src/city/City';
import { PlayerHappiness } from '../../src/happiness/PlayerHappiness';
import { Tile } from '../../src/map/Tile';
import { Combat } from '../../src/unit/Combat';
import { Unit } from '../../src/unit/Unit';

describe('PlayerHappiness', () => {
  let cities: City[];
  let addMessage: jest.Mock;
  let player: Player;
  let happiness: PlayerHappiness;
  let baseHappiness: number;

  const makeCity = (options: { name?: string; population?: number; territory?: Tile[]; buildingHappiness?: number } = {}) =>
    ({
      getName: () => options.name ?? 'Rome',
      getPopulation: () => options.population ?? 1,
      getTerritory: () => options.territory ?? [],
      getBuildingHappiness: () => options.buildingHappiness ?? 0
    }) as unknown as City;

  const tileWith = (...types: string[]) => {
    const tile = new Tile('grass', 0, 0);
    types.forEach((type) => tile.addTileType(type));
    return tile;
  };

  beforeEach(() => {
    cities = [];
    addMessage = jest.fn();
    baseHappiness = DefaultGameOptions.baseHappiness;
    jest.spyOn(Game, 'getInstance').mockReturnValue({
      getGameOptions: () => ({ ...DefaultGameOptions, baseHappiness })
    } as unknown as Game);

    player = {
      getCities: () => cities,
      isBarbarian: () => false,
      getNotifications: () => ({ addMessage })
    } as unknown as Player;
    happiness = new PlayerHappiness(player);
  });

  afterEach(() => jest.restoreAllMocks());

  it("starts from Civ 5's 9 base happiness on standard difficulty", () => {
    expect(happiness.getNet()).toBe(9);
  });

  it('costs 3 per city and 1 per citizen', () => {
    cities.push(makeCity({ population: 1 }), makeCity({ name: 'Antium', population: 4 }));

    const breakdown = happiness.getBreakdown();
    expect(breakdown.unhappiness).toEqual([
      { source: '2 cities', amount: 6 },
      { source: '5 citizens', amount: 5 }
    ]);
    expect(breakdown.net).toBe(9 - 6 - 5);
  });

  it('gives +4 for each different improved luxury in its borders, and nothing for a second of the same', () => {
    const territory = [
      tileWith('citrus_plantation'),
      tileWith('citrus_plantation'),
      tileWith('whales', 'improved_whales'),
      tileWith('copper_mine'),
      // Not improved yet, and not a luxury.
      tileWith('cotton'),
      tileWith('improved_cattle')
    ];
    // Fishing Boats swap the resource for its improved tile type, like every other improvement.
    territory[2].removeTileType('whales');
    cities.push(makeCity({ population: 0, territory }));

    expect(happiness.getLuxuries()).toEqual(['citrus', 'copper', 'whales']);
    expect(happiness.getBreakdown().sources).toEqual([
      { source: 'Base', amount: 9 },
      { source: 'Citrus', amount: 4 },
      { source: 'Copper', amount: 4 },
      { source: 'Whales', amount: 4 }
    ]);
  });

  it('counts a luxury under a city without an improvement, as Civ 5 connects it', () => {
    const center = tileWith('olives');
    jest.spyOn(center, 'getCity').mockReturnValue(makeCity());
    cities.push(makeCity({ population: 0, territory: [center] }));

    expect(happiness.getLuxuries()).toEqual(['olives']);
  });

  it("adds each city's building and wonder happiness", () => {
    cities.push(makeCity({ name: 'Rome', population: 0, buildingHappiness: 3 }));

    expect(happiness.getBreakdown().sources).toContainEqual({ source: 'Buildings in Rome', amount: 3 });
    expect(happiness.getNet()).toBe(9 + 3 - 3);
  });

  describe('status', () => {
    const setNet = (net: number) => {
      baseHappiness = net;
    };

    it('is content at zero, unhappy below it, and very unhappy at -10', () => {
      setNet(0);
      expect(happiness.getStatus()).toBe('content');
      setNet(-1);
      expect(happiness.getStatus()).toBe('unhappy');
      setNet(-9);
      expect(happiness.getStatus()).toBe('unhappy');
      setNet(-10);
      expect(happiness.getStatus()).toBe('veryUnhappy');
    });

    it('cuts growth by 75% while unhappy and stops it while very unhappy, leaving starvation alone', () => {
      expect(happiness.applyToFoodSurplus(4)).toBe(4);

      setNet(-1);
      expect(happiness.applyToFoodSurplus(4)).toBe(1);
      expect(happiness.applyToFoodSurplus(3)).toBe(0.75);
      expect(happiness.applyToFoodSurplus(-2)).toBe(-2);

      setNet(-10);
      expect(happiness.applyToFoodSurplus(4)).toBe(0);
      expect(happiness.applyToFoodSurplus(-2)).toBe(-2);
    });

    it("can't train Settlers while very unhappy", () => {
      setNet(-9);
      expect(happiness.canTrain('Settler')).toBe(true);

      setNet(-10);
      expect(happiness.canTrain('Settler')).toBe(false);
      expect(happiness.canTrain('Warrior')).toBe(true);
    });

    it('lists what the status costs for the tooltip', () => {
      expect(happiness.getBreakdown().effects).toEqual([]);
      setNet(-1);
      expect(happiness.getBreakdown().effects).toEqual(['City growth -75%']);
      setNet(-10);
      expect(happiness.getBreakdown().effects).toEqual([
        'Cities stop growing',
        "Can't train Settlers",
        'Units -33% combat strength'
      ]);
    });

    it('notifies the player once each time the status changes', () => {
      expect(happiness.announceStatusChange()).toBe(false);

      setNet(-3);
      expect(happiness.announceStatusChange()).toBe(true);
      expect(happiness.announceStatusChange()).toBe(false);
      expect(addMessage).toHaveBeenLastCalledWith('ICON_UNHAPPY', expect.stringContaining('unhappy'));

      setNet(-12);
      expect(happiness.announceStatusChange()).toBe(true);
      expect(addMessage).toHaveBeenLastCalledWith('ICON_UNHAPPY', expect.stringContaining('very unhappy'));

      setNet(2);
      expect(happiness.announceStatusChange()).toBe(true);
      expect(addMessage).toHaveBeenLastCalledWith('ICON_MORALE', 'Your empire is content again.');
      expect(addMessage).toHaveBeenCalledTimes(3);
    });

    it("leaves the barbarians' units and growth alone", () => {
      (player as any).isBarbarian = () => true;
      setNet(-20);

      expect(happiness.getStatus()).toBe('content');
      expect(happiness.getCombatModifiers()).toEqual([]);
    });
  });

  describe('combat', () => {
    const standOn = (tile: Tile) => {
      const unit = { canFight: () => true, getPlayer: () => ({ getHappiness: () => happiness }) } as unknown as Unit;
      tile.addUnit(unit);
    };

    it("weakens a very unhappy empire's units by a third, attacking and defending", () => {
      const from = new Tile('grass', 0, 0);
      const target = new Tile('grass', 1, 0);
      standOn(from);
      standOn(target);
      expect(Combat.getDefenseStrength(10, target)).toBe(10);

      baseHappiness = -10;
      expect(Combat.getDefenseModifiers(target)).toEqual([{ label: 'Very unhappy', value: -0.33 }]);
      expect(Combat.getDefenseStrength(10, target)).toBeCloseTo(6.7);
      expect(Combat.getAttackStrength(10, from, target)).toBeCloseTo(6.7);
      expect(Combat.getRangedAttackStrength(10, from)).toBeCloseTo(6.7);
      // Terrain alone, as the unit info panel shows it.
      expect(Combat.getTerrainDefenseModifier(target)).toBe(0);
    });
  });
});
