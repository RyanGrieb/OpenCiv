import { DevConsole } from "../../src/dev/DevConsole";
import { Tile } from "../../src/map/Tile";
import { GameMap } from "../../src/map/GameMap";
import { Game } from "../../src/Game";
import { Player } from "../../src/Player";
import { City } from "../../src/city/City";
import { ServerEvents } from "../../src/Events";

jest.mock("../../src/Game");
jest.mock("../../src/Events");

describe("DevConsole", () => {
  const player = {
    addUnit: jest.fn(),
    getCities: (): City[] => [],
    getVisibility: () => ({ update: jest.fn(), isVisible: () => true })
  } as unknown as Player;
  let grass: Tile;
  let ocean: Tile;

  beforeEach(() => {
    grass = new Tile("grass", 0, 0);
    ocean = new Tile("ocean", 1, 0);
    const map = Object.create(GameMap.prototype) as GameMap;
    Object.assign(map, { tiles: [[grass], [ocean]], mapWidth: 2, mapHeight: 1 });
    jest.spyOn(GameMap, "getInstance").mockReturnValue(map);
    jest.spyOn(Game, "getInstance").mockReturnValue({ getPlayers: () => new Map() } as unknown as Game);
    jest.spyOn(ServerEvents, "on").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("asks for a tile, then spawns the unit there", () => {
    expect(DevConsole.run(player, "spawn archer").pickTile).toBe("spawn Archer");

    const result = DevConsole.run(player, "spawn Archer", [0, 0]);
    expect(result.pickTile).toBeUndefined();
    expect(grass.getUnits().map((unit) => unit.getName())).toEqual(["Archer"]);
  });

  it("takes unit names with spaces", () => {
    DevConsole.run(player, "spawn work boat", [1, 0]);
    expect(ocean.getUnits().map((unit) => unit.getName())).toEqual(["Work Boat"]);
  });

  it("refuses unknown units, and ground the unit can't stand on", () => {
    expect(DevConsole.run(player, "spawn Dragon").pickTile).toBeUndefined();

    const result = DevConsole.run(player, "spawn Warrior", [1, 0]);
    expect(ocean.getUnits()).toEqual([]);
    expect(result.pickTile).toBe("spawn Warrior");
  });

  it("keeps two military units off one tile", () => {
    DevConsole.run(player, "spawn Warrior", [0, 0]);
    DevConsole.run(player, "spawn Archer", [0, 0]);
    expect(grass.getUnits().map((unit) => unit.getName())).toEqual(["Warrior"]);
  });
});
