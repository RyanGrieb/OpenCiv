import { Tile } from "../../src/map/Tile";

// Civ 5 (BNW) tile yields, checked against config/tiles.yml through Tile.getStats().
const yieldsOf = (...tileTypes: string[]) => {
  const tile = new Tile(tileTypes[0], 0, 0);
  tileTypes.slice(1).forEach((type) => tile.addTileType(type));

  const stats: Record<string, number> = Object.assign({}, ...tile.getStats());
  return Object.fromEntries(Object.entries(stats).filter(([, value]) => value !== 0));
};

describe("Tile yields", () => {
  it.each([
    ["grass", { food: 2 }],
    ["plains", { food: 1, production: 1 }],
    ["tundra", { food: 1 }],
    ["desert", {}],
    ["snow", {}],
    ["floodplains", { food: 2 }],
    ["freshwater", { food: 2, gold: 1 }],
    ["shallow_ocean", { food: 1, gold: 1 }],
    ["ocean", { food: 1, gold: 1 }],
    ["mountain", {}]
  ])("%s yields %o", (terrain, expected) => {
    expect(yieldsOf(terrain)).toEqual(expected);
  });

  it.each(["grass_hill", "plains_hill", "desert_hill", "tundra_hill", "snow_hill"])(
    "%s yields 2 production whatever the terrain under it",
    (hill) => {
      expect(yieldsOf(hill)).toEqual({ production: 2 });
    }
  );

  it.each(["grass", "plains", "tundra", "grass_hill", "plains_hill", "tundra_hill"])(
    "forest on %s replaces the terrain with 1 food and 1 production",
    (terrain) => {
      expect(yieldsOf(terrain, "forest")).toEqual({ food: 1, production: 1 });
    }
  );

  it.each(["grass", "grass_hill"])("jungle on %s replaces the terrain with 2 food", (terrain) => {
    expect(yieldsOf(terrain, "jungle")).toEqual({ food: 2 });
  });

  it("adds a resource on top of the feature that replaced the terrain", () => {
    expect(yieldsOf("grass", "forest", "iron")).toEqual({ food: 1, production: 2 });
  });

  it("adds an improvement on top of the feature", () => {
    expect(yieldsOf("grass_hill", "forest", "lumber_mill")).toEqual({ food: 1, production: 2 });
    expect(yieldsOf("grass", "jungle", "trading_post")).toEqual({ food: 2, gold: 1 });
  });

  it("gives the terrain its yields back once the feature is cleared", () => {
    const tile = new Tile("grass_hill", 0, 0);
    tile.addTileType("jungle");
    tile.removeTileType("jungle");

    expect(Object.assign({}, ...tile.getStats())).toMatchObject({ food: 0, production: 2 });
  });

  it.each([
    [["grass", "cattle"], { food: 3 }],
    [["grass", "improved_cattle"], { food: 3, production: 1 }],
    [["grass_hill", "sheep"], { food: 1, production: 2 }],
    [["grass_hill", "improved_sheep"], { food: 1, production: 3 }],
    [["plains", "horses"], { food: 1, production: 2 }],
    [["plains", "improved_horses"], { food: 1, production: 3 }],
    [["shallow_ocean", "fish"], { food: 3, gold: 1 }],
    [["shallow_ocean", "improved_fish"], { food: 4, gold: 1 }],
    [["plains", "wheat"], { food: 2, production: 1 }],
    [["grass", "farm"], { food: 3 }],
    [["grass_hill", "mine"], { production: 3 }]
  ])("%o yields %o", (tileTypes, expected) => {
    expect(yieldsOf(...tileTypes)).toEqual(expected);
  });
});
