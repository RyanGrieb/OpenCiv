import { Tile } from '../../src/map/Tile';
import { Unit } from '../../src/unit/Unit';

describe('Tile', () => {
  let tile: Tile;

  beforeEach(() => {
    tile = new Tile('grassland', 0, 0);
  });

  const fakeUnit = (isUtility: boolean) => ({ isUtility: () => isUtility } as unknown as Unit);

  it('has no blocking unit when empty', () => {
    expect(tile.hasBlockingUnit()).toBe(false);
  });

  it('is blocked once a non-utility unit occupies it', () => {
    tile.addUnit(fakeUnit(false));

    expect(tile.hasBlockingUnit()).toBe(true);
  });

  it('is not blocked when the only occupant is a utility unit', () => {
    tile.addUnit(fakeUnit(true));

    expect(tile.hasBlockingUnit()).toBe(false);
  });

  it('stays blocked by a non-utility unit even alongside a utility unit', () => {
    tile.addUnit(fakeUnit(true));
    tile.addUnit(fakeUnit(false));

    expect(tile.hasBlockingUnit()).toBe(true);
  });

  it('excludes the moving unit itself from the blocking check', () => {
    const mover = fakeUnit(false);
    tile.addUnit(mover);

    expect(tile.hasBlockingUnit(mover)).toBe(false);
  });
});
