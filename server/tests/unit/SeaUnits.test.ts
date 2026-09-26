import { Unit } from "../../src/unit/Unit";
import { Tile } from "../../src/map/Tile";
import { GameMap } from "../../src/map/GameMap";
import { Game } from "../../src/Game";
import { Player } from "../../src/Player";
import { City } from "../../src/city/City";
import { ServerEvents } from "../../src/Events";

jest.mock("../../src/Game");
jest.mock("../../src/Events");

// A row of hexes along y = 0 with the given tile types, each next to the one before it.
const buildRow = (tileTypes: string[][]): Tile[] => {
  const tiles = tileTypes.map((types, x) => {
    const tile = new Tile(types[0], x, 0);
    types.slice(1).forEach((type) => tile.addTileType(type));
    return tile;
  });
  tiles.forEach((tile, x) => {
    tile.setAdjacentTile(5, tiles[x - 1] ?? null);
    tile.setAdjacentTile(2, tiles[x + 1] ?? null);
  });
  return tiles;
};

// Enough of GameMap to run the real A* over a single row of tiles.
const mapOf = (tiles: Tile[]): GameMap => {
  const map = Object.create(GameMap.prototype) as GameMap;
  Object.assign(map, { tiles: tiles.map((tile) => [tile]), mapWidth: tiles.length, mapHeight: 1 });
  return map;
};

describe("Sea units", () => {
  const player = {
    addUnit: jest.fn(),
    getVisibility: () => ({ update: jest.fn(), isVisible: () => true })
  } as unknown as Player;
  const rival = { ...player } as unknown as Player;

  beforeEach(() => {
    jest.spyOn(Game, "getInstance").mockReturnValue({ getPlayers: () => new Map() } as unknown as Game);
    jest.spyOn(ServerEvents, "on").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const cityOn = (tile: Tile, owner: Player) => {
    Object.assign(tile, { city: { getPlayer: () => owner } as unknown as City });
    tile.addTileType("city");
  };

  it("keeps a Work Boat on water, but lets it into its owner's coastal city", () => {
    const [land, coast, shallow, ocean] = buildRow([["grass"], ["grass"], ["shallow_ocean"], ["ocean"]]);
    cityOn(coast, player);
    const boat = Unit.createFromName("Work Boat", shallow, player);

    expect(boat.getDomain()).toBe("sea");
    expect(boat.canEnter(ocean)).toBe(true);
    expect(boat.canEnter(coast)).toBe(true);
    expect(boat.canEnter(land)).toBe(false);
    expect(boat.getTileWeight(shallow, land)).toBe(9999);
    expect(boat.getTileWeight(shallow, ocean)).toBe(1);
  });

  it("keeps ships out of another civilization's city and out of inland cities", () => {
    const [inland, , coast, shallow] = buildRow([["grass"], ["grass"], ["grass"], ["shallow_ocean"]]);
    cityOn(coast, rival);
    cityOn(inland, player);
    const boat = Unit.createFromName("Work Boat", shallow, player);

    expect(boat.canEnter(coast)).toBe(false);
    expect(boat.canEnter(inland)).toBe(false);
  });

  it("keeps a coast-only Galley off deep ocean", () => {
    const [shallow, ocean] = buildRow([["shallow_ocean"], ["ocean"]]);
    const galley = Unit.createFromName("Galley", shallow, player);

    expect(galley.canEnter(ocean)).toBe(false);
    expect(galley.getTileWeight(shallow, ocean)).toBe(9999);
  });

  it("keeps land units off water, even a Scout that ignores terrain cost", () => {
    const [land, water] = buildRow([["grass"], ["shallow_ocean"]]);

    expect(Unit.createFromName("Warrior", land, player).getTileWeight(land, water)).toBe(9999);
    expect(Unit.createFromName("Scout", land, player).canEnter(water)).toBe(false);
  });

  it("finds no path for a land unit across water, or for a ship across land", () => {
    const tiles = buildRow([["grass"], ["shallow_ocean"], ["grass"], ["shallow_ocean"], ["shallow_ocean"]]);
    const map = mapOf(tiles);
    const warrior = Unit.createFromName("Warrior", tiles[0], player);
    const boat = Unit.createFromName("Work Boat", tiles[1], player);

    expect(map.constructShortestPath(warrior, tiles[0], tiles[2])).toEqual([]);
    expect(map.constructShortestPath(boat, tiles[1], tiles[4])).toEqual([]);
    expect(map.constructShortestPath(boat, tiles[3], tiles[4])).toEqual([tiles[3], tiles[4]]);
  });

  it("builds Fishing Boats on the spot with a Work Boat, using the boat up", () => {
    const sailor = {
      ...player,
      removeUnit: jest.fn(),
      hasResearchedTech: (tech: string) => tech === "Sailing"
    } as unknown as Player;
    const [fish] = buildRow([["shallow_ocean", "fish"], ["grass"]]);
    const updateWorkedTiles = jest.fn();
    fish.setCityTerritoryOf({ getPlayer: () => sailor, updateWorkedTiles } as unknown as City);
    const broadcastTileUpdate = jest.fn();
    jest.spyOn(GameMap, "getInstance").mockReturnValue({ broadcastTileUpdate } as unknown as GameMap);

    const boat = Unit.createFromName("Work Boat", fish, sailor);
    fish.addUnit(boat);
    const action = boat.getActionByName("build_fishing_boats");
    expect(action.desc).toBe("Build Fishing Boats");
    expect(action.isAvailable(boat)).toBe(true);

    action.onAction(boat);

    expect(fish.getTileTypes()).toEqual(["shallow_ocean", "improved_fish"]);
    expect(fish.getUnits()).toEqual([]);
    expect(sailor.removeUnit).toHaveBeenCalledWith(boat);
    expect(broadcastTileUpdate).toHaveBeenCalledWith(fish);
    expect(updateWorkedTiles).toHaveBeenCalled();
  });

  it("counts a land tile as coastal only when it touches the sea, not a lake", () => {
    const [lakeShore, lake, , coast, sea] = buildRow([
      ["grass"],
      ["freshwater"],
      ["grass"],
      ["grass"],
      ["shallow_ocean"]
    ]);

    expect(coast.isCoastal()).toBe(true);
    expect(lakeShore.isCoastal()).toBe(false);
    expect(sea.isCoastal()).toBe(false);
    expect(lake.isCoastal()).toBe(false);
  });
});
