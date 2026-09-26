import { BorderGrowth } from '../../src/city/BorderGrowth';
import { City } from '../../src/city/City';
import { Tile } from '../../src/map/Tile';

describe('BorderGrowth', () => {
  // Real tiles joined by hand: link(a, 0, b) makes b sit on a's edge 0, and a on b's edge 3.
  const link = (a: Tile, edge: number, b: Tile) => {
    a.setAdjacentTile(edge, b);
    b.setAdjacentTile((edge + 3) % 6, a);
  };

  // A straight line of tiles running east from the city center, one tile per ring.
  const makeLine = (length: number, tileType = 'grass') => {
    const tiles = Array.from({ length }, (_, index) => new Tile(tileType, index, 0));
    for (let index = 0; index < length - 1; index++) link(tiles[index], 0, tiles[index + 1]);
    return tiles;
  };

  const ownBy = (tiles: Tile[], city: City) => tiles.forEach((tile) => tile.setCityTerritoryOf(city));

  it("follows Civ 5's culture cost for each new tile", () => {
    expect([0, 1, 2, 3, 4].map((tiles) => BorderGrowth.getCultureCost(tiles))).toEqual([20, 32, 46, 62, 77]);
  });

  it('measures how many rings out each tile sits', () => {
    const line = makeLine(4);

    const rings = BorderGrowth.getRingDistances(line[0], 2);

    expect(rings.get(line[0])).toBe(0);
    expect(rings.get(line[1])).toBe(1);
    expect(rings.get(line[2])).toBe(2);
    expect(rings.has(line[3])).toBe(false);
  });

  it('grows into the nearer of two touching tiles', () => {
    const [center, near] = makeLine(2);
    const [ring1, ring2] = [new Tile('grass', 5, 5), new Tile('grass', 6, 5)];
    link(center, 1, ring1);
    link(ring1, 1, ring2);
    const city = {} as City;
    ownBy([center, ring1], city);

    expect(BorderGrowth.chooseNextTile(center, [center, ring1])).toBe(near);
  });

  it('pulls a resource tile ahead of a plain one in the same ring', () => {
    const center = new Tile('grass', 0, 0);
    const plain = new Tile('grass', 1, 0);
    const cattle = new Tile('grass', 2, 0);
    cattle.addTileType('cattle');
    link(center, 0, plain);
    link(center, 1, cattle);
    ownBy([center], {} as City);

    expect(BorderGrowth.chooseNextTile(center, [center])).toBe(cattle);
  });

  it('prefers land over ocean when nothing else sets them apart', () => {
    const center = new Tile('grass', 0, 0);
    const land = new Tile('desert', 1, 0);
    const ocean = new Tile('ocean', 2, 0);
    link(center, 0, land);
    link(center, 1, ocean);
    ownBy([center], {} as City);

    expect(BorderGrowth.chooseNextTile(center, [center])).toBe(land);
  });

  it("never takes a tile another city owns", () => {
    const [center, taken] = makeLine(2);
    ownBy([center], {} as City);
    taken.setCityTerritoryOf({} as City);

    expect(BorderGrowth.chooseNextTile(center, [center])).toBeUndefined();
  });

  it('only grows into tiles touching the territory', () => {
    const line = makeLine(3);
    ownBy([line[0]], {} as City);

    expect(BorderGrowth.chooseNextTile(line[0], [line[0]])).toBe(line[1]);
  });

  it('stops 5 tiles out from the city', () => {
    const line = makeLine(7);
    const city = {} as City;
    const territory = line.slice(0, 6);
    ownBy(territory, city);

    expect(BorderGrowth.chooseNextTile(line[0], territory)).toBeUndefined();
  });
});
