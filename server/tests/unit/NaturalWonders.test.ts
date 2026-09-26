import { NaturalWonders } from "../../src/map/NaturalWonders";
import { PlayerVisibility } from "../../src/map/PlayerVisibility";
import { Tile } from "../../src/map/Tile";
import { Player } from "../../src/Player";
import { MapSizes } from "../../src/GameOptions";

// A rectangle of one terrain with GameMap's odd-r adjacency (odd rows sit half a hex to the right).
const buildGrid = (width: number, height: number, terrain: (x: number, y: number) => string): Tile[][] => {
  const evenEdgeAxis = [
    [-1, -1],
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 1],
    [-1, 0]
  ];
  const oddEdgeAxis = [
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 0]
  ];

  const tiles: Tile[][] = [];
  for (let x = 0; x < width; x++) {
    tiles[x] = [];
    for (let y = 0; y < height; y++) tiles[x][y] = new Tile(terrain(x, y), x, y);
  }

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const edgeAxis = y % 2 === 0 ? evenEdgeAxis : oddEdgeAxis;
      edgeAxis.forEach(([dx, dy], side) => tiles[x][y].setAdjacentTile(side, tiles[x + dx]?.[y + dy] ?? null));
    }
  }

  return tiles;
};

// Hex steps between two tiles, walking adjacency the way the game does.
const hexDistance = (from: Tile, to: Tile): number => {
  const seen = new Set<Tile>([from]);
  let frontier = [from];
  for (let step = 0; frontier.length > 0; step++) {
    if (frontier.includes(to)) return step;
    frontier = frontier
      .flatMap((tile) => tile.getAdjacentTiles())
      .filter((tile) => tile && !seen.has(tile) && seen.add(tile));
  }
  return Infinity;
};

const statsOf = (tile: Tile) => Object.assign({}, ...tile.getStats());

// Every terrain some wonder spawns on, in bands, so every wonder has somewhere to go.
const TERRAIN_BANDS = ["grass", "plains", "desert", "tundra", "shallow_ocean"];
const bandedMap = () => buildGrid(40, 30, (x) => TERRAIN_BANDS[Math.floor(x / 8)]);

describe("NaturalWonders", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("a wonder tile", () => {
    it("can't be entered, like a mountain", () => {
      const tile = new Tile("grass", 0, 0);
      tile.addTileType("mt_fuji");

      expect(tile.getMovementCost()).toBe(9999);
    });

    it("yields the wonder's Civ 5 yields instead of its terrain's", () => {
      const tile = new Tile("grass", 0, 0);
      tile.addTileType("mt_fuji");

      expect(statsOf(tile)).toMatchObject({ food: 0, faith: 3, culture: 2 });
    });

    it("keeps its terrain underneath, so a reef still counts as water", () => {
      const tile = new Tile("shallow_ocean", 0, 0);
      tile.addTileType("great_barrier_reef");

      expect(tile.isWater()).toBe(true);
      expect(statsOf(tile)).toMatchObject({ food: 2, production: 1, gold: 1, science: 2 });
    });

    it("is found by getWonderOn", () => {
      const tile = new Tile("desert", 0, 0);
      tile.addTileType("barringer_crater");

      expect(NaturalWonders.getWonderOn(tile)?.name).toBe("Barringer Crater");
      expect(NaturalWonders.getWonderOn(new Tile("desert", 0, 0))).toBeUndefined();
    });
  });

  describe("generate", () => {
    it("places each wonder at most once, on its own terrain", () => {
      const tiles = bandedMap();
      const placed = NaturalWonders.generate(tiles, NaturalWonders.getAll().length);

      expect(placed).toHaveLength(NaturalWonders.getAll().length);
      const names = placed.map((tile) => NaturalWonders.getWonderOn(tile).name);
      expect(new Set(names).size).toBe(names.length);

      for (const tile of placed) {
        const wonder = NaturalWonders.getWonderOn(tile);
        expect(tile.getTileTypes()).toEqual([expect.any(String), wonder.tile_type]);
        expect(wonder.spawn_tiles).toContain(tile.getTileTypes()[0]);
      }
    });

    it("stops at the count it's given", () => {
      expect(NaturalWonders.generate(bandedMap(), 3)).toHaveLength(3);
    });

    it("keeps wonders apart and off the top and bottom rows", () => {
      const tiles = bandedMap();
      const placed = NaturalWonders.generate(tiles, NaturalWonders.getAll().length);

      for (const tile of placed) {
        expect(tile.getY()).toBeGreaterThanOrEqual(NaturalWonders.MAP_EDGE_BUFFER);
        expect(tile.getY()).toBeLessThan(30 - NaturalWonders.MAP_EDGE_BUFFER);
        for (const other of placed.filter((otherTile) => otherTile !== tile)) {
          expect(hexDistance(tile, other)).toBeGreaterThanOrEqual(NaturalWonders.MIN_WONDER_DISTANCE);
        }
      }
    });

    it("skips wonders with nowhere to go instead of forcing them", () => {
      const tiles = buildGrid(30, 20, () => "grass");
      const placed = NaturalWonders.generate(tiles, NaturalWonders.getAll().length);

      const names = placed.map((tile) => NaturalWonders.getWonderOn(tile).name).sort();
      expect(names).toEqual(["Mt. Fuji", "Mt. Kilimanjaro"]);
    });

    it("never lands on a tile with a feature or resource", () => {
      const tiles = buildGrid(20, 20, () => "grass");
      tiles.flat().forEach((tile) => tile.addTileType("forest"));

      expect(NaturalWonders.generate(tiles, 2)).toHaveLength(0);
    });
  });

  it("places about as many wonders as Civ 5 does for each map size", () => {
    const counts = MapSizes.DIMENSIONS.map(([width, height]) => NaturalWonders.getCountForMapArea(width * height));

    expect(counts).toEqual([3, 3, 4, 5, 6, 7]);
  });

  describe("discovery", () => {
    it("tells the player when they discover a wonder, and not for other tiles", () => {
      const addMessage = jest.fn();
      const player = { getNotifications: () => ({ addMessage }) } as unknown as Player;
      const visibility = new PlayerVisibility(player);
      const wonderTile = new Tile("grass", 0, 0);
      wonderTile.addTileType("mt_kilimanjaro");
      const plainTile = new Tile("grass", 1, 0);

      // update() needs a live map and client, so drive the discovery step it runs for each tile.
      const discover = (tile: Tile) => (visibility as any).onDiscovered(tile);
      discover(plainTile);
      discover(wonderTile);

      expect(addMessage).toHaveBeenCalledTimes(1);
      expect(addMessage).toHaveBeenCalledWith("TILE_MT_KILIMANJARO", "Natural wonder found: Mt. Kilimanjaro");
    });
  });
});
