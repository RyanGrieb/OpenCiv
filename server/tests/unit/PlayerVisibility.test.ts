import { PlayerVisibility } from '../../src/map/PlayerVisibility';
import { GameMap } from '../../src/map/GameMap';
import { Tile } from '../../src/map/Tile';
import { Player } from '../../src/Player';
import { Game } from '../../src/Game';
import { Unit } from '../../src/unit/Unit';

jest.mock('../../src/map/GameMap');
jest.mock('../../src/Player');
jest.mock('../../src/Game');

// A tile that only knows its own coordinates and its neighbors - enough for the adjacency walk
// getTilesInRange() does, without generating a real map.
const mockTile = (x: number, y: number) => {
  const tile = {
    getX: () => x,
    getY: () => y,
    adjacent: [] as Tile[],
    getAdjacentTiles: () => tile.adjacent,
    getCityTerritoryOf: (): Tile | undefined => undefined,
  };

  return tile as unknown as Tile & { adjacent: Tile[] };
};

// Links two tiles as neighbors of each other, the way GameMap.initAdjacentTiles() would.
const link = (a: Tile & { adjacent: Tile[] }, b: Tile & { adjacent: Tile[] }) => {
  a.adjacent.push(b);
  b.adjacent.push(a);
};

describe('GameMap.getTilesInRange', () => {
  // GameMap is auto-mocked above, so borrow the real method and call it against a bare object:
  // the walk only ever touches the argument's adjacency.
  const RealGameMap = jest.requireActual('../../src/map/GameMap').GameMap as typeof GameMap;
  const tilesInRange = (tile: Tile, range: number) => RealGameMap.prototype.getTilesInRange.call({}, tile, range);

  it('returns only the origin at range 0', () => {
    const center = mockTile(1, 1);
    link(center, mockTile(1, 0));

    expect(tilesInRange(center, 0)).toEqual([center]);
  });

  it('expands one ring per step', () => {
    // A straight chain: center - a - b - c
    const center = mockTile(0, 0);
    const a = mockTile(1, 0);
    const b = mockTile(2, 0);
    const c = mockTile(3, 0);
    link(center, a);
    link(a, b);
    link(b, c);

    expect(tilesInRange(center, 1)).toEqual([center, a]);
    expect(tilesInRange(center, 2)).toEqual([center, a, b]);
    expect(tilesInRange(center, 3)).toEqual([center, a, b, c]);
  });

  it('visits a tile once even when several neighbors reach it', () => {
    // A diamond, so `end` is reachable through both `left` and `right`.
    const start = mockTile(0, 0);
    const left = mockTile(0, 1);
    const right = mockTile(1, 0);
    const end = mockTile(1, 1);
    link(start, left);
    link(start, right);
    link(left, end);
    link(right, end);

    const tiles = tilesInRange(start, 2);

    expect(tiles).toHaveLength(4);
    expect(new Set(tiles).size).toBe(4);
  });

  it('stops at a missing neighbor rather than walking off the map', () => {
    const edge = mockTile(0, 0);
    edge.adjacent.push(null);

    expect(tilesInRange(edge, 2)).toEqual([edge]);
  });
});

describe('GameMap.hasLineOfSight', () => {
  // GameMap is auto-mocked above, so stand up a real one without running its constructor or map
  // generation: an object on the real prototype, carrying just the `tiles` lookup that
  // hasLineOfSight walks. The static wrap helpers it calls are unaffected by the mock - see the
  // getTilesInRange block above for why.
  const RealGameMap = jest.requireActual('../../src/map/GameMap').GameMap as typeof GameMap;
  const sees = (tiles: Tile[][], from: Tile, to: Tile) => {
    const gameMap: GameMap = Object.assign(Object.create(RealGameMap.prototype), { tiles });
    return gameMap.hasLineOfSight(from, to);
  };

  // A sparse 2D array with real Tile objects at each given (x, y).
  const grid = (...tiles: Tile[]): Tile[][] => {
    const tiles2D: Tile[][] = [];
    for (const tile of tiles) {
      tiles2D[tile.getX()] = tiles2D[tile.getX()] ?? [];
      tiles2D[tile.getX()][tile.getY()] = tile;
    }
    return tiles2D;
  };

  it('always sees the tile directly adjacent to it, blocking terrain or not', () => {
    const origin = new Tile('grass', 5, 10);
    const adjacent = new Tile('mountain', 6, 10);

    expect(sees(grid(origin, adjacent), origin, adjacent)).toBe(true);
  });

  it('sees past open terrain in a straight line', () => {
    const origin = new Tile('grass', 10, 10);
    const middle = new Tile('grass', 8, 10);
    const target = new Tile('grass', 6, 10);

    expect(sees(grid(origin, middle, target), origin, target)).toBe(true);
  });

  it('is blocked by a hill sitting on the line to a farther tile', () => {
    const origin = new Tile('grass', 10, 10);
    const hill = new Tile('grass_hill', 8, 10);
    const target = new Tile('grass', 6, 10);

    expect(sees(grid(origin, hill, target), origin, target)).toBe(false);
  });

  it('is blocked the same way by a mountain', () => {
    const origin = new Tile('grass', 10, 10);
    const mountain = new Tile('mountain', 8, 10);
    const target = new Tile('grass', 6, 10);

    expect(sees(grid(origin, mountain, target), origin, target)).toBe(false);
  });

  it('is not blocked once the obstruction is gone', () => {
    const origin = new Tile('grass', 10, 10);
    const target = new Tile('grass', 6, 10);

    // No tile registered at the midpoint at all - nothing there to block it.
    expect(sees(grid(origin, target), origin, target)).toBe(true);
  });

  // Not every short sightline threads a seam: (10,10) -> (8,10) runs squarely through (9,10),
  // so a single obstruction there still blocks, two tiles out.
  it('is blocked two tiles out when the sightline runs squarely through the obstruction', () => {
    const origin = new Tile('grass', 10, 10);
    const mountain = new Tile('mountain', 9, 10);
    const target = new Tile('grass', 8, 10);

    expect(sees(grid(origin, mountain, target), origin, target)).toBe(false);
  });

  // (10,10) -> (10,8) is two hex-steps straight up a column. The sightline runs down the seam
  // between (10,9) and (9,9), so either of them alone leaves a way through.
  it('sees past a lone obstruction on a diagonal, which the sightline slips beside', () => {
    const origin = new Tile('grass', 10, 10);
    const mountain = new Tile('mountain', 10, 9);
    const target = new Tile('grass', 10, 8);

    expect(sees(grid(origin, mountain, target), origin, target)).toBe(true);
  });

  it('is blocked on a diagonal only when both tiles the sightline threads between obstruct', () => {
    const origin = new Tile('grass', 10, 10);
    const mountain = new Tile('mountain', 10, 9);
    const hill = new Tile('grass_hill', 9, 9);
    const target = new Tile('grass', 10, 8);

    expect(sees(grid(origin, mountain, hill, target), origin, target)).toBe(false);
  });

  it('lets a unit standing on a hill see past another hill', () => {
    const elevatedOrigin = new Tile('grass_hill', 10, 10);
    const hill = new Tile('grass_hill', 8, 10);
    const target = new Tile('grass', 6, 10);

    expect(sees(grid(elevatedOrigin, hill, target), elevatedOrigin, target)).toBe(true);
  });

  it('still hides what a mountain covers from a unit on a hill, since it stands taller', () => {
    const elevatedOrigin = new Tile('grass_hill', 10, 10);
    const mountain = new Tile('mountain', 8, 10);
    const target = new Tile('grass', 6, 10);

    expect(sees(grid(elevatedOrigin, mountain, target), elevatedOrigin, target)).toBe(false);
  });

  describe('woods', () => {
    // Forest and jungle grow a step above the ground they sit on, so from the flats they hide
    // what's behind them exactly as a hill does.
    const woodedTile = (feature: string, x: number, y: number) => {
      const tile = new Tile('grass', x, y);
      tile.addTileType(feature);
      return tile;
    };

    it('is blocked by a forest on flat ground', () => {
      const origin = new Tile('grass', 10, 10);
      const forest = woodedTile('forest', 8, 10);
      const target = new Tile('grass', 6, 10);

      expect(sees(grid(origin, forest, target), origin, target)).toBe(false);
    });

    it('is blocked by a jungle on flat ground', () => {
      const origin = new Tile('grass', 10, 10);
      const jungle = woodedTile('jungle', 8, 10);
      const target = new Tile('grass', 6, 10);

      expect(sees(grid(origin, jungle, target), origin, target)).toBe(false);
    });

    it('sees over a forest from a hill, which stands above the treetops', () => {
      const elevatedOrigin = new Tile('grass_hill', 10, 10);
      const forest = woodedTile('forest', 8, 10);
      const target = new Tile('grass', 6, 10);

      expect(sees(grid(elevatedOrigin, forest, target), elevatedOrigin, target)).toBe(true);
    });

    it('is blocked by a forest on a hill even from another hill, the two stacking to a mountain', () => {
      const elevatedOrigin = new Tile('grass_hill', 10, 10);
      const woodedHill = woodedTile('forest', 8, 10);
      woodedHill.addTileType('grass_hill');
      const target = new Tile('grass', 6, 10);

      expect(sees(grid(elevatedOrigin, woodedHill, target), elevatedOrigin, target)).toBe(false);
    });

    it('does not let standing in a forest see any further than flat ground would', () => {
      const origin = woodedTile('forest', 10, 10);
      const hill = new Tile('grass_hill', 8, 10);
      const target = new Tile('grass', 6, 10);

      expect(sees(grid(origin, hill, target), origin, target)).toBe(false);
    });
  });
});

describe('PlayerVisibility', () => {
  let visibility: PlayerVisibility;
  let mockPlayer: jest.Mocked<Player>;
  let sendTilesToPlayer: jest.Mock;
  let unitTile: Tile;
  let sightedTiles: Tile[];

  const homeTile = mockTile(5, 5);
  const adjacentTile = mockTile(5, 6);
  const farTile = mockTile(20, 20);

  beforeEach(() => {
    jest.clearAllMocks();

    unitTile = homeTile;
    sightedTiles = [homeTile, adjacentTile];

    const mockUnit = {
      getTile: () => unitTile,
      getSightRange: () => 1,
    } as unknown as Unit;

    mockPlayer = {
      getName: jest.fn().mockReturnValue('TestPlayer'),
      sendNetworkEvent: jest.fn(),
      getUnits: jest.fn().mockReturnValue([mockUnit]),
      getCities: jest.fn().mockReturnValue([]),
    } as unknown as jest.Mocked<Player>;

    sendTilesToPlayer = jest.fn();
    jest.spyOn(GameMap, 'getInstance').mockReturnValue({
      // Sight is whatever the current test says it is - the walk itself is covered above.
      getTilesInRange: jest.fn(() => sightedTiles),
      // Line-of-sight blocking is covered in its own describe block below, against the real
      // implementation - here it's a no-op so these tests exercise only the discover/fog bookkeeping.
      hasLineOfSight: jest.fn(() => true),
      sendTilesToPlayer,
    } as unknown as GameMap);

    jest.spyOn(Game, 'getInstance').mockReturnValue({
      getGameOptions: jest.fn().mockReturnValue({ revealMap: false }),
    } as unknown as Game);

    visibility = new PlayerVisibility(mockPlayer);
  });

  it('starts with nothing discovered', () => {
    expect(visibility.hasDiscovered(homeTile)).toBe(false);
    expect(visibility.isVisible(homeTile)).toBe(false);
  });

  it('discovers and sends the tiles a unit can see', () => {
    visibility.update();

    expect(visibility.isVisible(homeTile)).toBe(true);
    expect(visibility.hasDiscovered(adjacentTile)).toBe(true);
    expect(sendTilesToPlayer).toHaveBeenCalledWith(mockPlayer, [homeTile, adjacentTile]);
  });

  it('never sees a tile outside sight range', () => {
    visibility.update();

    expect(visibility.isVisible(farTile)).toBe(false);
    expect(visibility.hasDiscovered(farTile)).toBe(false);
  });

  it('only sends tiles that were not already visible', () => {
    visibility.update();
    sendTilesToPlayer.mockClear();

    // Sight now covers one tile it already had, plus one it didn't.
    sightedTiles = [adjacentTile, farTile];
    visibility.update();

    expect(sendTilesToPlayer).toHaveBeenCalledWith(mockPlayer, [farTile]);
  });

  it('resends a tile that comes back into sight, so it can catch up on changes', () => {
    visibility.update();
    sightedTiles = [farTile];
    visibility.update();
    sendTilesToPlayer.mockClear();

    sightedTiles = [homeTile];
    visibility.update();

    expect(sendTilesToPlayer).toHaveBeenCalledWith(mockPlayer, [homeTile]);
  });

  it('fogs tiles that fall out of sight but keeps them discovered', () => {
    visibility.update();
    mockPlayer.sendNetworkEvent.mockClear();

    sightedTiles = [farTile];
    visibility.update();

    expect(mockPlayer.sendNetworkEvent).toHaveBeenCalledWith({
      event: 'fogTiles',
      tiles: [
        { x: homeTile.getX(), y: homeTile.getY() },
        { x: adjacentTile.getX(), y: adjacentTile.getY() },
      ],
    });
    expect(visibility.isVisible(homeTile)).toBe(false);
    expect(visibility.hasDiscovered(homeTile)).toBe(true);
  });

  it('sends nothing when sight has not changed', () => {
    visibility.update();
    sendTilesToPlayer.mockClear();
    mockPlayer.sendNetworkEvent.mockClear();

    visibility.update();

    expect(sendTilesToPlayer).not.toHaveBeenCalled();
    expect(mockPlayer.sendNetworkEvent).not.toHaveBeenCalled();
  });

  it('includes what a city can see', () => {
    const cityTile = mockTile(9, 9);
    mockPlayer.getCities.mockReturnValue([{ getTile: () => cityTile } as any]);
    sightedTiles = [cityTile];

    visibility.update();

    expect(visibility.isVisible(cityTile)).toBe(true);
  });

  it('treats every tile as visible when the map is revealed', () => {
    jest.spyOn(Game, 'getInstance').mockReturnValue({
      getGameOptions: jest.fn().mockReturnValue({ revealMap: true }),
    } as unknown as Game);

    expect(visibility.isVisible(farTile)).toBe(true);
    expect(visibility.hasDiscovered(farTile)).toBe(true);
  });
});
