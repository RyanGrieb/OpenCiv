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

  // A center with one ring-1 neighbor per tile given, each on its own edge.
  const ringOf = (...tiles: Tile[]) => {
    const center = new Tile('grass', 0, 0);
    tiles.forEach((tile, edge) => link(center, edge, tile));
    ownBy([center], {} as City);
    return center;
  };

  const withResource = (resource: string, base = 'grass') => {
    const tile = new Tile(base, 1, 1);
    tile.addTileType(resource);
    return tile;
  };

  it("claims tiles in the wiki's order: luxury, strategic, bonus, next to a resource, then river or lake", () => {
    const lake = new Tile('freshwater', 1, 0);
    const nextToResource = new Tile('grass', 2, 0);
    // Owned by a neighbor, so it pulls nextToResource forward without being claimable itself.
    const neighborsCattle = withResource('cattle');
    neighborsCattle.setCityTerritoryOf({} as City);
    link(nextToResource, 1, neighborsCattle);
    const bonus = withResource('cattle');
    const strategic = withResource('iron');
    const luxury = withResource('cotton');
    const order = [luxury, strategic, bonus, nextToResource, lake, new Tile('grass', 3, 0)];
    const territory = [ringOf(...[...order].reverse())];

    const claimed: Tile[] = [];
    for (const _ of order) {
      const next = BorderGrowth.chooseNextTile(territory[0], territory);
      next.setCityTerritoryOf({} as City);
      territory.push(next);
      claimed.push(next);
    }

    expect(claimed.map((tile) => order.indexOf(tile))).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('reaches a ring further out for a resource, but not two rings', () => {
    const [center, plain, farCotton] = [new Tile('grass', 0, 0), new Tile('grass', 1, 0), withResource('cotton')];
    link(center, 0, plain);
    link(plain, 0, farCotton);
    ownBy([center, plain], {} as City);
    const [ring2Plain, ring3Cotton] = [new Tile('grass', 5, 5), withResource('cotton')];
    link(plain, 1, ring2Plain);

    expect(BorderGrowth.getInfluenceCost(farCotton, 2)).toBeLessThan(BorderGrowth.getInfluenceCost(ring2Plain, 1));
    expect(BorderGrowth.getInfluenceCost(ring3Cotton, 4)).toBeGreaterThan(BorderGrowth.getInfluenceCost(ring2Plain, 1));
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
