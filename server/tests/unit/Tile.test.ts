import { Tile } from '../../src/map/Tile';
import { Unit } from '../../src/unit/Unit';
import { Player } from '../../src/Player';

describe('Tile', () => {
  let tile: Tile;
  let playerA: Player;
  let playerB: Player;

  beforeEach(() => {
    tile = new Tile('grassland', 0, 0);
    playerA = {} as Player;
    playerB = {} as Player;
  });

  const fakeUnit = (isUtility: boolean, player: Player, ignoresTerrainCost = false) =>
    ({
      isUtility: () => isUtility,
      getPlayer: () => player,
      ignoresTerrainCost: () => ignoresTerrainCost,
    } as unknown as Unit);

  it('has no blocking unit when the tile is empty', () => {
    const mover = fakeUnit(false, playerA);

    expect(tile.hasBlockingUnit(mover)).toBe(false);
  });

  it('excludes the moving unit itself from the blocking check', () => {
    const mover = fakeUnit(false, playerA);
    tile.addUnit(mover);

    expect(tile.hasBlockingUnit(mover)).toBe(false);
  });

  it('blocks a same-type ally unit (two non-utility units)', () => {
    tile.addUnit(fakeUnit(false, playerA));

    expect(tile.hasBlockingUnit(fakeUnit(false, playerA))).toBe(true);
  });

  it('blocks a same-type ally unit (two utility units)', () => {
    tile.addUnit(fakeUnit(true, playerA));

    expect(tile.hasBlockingUnit(fakeUnit(true, playerA))).toBe(true);
  });

  it('allows a different-type ally unit to share the tile', () => {
    tile.addUnit(fakeUnit(true, playerA));

    expect(tile.hasBlockingUnit(fakeUnit(false, playerA))).toBe(false);
  });

  it('blocks any enemy unit regardless of utility type', () => {
    tile.addUnit(fakeUnit(true, playerB));

    expect(tile.hasBlockingUnit(fakeUnit(false, playerA))).toBe(true);
  });

  it('lets a same-type ally be passed through, but not an enemy', () => {
    tile.addUnit(fakeUnit(false, playerA));
    expect(tile.hasImpassableUnit(fakeUnit(false, playerA))).toBe(false);

    tile.addUnit(fakeUnit(true, playerB));
    expect(tile.hasImpassableUnit(fakeUnit(false, playerA))).toBe(true);
  });

  it('only places a new unit where it could stack', () => {
    tile.addUnit(fakeUnit(false, playerA));

    expect(tile.canPlaceUnit(playerA, false)).toBe(false);
    expect(tile.canPlaceUnit(playerA, true)).toBe(true);
    expect(tile.canPlaceUnit(playerB, true)).toBe(false);
  });

  describe('getWeight', () => {
    let hill: Tile;
    let riverNeighbor: Tile;

    beforeEach(() => {
      hill = new Tile('hill', 1, 0);

      riverNeighbor = new Tile('grassland', 0, 1);
      // Wire tile <-> riverNeighbor as adjacent, with a river on the connecting side.
      tile['adjacentTiles'][0] = riverNeighbor;
      tile['riverSides'][0] = true;
    });

    it('costs the plain terrain movement cost by default', () => {
      expect(Tile.getWeight(tile, hill)).toBe(2);
    });

    it('floors river crossings to at least 2 by default', () => {
      expect(Tile.getWeight(tile, riverNeighbor)).toBe(2);
    });

    it('flattens hill cost to 1 for a unit that ignores terrain', () => {
      const scout = fakeUnit(false, playerA, true);

      expect(Tile.getWeight(tile, hill, scout)).toBe(1);
    });

    it('flattens river-crossing cost to 1 for a unit that ignores terrain', () => {
      const scout = fakeUnit(false, playerA, true);

      expect(Tile.getWeight(tile, riverNeighbor, scout)).toBe(1);
    });

    it('still treats mountains as impassable for a unit that ignores terrain', () => {
      const mountain = new Tile('mountain', 1, 1);
      const scout = fakeUnit(false, playerA, true);

      expect(Tile.getWeight(tile, mountain, scout)).toBe(9999);
    });
  });
});
