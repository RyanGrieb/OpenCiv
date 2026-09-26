import { City } from "../../src/city/City";
import { Combat, CombatModifier } from "../../src/unit/Combat";
import { Unit } from "../../src/unit/Unit";
import { Tile } from "../../src/map/Tile";
import { Player } from "../../src/Player";
import { Game } from "../../src/Game";
import { GameMap } from "../../src/map/GameMap";

jest.mock("../../src/Events");
jest.mock("../../src/Game");
jest.mock("../../src/map/GameMap");

// Units attacking a city. The city is a stand-in: City's own combat numbers are covered in City.test.ts.
describe("Units attacking a city", () => {
  let attackerPlayer: Player;
  let defenderPlayer: Player;
  // A row of tiles, x = 0..3. The enemy city sits on x = 2.
  let row: Tile[];
  let city: City & { captureBy: jest.Mock };
  let cityHealth: number;

  const fakePlayer = (name: string) =>
    ({
      getName: () => name,
      addUnit: jest.fn(),
      removeUnit: jest.fn(),
      sendNetworkEvent: jest.fn(),
      hasResearchedTech: () => false,
      getVisibility: () => ({ isVisible: () => true, update: jest.fn() })
    }) as unknown as Player;

  const makeUnit = (name: string, tile: Tile, player: Player) => {
    const unit = Unit.createFromName(name, tile, player);
    tile.addUnit(unit);
    return unit;
  };

  beforeEach(() => {
    jest.restoreAllMocks();

    attackerPlayer = fakePlayer("Attacker");
    defenderPlayer = fakePlayer("Defender");

    jest.spyOn(Game, "getInstance").mockReturnValue({
      getPlayers: () =>
        new Map([
          ["Attacker", attackerPlayer],
          ["Defender", defenderPlayer]
        ])
    } as any);

    row = [0, 1, 2, 3].map((x) => new Tile("grass", x, 0));
    for (let x = 0; x < row.length - 1; x++) {
      row[x].setAdjacentTile(0, row[x + 1]);
      row[x + 1].setAdjacentTile(3, row[x]);
    }
    jest.spyOn(GameMap, "getInstance").mockReturnValue({
      getTilesInRange: (tile: Tile, range: number) =>
        row.filter((other) => Math.abs(other.getX() - tile.getX()) <= range),
      hasLineOfSight: () => true,
      broadcastTileUpdate: jest.fn()
    } as any);

    cityHealth = 200;
    city = {
      getName: () => "Rome",
      getPlayer: () => defenderPlayer,
      getTile: () => row[2],
      getHealth: () => cityHealth,
      getMaxHealth: () => 200,
      setHealth: (health: number) => (cityHealth = health),
      getBaseStrength: () => 10,
      getCombatStrength: () => 10,
      getDefenseModifiers: (): CombatModifier[] => [],
      captureBy: jest.fn()
    } as unknown as City & { captureBy: jest.Mock };
    (row[2] as any).city = city;
  });

  it("can't walk into or through an enemy city", () => {
    const warrior = makeUnit("Warrior", row[1], attackerPlayer);

    expect(row[2].isImpassableFor(warrior)).toBe(true);
    expect(row[2].isBlockedFor(warrior)).toBe(true);
  });

  it("melee: both sides take damage, and the city holds while it has health left", () => {
    const warrior = makeUnit("Warrior", row[1], attackerPlayer);
    jest.spyOn(Combat, "resolveMelee").mockReturnValue({ attackerHealth: 70, defenderHealth: 150 });

    expect(warrior.canMeleeAttack(row[2])).toBe(true);
    expect(warrior.meleeAttack(row[2])).toBe(true);

    expect(cityHealth).toBe(150);
    expect(warrior.getHealth()).toBe(70);
    expect(warrior.getTile()).toBe(row[1]);
    expect(city.captureBy).not.toHaveBeenCalled();
    expect(defenderPlayer.sendNetworkEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: "unitCombat", defenderCity: "Rome", defenderCityHealth: 150, ranged: false })
    );
  });

  it("melee: the city fights with its own strength, not the tile's terrain, and isn't slowed by wounds", () => {
    const warrior = makeUnit("Warrior", row[1], attackerPlayer);
    cityHealth = 20;
    const resolve = jest.spyOn(Combat, "resolveMelee").mockReturnValue({ attackerHealth: 70, defenderHealth: 5 });

    warrior.meleeAttack(row[2]);

    expect(resolve).toHaveBeenCalledWith(
      expect.objectContaining({ defenderStrength: 10, defenderHealth: 20, defenderIsCity: true })
    );
  });

  it("melee: bringing the city to 0 HP captures it and moves in, destroying the garrison and taking civilians", () => {
    const warrior = makeUnit("Warrior", row[1], attackerPlayer);
    const garrison = makeUnit("Warrior", row[2], defenderPlayer);
    makeUnit("Builder", row[2], defenderPlayer);
    jest.spyOn(Combat, "resolveMelee").mockReturnValue({ attackerHealth: 60, defenderHealth: 0 });

    warrior.meleeAttack(row[2]);

    expect(city.captureBy).toHaveBeenCalledWith(attackerPlayer);
    expect(warrior.getTile()).toBe(row[2]);
    expect(row[2].getUnits()).not.toContain(garrison);
    expect(row[2].getUnits().every((unit) => unit.getPlayer() === attackerPlayer)).toBe(true);
  });

  it("melee: an attacker that dies doesn't take the city, even at 0 HP", () => {
    const warrior = makeUnit("Warrior", row[1], attackerPlayer);
    jest.spyOn(Combat, "resolveMelee").mockReturnValue({ attackerHealth: 0, defenderHealth: 0 });

    warrior.meleeAttack(row[2]);

    expect(city.captureBy).not.toHaveBeenCalled();
    expect(row[1].getUnits()).not.toContain(warrior);
  });

  it("ranged: wears the city down but never below 1 HP, and never captures", () => {
    const archer = makeUnit("Archer", row[0], attackerPlayer);
    cityHealth = 5;

    expect(archer.canRangedAttack(row[2])).toBe(true);
    expect(archer.rangedAttack(row[2])).toBe(true);

    expect(cityHealth).toBe(1);
    expect(archer.getTile()).toBe(row[0]);
    expect(city.captureBy).not.toHaveBeenCalled();
  });

  it("ranged: the preview never shows the city dropping below 1 HP", () => {
    const archer = makeUnit("Archer", row[0], attackerPlayer);
    cityHealth = 5;

    const preview = archer.getRangedPreview(row[2]);

    expect(preview).toMatchObject({ defenderCity: "Rome", defenderHealth: 5, defenderMaxHealth: 200 });
    expect(preview.defenderDamage.max).toBe(4);
  });

  it("doesn't attack its own civilization's city", () => {
    const warrior = makeUnit("Warrior", row[1], defenderPlayer);

    expect(warrior.canMeleeAttack(row[2])).toBe(false);
    expect(row[2].isImpassableFor(warrior)).toBe(false);
  });
});

describe("Combat against cities", () => {
  it("resolveRanged can be floored above 0", () => {
    const result = Combat.resolveRanged({
      attackerStrength: 50,
      attackerHealth: 100,
      defenderStrength: 5,
      defenderHealth: 10,
      minDefenderHealth: 1,
      roll: 1
    });

    expect(result.defenderHealth).toBe(1);
  });

  it("a city's hits back aren't weakened by its missing health", () => {
    const options = {
      attackerStrength: 10,
      attackerHealth: 100,
      defenderStrength: 10,
      defenderHealth: 40,
      attackerRoll: 0,
      defenderRoll: 0
    };

    expect(Combat.resolveMelee({ ...options, defenderIsCity: true }).attackerHealth).toBe(76);
    expect(Combat.resolveMelee(options).attackerHealth).toBe(84);
  });
});
