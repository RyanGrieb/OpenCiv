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

  const fakeUnit = (isUtility: boolean, player: Player) =>
    ({ isUtility: () => isUtility, getPlayer: () => player } as unknown as Unit);

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
});
