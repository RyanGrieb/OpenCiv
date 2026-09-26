import { MapPresets } from "../../src/map/MapPresets";
import { Tile } from "../../src/map/Tile";

// A plain rectangle of grass with GameMap's odd-r adjacency (odd rows sit half a hex to the right).
const buildGrid = (width: number, height: number): Tile[][] => {
  const evenEdgeAxis = [[-1, -1], [0, -1], [1, 0], [0, 1], [-1, 1], [-1, 0]];
  const oddEdgeAxis = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 0]];

  const tiles: Tile[][] = [];
  for (let x = 0; x < width; x++) {
    tiles[x] = [];
    for (let y = 0; y < height; y++) tiles[x][y] = new Tile("grass", x, y);
  }

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const edgeAxis = y % 2 === 0 ? evenEdgeAxis : oddEdgeAxis;
      edgeAxis.forEach(([dx, dy], side) => tiles[x][y].setAdjacentTile(side, tiles[x + dx]?.[y + dy] ?? null));
    }
  }

  return tiles;
};

const SEA_RESOURCES = ["fish", "crab", "whales", "turtles", "pearls"];

describe("MapPresets", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // The anchor's row parity changes which offsets are neighbors, so both are checked.
  it.each([
    ["an even", 6],
    ["an odd", 7]
  ])("puts every sea resource beside the Settler on %s row", (_parity, anchorY) => {
    const tiles = buildGrid(20, 16);
    const anchor = tiles[9][anchorY];

    MapPresets.stamp(MapPresets.get("coastal_resources"), tiles, anchor);

    const neighborTypes = anchor.getAdjacentTiles().map((tile) => tile.getTileTypes());
    expect(anchor.getTileTypes()).toEqual(["grass"]);
    for (const resource of SEA_RESOURCES) {
      expect(neighborTypes).toContainEqual(["shallow_ocean", resource]);
    }
    expect(neighborTypes).toContainEqual(["grass"]);
  });

  it("returns each Work Boat's tile, one beside every sea resource", () => {
    const tiles = buildGrid(20, 16);
    const stamped = MapPresets.stamp(MapPresets.get("coastal_resources"), tiles, tiles[9][7]);

    const boatTiles = stamped.filter(({ cell }) => cell.unit === "Work Boat").map(({ tile }) => tile);
    expect(boatTiles).toHaveLength(SEA_RESOURCES.length);
    for (const resource of SEA_RESOURCES) {
      const resourceTile = stamped.find(({ tile }) => tile.containsTileType(resource)).tile;
      expect(boatTiles.some((boat) => boat.getAdjacentTiles().includes(resourceTile))).toBe(true);
    }
  });

  it("leaves tiles outside the patch alone", () => {
    const tiles = buildGrid(20, 16);
    MapPresets.stamp(MapPresets.get("coastal_resources"), tiles, tiles[9][7]);

    expect(tiles[0][0].getTileTypes()).toEqual(["grass"]);
    expect(tiles[19][15].getTileTypes()).toEqual(["grass"]);
  });

  it("clears rivers on stamped tiles, on both sides of each edge", () => {
    const tiles = buildGrid(20, 16);
    const anchor = tiles[9][7];
    const outside = tiles[2][2];
    anchor.setRiverSide(0, true, false);
    outside.setRiverSide(2, true, false);

    MapPresets.stamp(MapPresets.get("coastal_resources"), tiles, anchor);

    expect(anchor.getRiverSides().some(Boolean)).toBe(false);
    expect(anchor.getAdjacentTiles()[0].getRiverSides()[3]).toBe(false);
    expect(outside.getRiverSides()[2]).toBe(true);
  });

  it("throws when the patch would run off the map", () => {
    const tiles = buildGrid(20, 16);
    expect(() => MapPresets.stamp(MapPresets.get("coastal_resources"), tiles, tiles[1][1])).toThrow(/runs off the map/);
  });

  it("parses every preset in the config", () => {
    for (const name of MapPresets.getNames()) {
      expect(MapPresets.get(name).radius).toBeGreaterThan(0);
    }
  });

  it("rejects unknown presets and badly drawn ones", () => {
    const legend = { g: ["grass"], S: ["grass"] };

    expect(() => MapPresets.get("no_such_preset")).toThrow(/Unknown map preset/);
    expect(() => MapPresets.parse("test", { legend, rows: ["g g", " g g"] })).toThrow(/no "S"/);
    expect(() => MapPresets.parse("test", { legend, rows: ["g S", " g x"] })).toThrow(/doesn't define/);
    expect(() => MapPresets.parse("test", { legend, rows: ["g S", "g g"] })).toThrow(/should start with a space/);
    expect(() => MapPresets.parse("test", { legend, rows: ["gg S"] })).toThrow(/one space between hexes/);
  });
});
