import { GameMap } from "../../src/map/GameMap";
import { Tile } from "../../src/map/Tile";

jest.mock("../../src/map/Tile");

const MAP_WIDTH = 4;
const MAP_HEIGHT = 4;

// Index into GameMap's edge-axis tables; both the even and odd row variants agree on these two.
const WEST = 5;
const EAST = 2;

describe("Map wrapping", () => {
  let gameMap: GameMap;

  const setWrapping = (enabled: boolean) => {
    GameMap["horizontalWrap"] = enabled;
    GameMap["wrapWidth"] = enabled ? MAP_WIDTH : 0;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (Tile as jest.MockedClass<typeof Tile>).mockImplementation((tileType: string, x: number, y: number) => {
      const tile = {
        adjacentTiles: new Array(6).fill(null),
        getX: () => x,
        getY: () => y,
        getAdjacentTiles: function () {
          return this.adjacentTiles;
        },
        setAdjacentTile: function (index: number, adjacentTile: Tile | null) {
          this.adjacentTiles[index] = adjacentTile;
        }
      };
      return tile as any;
    });

    GameMap["instance"] = undefined;
    gameMap = new (GameMap as any)();
    gameMap["mapWidth"] = MAP_WIDTH;
    gameMap["mapHeight"] = MAP_HEIGHT;
    gameMap["tiles"] = [];

    for (let x = 0; x < MAP_WIDTH; x++) {
      gameMap["tiles"][x] = [];
      for (let y = 0; y < MAP_HEIGHT; y++) {
        gameMap["tiles"][x][y] = new Tile("ocean", x, y);
      }
    }
  });

  afterEach(() => {
    GameMap.destroyInstance();
    gameMap = null;
    jest.restoreAllMocks();
  });

  describe("wrapX", () => {
    it("folds coordinates past either edge back onto the map", () => {
      setWrapping(true);

      expect(GameMap.wrapX(-1)).toBe(MAP_WIDTH - 1);
      expect(GameMap.wrapX(MAP_WIDTH)).toBe(0);
      expect(GameMap.wrapX(MAP_WIDTH + 1)).toBe(1);
      expect(GameMap.wrapX(2)).toBe(2);
    });

    it("leaves coordinates out of bounds when wrapping is off, so callers still reject them", () => {
      setWrapping(false);

      expect(GameMap.wrapX(-1)).toBe(-1);
      expect(GameMap.wrapX(MAP_WIDTH)).toBe(MAP_WIDTH);
    });
  });

  describe("shortestXDistance", () => {
    it("goes around the seam when that is the shorter way", () => {
      setWrapping(true);

      // Opposite edges of a 4-wide map are one step apart, not three.
      expect(GameMap.shortestXDistance(0, MAP_WIDTH - 1)).toBe(-1);
      expect(GameMap.shortestXDistance(MAP_WIDTH - 1, 0)).toBe(1);
      expect(GameMap.shortestXDistance(0, 1)).toBe(1);
    });

    it("measures straight across when wrapping is off", () => {
      setWrapping(false);

      expect(GameMap.shortestXDistance(0, MAP_WIDTH - 1)).toBe(MAP_WIDTH - 1);
      expect(GameMap.shortestXDistance(MAP_WIDTH - 1, 0)).toBe(-(MAP_WIDTH - 1));
    });
  });

  describe("initAdjacentTiles", () => {
    it("joins the east and west edges when wrapping is on", () => {
      setWrapping(true);
      gameMap["initAdjacentTiles"]();

      for (let y = 0; y < MAP_HEIGHT; y++) {
        expect(gameMap["tiles"][0][y].getAdjacentTiles()[WEST]).toBe(gameMap["tiles"][MAP_WIDTH - 1][y]);
        expect(gameMap["tiles"][MAP_WIDTH - 1][y].getAdjacentTiles()[EAST]).toBe(gameMap["tiles"][0][y]);
      }
    });

    it("leaves the east and west edges open when wrapping is off", () => {
      setWrapping(false);
      gameMap["initAdjacentTiles"]();

      for (let y = 0; y < MAP_HEIGHT; y++) {
        expect(gameMap["tiles"][0][y].getAdjacentTiles()[WEST]).toBeNull();
        expect(gameMap["tiles"][MAP_WIDTH - 1][y].getAdjacentTiles()[EAST]).toBeNull();
      }
    });

    it("keeps the north and south edges closed, since only x wraps", () => {
      setWrapping(true);
      gameMap["initAdjacentTiles"]();

      for (let x = 0; x < MAP_WIDTH; x++) {
        // Nothing off the top row loops round to the bottom one, or the other way about.
        const fromTop = gameMap["tiles"][x][0].getAdjacentTiles().filter((tile) => tile?.getY() === MAP_HEIGHT - 1);
        const fromBottom = gameMap["tiles"][x][MAP_HEIGHT - 1].getAdjacentTiles().filter((tile) => tile?.getY() === 0);

        expect(fromTop).toHaveLength(0);
        expect(fromBottom).toHaveLength(0);
      }
    });

    it("gives every tile six neighbours away from the poles when wrapping is on", () => {
      setWrapping(true);
      gameMap["initAdjacentTiles"]();

      for (let x = 0; x < MAP_WIDTH; x++) {
        for (let y = 1; y < MAP_HEIGHT - 1; y++) {
          const neighbours = gameMap["tiles"][x][y].getAdjacentTiles().filter((tile) => tile !== null);
          expect(neighbours).toHaveLength(6);
        }
      }
    });
  });
});
