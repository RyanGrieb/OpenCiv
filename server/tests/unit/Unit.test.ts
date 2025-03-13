import { Unit, UnitOptions } from '../../src/unit/Unit';
import { GameMap } from '../../src/map/GameMap';
import { Tile } from '../../src/map/Tile';
import { Player } from '../../src/Player';
import { ServerEvents } from '../../src/Events';
import { Game } from '../../src/Game';
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
    } as unknown as jest.Mocked<Tile>;

    // Mock player
    mockPlayer = {
      getName: jest.fn().mockReturnValue('TestPlayer'),
      sendNetworkEvent: jest.fn(),
      getWebsocket: jest.fn().mockReturnValue({} as WebSocket),
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
    jest.spyOn(ServerEvents, 'on').mockImplementation(() => {});

    // Initialize Unit
    const options: UnitOptions = {
      name: 'TestUnit',
      tile: mockTile,
      player: mockPlayer,
      actions: [],
    };
    unit = new Unit(options);
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
});