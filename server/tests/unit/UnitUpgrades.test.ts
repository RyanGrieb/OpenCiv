import { Unit } from "../../src/unit/Unit";
import { UnitUpgrades } from "../../src/unit/UnitUpgrades";
import { Tile } from "../../src/map/Tile";
import { Player } from "../../src/Player";
import { Game } from "../../src/Game";
import { GameMap } from "../../src/map/GameMap";
import { City } from "../../src/city/City";

jest.mock("../../src/Events");
jest.mock("../../src/Game");
jest.mock("../../src/map/GameMap");

describe("Upgrade paths in units.yml", () => {
  const units = Unit.getAllUnitData();
  const byName = (name: string) => units.find((unit) => unit.name === name);

  it("only upgrade into units that exist", () => {
    const missing = units.filter((unit) => unit.upgrades_to && !byName(unit.upgrades_to));
    expect(missing.map((unit) => unit.name)).toEqual([]);
  });

  it("make a unit obsolete with the tech that unlocks its upgrade", () => {
    const mismatched = units
      .filter((unit) => unit.upgrades_to || unit.obsolete_tech)
      .filter((unit) => unit.obsolete_tech !== byName(unit.upgrades_to ?? "")?.required_tech)
      .map((unit) => unit.name);
    expect(mismatched).toEqual([]);
  });

  it("follow each line from its first unit to its last", () => {
    const chain = (name: string): string[] => {
      const next = byName(name)?.upgrades_to;
      return next ? [name, ...chain(next)] : [name];
    };

    expect(chain("Warrior")).toEqual([
      "Warrior",
      "Swordsman",
      "Longswordsman",
      "Musketman",
      "Rifleman",
      "Great War Infantry",
      "Infantry",
      "Mechanized Infantry"
    ]);
    expect(chain("Spearman")).toEqual(["Spearman", "Pikeman", "Musketman", "Rifleman", "Great War Infantry", "Infantry", "Mechanized Infantry"]);
    expect(chain("Horseman")).toEqual(["Horseman", "Knight", "Lancer", "Cavalry", "Tank", "Modern Armor"]);
    expect(chain("Chariot Archer")).toEqual(["Chariot Archer", "Knight", "Lancer", "Cavalry", "Tank", "Modern Armor"]);
    expect(chain("Archer")).toEqual(["Archer", "Composite Bowman", "Crossbowman", "Gatling Gun", "Bazooka"]);
    expect(chain("Catapult")).toEqual(["Catapult", "Trebuchet", "Cannon", "Artillery", "Rocket Artillery"]);
    expect(chain("Trireme")).toEqual(["Trireme", "Galleass", "Frigate", "Ironclad", "Destroyer", "Missile Cruiser"]);
    expect(chain("Caravel")).toEqual(["Caravel", "Privateer", "Ironclad", "Destroyer", "Missile Cruiser"]);
    expect(chain("Submarine")).toEqual(["Submarine", "Nuclear Submarine"]);
  });
});

describe("UnitUpgrades", () => {
  let gold: number;
  let researched: Set<string>;
  let player: Player;
  let tile: Tile;

  const fakePlayer = (civName?: string) =>
    ({
      getName: () => "Player",
      getCivilizationName: () => civName,
      addUnit: jest.fn(),
      removeUnit: jest.fn(),
      sendNetworkEvent: jest.fn(),
      hasResearchedTech: (tech: string) => researched.has(tech),
      getTreasury: () => ({ canAfford: (amount: number) => gold >= amount, spend: (amount: number) => (gold -= amount) }),
      getVisibility: () => ({ isVisible: () => true, update: jest.fn() }),
      getNotifications: () => ({ addMessage: jest.fn() }),
      getCities: (): City[] => [],
      isBarbarian: () => false
    }) as unknown as Player;

  beforeEach(() => {
    jest.restoreAllMocks();
    gold = 1000;
    researched = new Set(["Iron Working", "Metallurgy", "Gunpowder"]);
    player = fakePlayer();
    jest.spyOn(Game, "getInstance").mockReturnValue({ getPlayers: () => new Map([["Player", player]]) } as any);
    jest.spyOn(GameMap, "getInstance").mockReturnValue({ getTilesInRange: (at: Tile) => [at] } as any);

    tile = new Tile("grass", 0, 0);
    tile.setCityTerritoryOf({ getPlayer: () => player } as unknown as City);
  });

  const place = (name: string) => {
    const unit = Unit.createFromName(name, tile, player);
    tile.addUnit(unit);
    return unit;
  };

  it("charges Civ 5's 10 gold plus 2 per point of extra production, rounded down to a 5", () => {
    // Warrior 30 -> Swordsman 75: 10 + 45 * 2.
    expect(UnitUpgrades.getCost("Warrior", Unit.getAllUnitData().find((unit) => unit.name === "Swordsman"))).toBe(100);
    // Spearman 56 -> Pikeman 90: 10 + 34 * 2 = 78, rounded down to 75.
    expect(UnitUpgrades.getCost("Spearman", Unit.getAllUnitData().find((unit) => unit.name === "Pikeman"))).toBe(75);
  });

  it("upgrades into the civ's own unique unit when one replaces the target", () => {
    expect(UnitUpgrades.getTarget("Warrior", fakePlayer("Rome"))?.name).toBe("Legion");
    expect(UnitUpgrades.getTarget("Warrior", fakePlayer("England"))?.name).toBe("Swordsman");
    expect(UnitUpgrades.getTarget("Legion", fakePlayer("Rome"))?.name).toBe("Longswordsman");
  });

  it("turns the unit into its upgrade, keeping its health, experience and promotions", () => {
    const warrior = place("Warrior");
    warrior.setHealth(60);
    warrior.gainExperience(15);
    warrior.promote("Shock I");

    expect(warrior.getUnitActionsJSON().find((action) => action.name === "upgrade")).toMatchObject({
      desc: "Upgrade to Swordsman (100 gold)",
      available: true
    });
    warrior.upgrade();

    const [swordsman] = tile.getUnits();
    expect(tile.getUnits()).toHaveLength(1);
    expect(swordsman.getName()).toBe("Swordsman");
    expect(swordsman.getHealth()).toBe(60);
    expect(swordsman.getPromotions().getExperience()).toBe(15);
    expect(swordsman.getPromotions().has("Shock I")).toBe(true);
    expect(swordsman.getAvailableMovement()).toBe(0);
    expect(gold).toBe(900);
  });

  it("adds the new unit's free promotions, like a Lancer's Formation I", () => {
    const knight = place("Knight");
    knight.grantPromotion("Drill I");
    knight.upgrade();

    const lancer = tile.getUnits()[0];
    expect(lancer.getName()).toBe("Lancer");
    expect(lancer.getPromotions().getPromotions()).toEqual(["Drill I", "Formation I"]);
  });

  it("needs the upgrade's tech, the owner's territory, the gold and movement left", () => {
    const warrior = place("Warrior");
    expect(UnitUpgrades.canUpgrade(warrior)).toBe(true);

    researched.clear();
    expect(UnitUpgrades.canUpgrade(warrior)).toBe(false);
    researched.add("Iron Working");

    gold = 99;
    expect(UnitUpgrades.canUpgrade(warrior)).toBe(false);
    gold = 100;

    tile.setCityTerritoryOf({ getPlayer: () => fakePlayer() } as unknown as City);
    expect(UnitUpgrades.canUpgrade(warrior)).toBe(false);
    warrior.upgrade();
    expect(tile.getUnits()[0]).toBe(warrior);
  });

  it("isn't offered to units with nowhere to go", () => {
    expect(place("Scout").getActionByName("upgrade")).toBeUndefined();
    expect(place("Mechanized Infantry").getActionByName("upgrade")).toBeUndefined();
  });
});
