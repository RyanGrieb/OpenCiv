import { City } from "../../src/city/City";
import { Tile } from "../../src/map/Tile";
import { Player } from "../../src/Player";
import { GameMap } from "../../src/map/GameMap";

jest.mock("../../src/Events");
jest.mock("../../src/Game");
jest.mock("../../src/map/GameMap");

// Civ 5's settling rules, from City.canFoundAt().
describe("Founding a city", () => {
  const settlingPlayer = {} as Player;
  const otherPlayer = {} as Player;
  // A row of grass tiles, x = 0..5, with an existing city on x = 0.
  let row: Tile[];
  let existingCity: City;

  const ownedBy = (player: Player) => ({ getPlayer: () => player }) as unknown as City;

  beforeEach(() => {
    jest.restoreAllMocks();

    row = [0, 1, 2, 3, 4, 5].map((x) => new Tile("grass", x, 0));
    jest.spyOn(GameMap, "getInstance").mockReturnValue({
      getTilesInRange: (tile: Tile, range: number) =>
        row.filter((other) => Math.abs(other.getX() - tile.getX()) <= range),
      broadcastTileUpdate: jest.fn()
    } as any);

    existingCity = ownedBy(otherPlayer);
    row[0].setCity(existingCity);
  });

  it("refuses a tile within two tiles of another city", () => {
    expect(City.canFoundAt(row[1], settlingPlayer)).toBe(false);
    expect(City.canFoundAt(row[2], settlingPlayer)).toBe(false);
  });

  it("allows a tile three tiles from the nearest city", () => {
    expect(City.canFoundAt(row[3], settlingPlayer)).toBe(true);
  });

  it("refuses a tile inside another civilization's borders", () => {
    row[4].setCityTerritoryOf(existingCity);

    expect(City.canFoundAt(row[4], settlingPlayer)).toBe(false);
  });

  it("allows a tile inside the settling civilization's own borders", () => {
    row[4].setCityTerritoryOf(ownedBy(settlingPlayer));

    expect(City.canFoundAt(row[4], settlingPlayer)).toBe(true);
  });

  it("refuses water", () => {
    const ocean = new Tile("ocean", 5, 0);
    row[5] = ocean;

    expect(City.canFoundAt(ocean, settlingPlayer)).toBe(false);
  });
});
