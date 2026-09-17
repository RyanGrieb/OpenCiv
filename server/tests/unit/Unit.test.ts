import { Unit, UnitOptions } from '../../src/unit/Unit';
import { GameMap } from '../../src/map/GameMap';
import { Tile } from '../../src/map/Tile';
import { Player } from '../../src/Player';
import { ServerEvents } from '../../src/Events';
import { Game } from '../../src/Game';
import { Technology } from '../../src/research/Technology';
import { WebSocket } from 'ws';

// Mock external dependencies
jest.mock('../../src/map/GameMap');
jest.mock('../../src/Player');
jest.mock('../../src/Events');
jest.mock('../../src/Game');

describe('Unit', () => {
  let unit: Unit;
  let mockTile: jest.Mocked<Tile>;
  let targetTile: jest.Mocked<Tile>;
  let mockPlayer: jest.Mocked<Player>;
  let mockGameMap: {
    getTiles: jest.Mock<ReturnType<GameMap['getTiles']>>;
    constructShortestPath: jest.Mock<ReturnType<GameMap['constructShortestPath']>>;
    mapWidth: number;
    mapHeight: number;
  };
  // The real "moveUnit" callback registered by `unit`'s constructor, captured from the
  // ServerEvents.on mock below - lets tests exercise the actual handler logic directly,
  // since ServerEvents.call is mocked separately to a synthetic simulation (see below).
  let moveUnitCallback: (data: Record<string, any>, websocket: WebSocket) => void;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock starting tile at (0, 0)
    mockTile = {
      getX: jest.fn().mockReturnValue(0),
      getY: jest.fn().mockReturnValue(0),
      removeUnit: jest.fn(),
      addUnit: jest.fn(),
      getMovementCost: jest.fn().mockReturnValue(1),
      isWater: jest.fn().mockReturnValue(false),
      getAdjacentTiles: jest.fn().mockReturnValue([]),
      getRiverSides: jest.fn().mockReturnValue(new Array(6).fill(false)),
      hasBlockingUnit: jest.fn().mockReturnValue(false),
    } as unknown as jest.Mocked<Tile>;

    // Mock target tile at (1, 1)
    targetTile = {
      getX: jest.fn().mockReturnValue(1),
      getY: jest.fn().mockReturnValue(1),
      removeUnit: jest.fn(),
      addUnit: jest.fn(),
      getMovementCost: jest.fn().mockReturnValue(1),
      isWater: jest.fn().mockReturnValue(false),
      getAdjacentTiles: jest.fn().mockReturnValue([]),
      getRiverSides: jest.fn().mockReturnValue(new Array(6).fill(false)),
      hasBlockingUnit: jest.fn().mockReturnValue(false),
    } as unknown as jest.Mocked<Tile>;

    // Mock player
    mockPlayer = {
      getName: jest.fn().mockReturnValue('TestPlayer'),
      sendNetworkEvent: jest.fn(),
      getWebsocket: jest.fn().mockReturnValue({} as WebSocket),
      addUnit: jest.fn(),
      removeUnit: jest.fn(),
    } as unknown as jest.Mocked<Player>;

    // Mock GameMap.getInstance with minimal required properties
    mockGameMap = {
      getTiles: jest.fn().mockReturnValue([[mockTile, null], [null, targetTile]]),
      constructShortestPath: jest.fn().mockReturnValue([mockTile, targetTile]),
      mapWidth: 2,
      mapHeight: 2,
    };
    jest.spyOn(GameMap, 'getInstance').mockReturnValue(mockGameMap as any);

    // Mock Game.getInstance with minimal required properties
    jest.spyOn(Game, 'getInstance').mockReturnValue({
      getPlayers: jest.fn().mockReturnValue(new Map([[mockPlayer.getName(), mockPlayer]])),
      getPlayerFromWebsocket: jest.fn().mockReturnValue(mockPlayer),
    } as any);

    // Mock ServerEvents.call to simulate moveUnit event
    jest.spyOn(ServerEvents, 'call').mockImplementation((eventName, data, websocket) => {
      if (eventName === 'moveUnit') {
        const target = mockGameMap.getTiles()[data['targetX']][data['targetY']];
        unit['moveToTile']({
          previousTile: mockTile,
          targetTile: target,
          remainingTiles: [],
          remainingMovement: 1,
        });
      }
    });
    jest.spyOn(ServerEvents, 'on').mockImplementation((options: any) => {
      if (options.eventName === 'moveUnit') {
        moveUnitCallback = options.callback;
      }
    });

    // Initialize Unit
    const options: UnitOptions = {
      name: 'TestUnit',
      tile: mockTile,
      player: mockPlayer,
      actions: [],
    };
    unit = new Unit(options);
    // The constructor itself broadcasts createUnit - clear it so each test
    // only sees calls triggered by the behavior it's exercising.
    mockPlayer.sendNetworkEvent.mockClear();
  });

  it('initializes with correct properties', () => {
    expect(unit['name']).toBe('TestUnit');
    expect(unit['player']).toBe(mockPlayer);
    expect(unit['tile']).toBe(mockTile);
    expect(unit['availableMovement']).toBe(2);
    expect(unit['id']).toBeDefined();
  });

  it('moves to a target tile and updates state', () => {
    unit.moveToTile({
      previousTile: mockTile,
      targetTile: targetTile,
      remainingTiles: [],
      remainingMovement: 1,
    });

    expect(mockTile.removeUnit).toHaveBeenCalledWith(unit);
    expect(targetTile.addUnit).toHaveBeenCalledWith(unit);
    expect(unit['tile']).toBe(targetTile);
    expect(unit['availableMovement']).toBe(1);
    expect(mockPlayer.sendNetworkEvent).toHaveBeenCalledWith({
      event: 'moveUnit',
      id: unit['id'],
      remainingMovement: 1,
      unitX: 0,
      unitY: 0,
      targetX: 1,
      targetY: 1,
    });
  });

  it('calculates movement towards target tile', () => {
    mockGameMap.constructShortestPath.mockReturnValue([mockTile, targetTile]);

    const [arrivedTile, remainingTiles, remainingMovement] = unit['getMovementTowardsTargetTile'](targetTile);

    expect(arrivedTile).toBe(targetTile);
    expect(remainingTiles).toEqual([]);
    expect(remainingMovement).toBe(1);
  });

  it('handles no movement when out of range', () => {
    unit['availableMovement'] = 0;

    const [arrivedTile, remainingTiles] = unit['getMovementTowardsTargetTile'](targetTile);

    expect(arrivedTile).toBe(mockTile);
    expect(remainingTiles).toContain(targetTile);
  });

  it('handles server events for moveUnit', () => {
    const mockWebsocket = {} as WebSocket;
    const mockData = { id: unit['id'], targetX: 1, targetY: 1 };

    ServerEvents.call('moveUnit', mockData, mockWebsocket);

    expect(mockPlayer.sendNetworkEvent).toHaveBeenCalledWith(expect.objectContaining({
      event: 'moveUnit',
      id: unit['id'],
    }));
  });

  it('broadcasts createUnit to all players on construction', () => {
    const freshUnit = new Unit({
      name: 'AnotherUnit',
      tile: mockTile,
      player: mockPlayer,
      actions: [],
    });

    expect(mockPlayer.sendNetworkEvent).toHaveBeenCalledWith({
      event: 'createUnit',
      ...freshUnit.asJSON(),
    });
  });

  describe('unit stacking', () => {
    it('defaults to a non-utility unit', () => {
      expect(unit.isUtility()).toBe(false);
    });

    it('respects the isUtility option', () => {
      const builder = new Unit({
        name: 'Builder',
        tile: mockTile,
        player: mockPlayer,
        isUtility: true,
        actions: [],
      });

      expect(builder.isUtility()).toBe(true);
    });

    it('treats a neighbor blocked by a non-utility unit as impassably costly', () => {
      (targetTile.hasBlockingUnit as jest.Mock).mockReturnValue(true);

      expect(unit.getTileWeight(mockTile, targetTile)).toBe(9999);
      expect(targetTile.hasBlockingUnit).toHaveBeenCalledWith(unit);
    });

    it('does not cost extra when the neighbor has no blocking unit', () => {
      (targetTile.hasBlockingUnit as jest.Mock).mockReturnValue(false);

      expect(unit.getTileWeight(mockTile, targetTile)).toBe(1);
    });

    it('still pays full terrain cost by default', () => {
      (targetTile.getMovementCost as jest.Mock).mockReturnValue(2);

      expect(unit.getTileWeight(mockTile, targetTile)).toBe(2);
    });

    it('flattens terrain cost to 1 for a unit that ignores terrain', () => {
      const scout = new Unit({
        name: 'Scout',
        tile: mockTile,
        player: mockPlayer,
        ignoresTerrainCost: true,
        actions: [],
      });
      (targetTile.getMovementCost as jest.Mock).mockReturnValue(2);

      expect(scout.getTileWeight(mockTile, targetTile)).toBe(1);
    });

    it('stops short of a tile blocked by a non-utility unit without queuing it', () => {
      mockGameMap.constructShortestPath.mockReturnValue([mockTile, targetTile]);
      (targetTile.hasBlockingUnit as jest.Mock).mockReturnValue(true);

      const [arrivedTile, remainingTiles] = unit['getMovementTowardsTargetTile'](targetTile);

      expect(arrivedTile).toBe(mockTile);
      // Queuing the blocked tile would stall the unit against it every turn, then walk it in
      // the moment the blocker leaves.
      expect(remainingTiles).toEqual([]);
      expect(targetTile.addUnit).not.toHaveBeenCalled();
    });

    it('drops a queued path it can no longer advance along', () => {
      unit['queuedMovementTiles'] = [targetTile];
      (targetTile.hasBlockingUnit as jest.Mock).mockReturnValue(true);

      unit['moveWithMovementQueue']();

      expect(unit['queuedMovementTiles']).toEqual([]);
      expect(unit['tile']).toBe(mockTile);
      expect(targetTile.addUnit).not.toHaveBeenCalled();
      expect(mockPlayer.sendNetworkEvent).toHaveBeenCalledWith({
        event: 'clearMovementQueue',
        id: unit['id'],
      });
    });

    it('still advances a queued path that is not blocked', () => {
      unit['queuedMovementTiles'] = [targetTile];
      (targetTile.hasBlockingUnit as jest.Mock).mockReturnValue(false);

      unit['moveWithMovementQueue']();

      expect(unit['tile']).toBe(targetTile);
      expect(targetTile.addUnit).toHaveBeenCalledWith(unit);
    });

    it('allows moving onto a tile whose only occupant is a utility unit', () => {
      mockGameMap.constructShortestPath.mockReturnValue([mockTile, targetTile]);
      (targetTile.hasBlockingUnit as jest.Mock).mockReturnValue(false);

      const [arrivedTile] = unit['getMovementTowardsTargetTile'](targetTile);

      expect(arrivedTile).toBe(targetTile);
    });
  });

  describe('moveUnit event handler', () => {
    const mockWebsocket = {} as WebSocket;

    it('queues the rest of the path when movement is already exhausted this turn', () => {
      unit['availableMovement'] = 0;
      mockGameMap.constructShortestPath.mockReturnValue([mockTile, targetTile]);

      moveUnitCallback({ id: unit['id'], targetX: 1, targetY: 1 }, mockWebsocket);

      expect(unit['queuedMovementTiles']).toEqual([targetTile]);
      expect(mockPlayer.sendNetworkEvent).toHaveBeenCalledWith(expect.objectContaining({
        event: 'moveUnit',
        queuedTiles: [{ x: 1, y: 1 }],
      }));
    });

    it('rejects a move that is blocked immediately, without queuing or broadcasting', () => {
      // Movement is available (the constructor default) - blocking is only ever checked while
      // there's movement left to spend, since with 0 movement we can't step there regardless
      // and would just defer the real blocking check to next turn's resumption.
      mockGameMap.constructShortestPath.mockReturnValue([mockTile, targetTile]);
      (targetTile.hasBlockingUnit as jest.Mock).mockReturnValue(true);

      moveUnitCallback({ id: unit['id'], targetX: 1, targetY: 1 }, mockWebsocket);

      expect(unit['queuedMovementTiles']).toEqual([]);
      expect(mockPlayer.sendNetworkEvent).not.toHaveBeenCalled();
    });

    it('rejects a move with no path at all, without queuing or broadcasting', () => {
      unit['availableMovement'] = 0;
      mockGameMap.constructShortestPath.mockReturnValue([]);

      moveUnitCallback({ id: unit['id'], targetX: 1, targetY: 1 }, mockWebsocket);

      expect(unit['queuedMovementTiles']).toEqual([]);
      expect(mockPlayer.sendNetworkEvent).not.toHaveBeenCalled();
    });
  });

  describe('createFromName', () => {
    // Exercises the real config/units.yml, same as Building.test.ts does for
    // buildings.yml - nothing in this suite mocks fs/yaml for this path.
    it('creates a Warrior with the configured attack type', () => {
      const warrior = Unit.createFromName('Warrior', mockTile, mockPlayer);

      expect(warrior).toBeDefined();
      expect(warrior['name']).toBe('Warrior');
      expect(warrior['attackType']).toBe('melee');
    });

    it('defaults a Settler to the unarmed attack type', () => {
      const settler = Unit.createFromName('Settler', mockTile, mockPlayer);

      expect(settler).toBeDefined();
      expect(settler['attackType']).toBe('none');
    });

    it('returns undefined for an unrecognized unit name', () => {
      expect(Unit.createFromName('Nonexistent', mockTile, mockPlayer)).toBeUndefined();
    });

    it('gives a Scout 3 movement and terrain-ignoring movement', () => {
      const scout = Unit.createFromName('Scout', mockTile, mockPlayer);

      expect(scout).toBeDefined();
      expect(scout['defaultMoveDistance']).toBe(3);
      expect(scout.ignoresTerrainCost()).toBe(true);
    });
  });

  describe('getAllUnitData', () => {
    it('includes every unit the config knows about', () => {
      const names = Unit.getAllUnitData().map((unit) => unit.name);

      expect(names).toEqual(expect.arrayContaining(['Warrior', 'Settler', 'Archer', 'Crossbowman']));
    });

    it('exposes cost and required_tech for a tech-gated unit', () => {
      const caravan = Unit.getAllUnitData().find((unit) => unit.name === 'Caravan');

      expect(caravan.cost).toBe(75);
      expect(caravan.required_tech).toBe('Animal Husbandry');
    });

    it('leaves cost undefined for a unit never offered through production', () => {
      const settler = Unit.getAllUnitData().find((unit) => unit.name === 'Settler');

      expect(settler.cost).toBeUndefined();
    });

    it('exposes the Scout movement overrides', () => {
      const scout = Unit.getAllUnitData().find((unit) => unit.name === 'Scout');

      expect(scout.default_move_distance).toBe(3);
      expect(scout.ignores_terrain_cost).toBe(true);
    });

    it('has every required_tech reference a technology that actually exists in techs.yml', () => {
      const techNames = new Set(Technology.getAllTechnologies().map((tech) => tech.getName()));

      for (const unit of Unit.getAllUnitData()) {
        if (unit.required_tech) {
          expect(techNames.has(unit.required_tech)).toBe(true);
        }
      }
    });
  });
});