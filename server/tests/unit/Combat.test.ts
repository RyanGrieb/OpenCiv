import { Combat } from "../../src/unit/Combat";
import { Unit } from "../../src/unit/Unit";
import { Tile } from "../../src/map/Tile";
import { Player } from "../../src/Player";
import { Game } from "../../src/Game";
import { ServerEvents } from "../../src/Events";

jest.mock("../../src/Events");
jest.mock("../../src/Game");
jest.mock("../../src/map/GameMap");

describe("Combat", () => {
  describe("getDamage", () => {
    it("deals 24-36 between equal-strength units at full health", () => {
      expect(Combat.getDamage({ strength: 10, opponentStrength: 10, health: 100, roll: 0 })).toBe(24);
      expect(Combat.getDamage({ strength: 10, opponentStrength: 10, health: 100, roll: 1 })).toBe(36);
    });

    it("scales damage by the Civ 5 strength ratio in both directions", () => {
      // Twice as strong: ((2 + 3) / 4)^4 = 2.44, (2.44 + 1) / 2 = 1.72
      expect(Combat.getDamage({ strength: 20, opponentStrength: 10, health: 100, roll: 0 })).toBe(41);
      // Half as strong takes the inverse ratio.
      expect(Combat.getDamage({ strength: 10, opponentStrength: 20, health: 100, roll: 0 })).toBe(13);
    });

    it("hits softer while wounded", () => {
      // 40 HP is 60 missing, so the hit is scaled by 1 - 0.3 = 0.7
      expect(Combat.getDamage({ strength: 10, opponentStrength: 10, health: 40, roll: 0 })).toBe(16);
    });

    it("always deals at least 1 damage", () => {
      expect(Combat.getDamage({ strength: 1, opponentStrength: 1000, health: 1, roll: 0 })).toBe(1);
    });
  });

  describe("resolveMelee", () => {
    it("damages both sides", () => {
      const result = Combat.resolveMelee({
        attackerStrength: 10,
        attackerHealth: 100,
        defenderStrength: 10,
        defenderHealth: 100,
        attackerRoll: 1,
        defenderRoll: 0
      });

      expect(result).toEqual({ attackerHealth: 76, defenderHealth: 64 });
    });

    it("never lets both units die - the attacker survives on 1 HP", () => {
      const result = Combat.resolveMelee({
        attackerStrength: 10,
        attackerHealth: 5,
        defenderStrength: 10,
        defenderHealth: 5,
        attackerRoll: 0,
        defenderRoll: 0
      });

      expect(result).toEqual({ attackerHealth: 1, defenderHealth: 0 });
    });
  });

  describe("terrain", () => {
    it("gives no defense bonus on open ground", () => {
      expect(Combat.getTerrainDefenseModifier(new Tile("grass", 0, 0))).toBe(0);
    });

    it("stacks the hill and forest bonuses", () => {
      const hill = new Tile("grass_hill", 0, 0);
      expect(Combat.getTerrainDefenseModifier(hill)).toBe(0.25);

      hill.addTileType("forest");
      expect(Combat.getTerrainDefenseModifier(hill)).toBe(0.5);
      expect(Combat.getDefenseStrength(8, hill)).toBe(12);
    });

    it("penalizes attacking across a river", () => {
      const from = new Tile("grass", 0, 0);
      const to = new Tile("grass", 1, 0);
      from.setAdjacentTile(0, to);

      expect(Combat.getAttackStrength(10, from, to)).toBe(10);

      from.getRiverSides()[0] = true;
      expect(Combat.getAttackStrength(10, from, to)).toBe(8);
    });
  });
});

describe("Unit.meleeAttack", () => {
  let attackerPlayer: Player;
  let defenderPlayer: Player;
  let originTile: Tile;
  let targetTile: Tile;

  const fakePlayer = (name: string) =>
    ({
      getName: () => name,
      addUnit: jest.fn(),
      removeUnit: jest.fn(),
      sendNetworkEvent: jest.fn(),
      getVisibility: () => ({ isVisible: () => true, update: jest.fn() })
    }) as unknown as Player;

  const makeUnit = (
    tile: Tile,
    player: Player,
    options: { strength?: number; utility?: boolean; name?: string } = {}
  ) => {
    const unit = new Unit({
      name: options.name ?? "TestUnit",
      tile,
      player,
      attackType: "melee",
      combatStrength: options.strength ?? 8,
      isUtility: options.utility,
      actions: []
    });
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

    originTile = new Tile("grass", 0, 0);
    targetTile = new Tile("grass", 1, 0);
    originTile.setAdjacentTile(0, targetTile);
    targetTile.setAdjacentTile(3, originTile);
  });

  it("trades damage and spends the attacker when the defender survives", () => {
    const attacker = makeUnit(originTile, attackerPlayer);
    const defender = makeUnit(targetTile, defenderPlayer);
    jest.spyOn(Combat, "resolveMelee").mockReturnValue({ attackerHealth: 70, defenderHealth: 60 });

    expect(attacker.meleeAttack(targetTile)).toBe(true);

    expect(attacker.getHealth()).toBe(70);
    expect(defender.getHealth()).toBe(60);
    expect(attacker.getTile()).toBe(originTile);
    expect(attacker["availableMovement"]).toBe(0);
    expect(defenderPlayer.sendNetworkEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: "unitCombat", attackerHealth: 70, defenderHealth: 60 })
    );
  });

  it("advances onto the tile when the defender dies", () => {
    const attacker = makeUnit(originTile, attackerPlayer);
    const defender = makeUnit(targetTile, defenderPlayer);
    jest.spyOn(Combat, "resolveMelee").mockReturnValue({ attackerHealth: 70, defenderHealth: 0 });

    attacker.meleeAttack(targetTile);

    expect(targetTile.getUnits()).toEqual([attacker]);
    expect(attacker.getTile()).toBe(targetTile);
    expect(defenderPlayer.removeUnit).toHaveBeenCalledWith(defender);
  });

  it("removes the attacker when it loses", () => {
    const attacker = makeUnit(originTile, attackerPlayer);
    makeUnit(targetTile, defenderPlayer);
    jest.spyOn(Combat, "resolveMelee").mockReturnValue({ attackerHealth: 0, defenderHealth: 40 });

    attacker.meleeAttack(targetTile);

    expect(originTile.getUnits()).toEqual([]);
    expect(attackerPlayer.removeUnit).toHaveBeenCalledWith(attacker);
  });

  it("captures a lone Settler as a Builder that cannot move until next turn", () => {
    const attacker = makeUnit(originTile, attackerPlayer);
    const settler = makeUnit(targetTile, defenderPlayer, { strength: 0, utility: true, name: "settler" });

    attacker.meleeAttack(targetTile);

    const captive = targetTile.getUnits().find((unit) => unit !== attacker);
    expect(defenderPlayer.removeUnit).toHaveBeenCalledWith(settler);
    expect(attacker.getTile()).toBe(targetTile);
    expect(captive.getPlayer()).toBe(attackerPlayer);
    expect(captive.asJSON().name).toBe("Builder");
    expect(captive.asJSON().remainingMovement).toBe(0);
  });

  it("previews a fight with its strengths, modifiers and verdict, but not a capture", () => {
    const attacker = makeUnit(originTile, attackerPlayer);
    makeUnit(targetTile, defenderPlayer, { strength: 0, utility: true, name: "settler" });
    expect(attacker.getMeleePreview(targetTile)).toBeUndefined();

    const hillTile = new Tile("grass_hill", 2, 0);
    originTile.setAdjacentTile(1, hillTile);
    makeUnit(hillTile, defenderPlayer, { strength: 8 });

    expect(attacker.getMeleePreview(hillTile)).toMatchObject({
      attackerStrength: 8,
      defenderStrength: 10,
      defenderModifiers: [{ label: "Hill", value: 0.25 }],
      attackerDamage: { expected: 34 },
      defenderDamage: { expected: 26 },
      outcome: "Minor Defeat"
    });
  });

  it("overruns a tile holding only civilians without a fight", () => {
    const attacker = makeUnit(originTile, attackerPlayer);
    makeUnit(targetTile, defenderPlayer, { strength: 0, utility: true });
    const resolve = jest.spyOn(Combat, "resolveMelee");

    attacker.meleeAttack(targetTile);

    expect(resolve).not.toHaveBeenCalled();
    expect(targetTile.getUnits()).toEqual([attacker]);
    expect(attacker.getHealth()).toBe(100);
  });

  it("refuses targets that are not adjacent, friendly, or when out of movement", () => {
    const attacker = makeUnit(originTile, attackerPlayer);
    const farTile = new Tile("grass", 5, 5);
    makeUnit(farTile, defenderPlayer);

    expect(attacker.canMeleeAttack(farTile)).toBe(false);

    makeUnit(targetTile, attackerPlayer, { utility: true });
    expect(attacker.canMeleeAttack(targetTile)).toBe(false);

    makeUnit(targetTile, defenderPlayer);
    expect(attacker.canMeleeAttack(targetTile)).toBe(true);

    attacker["availableMovement"] = 0;
    expect(attacker.canMeleeAttack(targetTile)).toBe(false);
  });

  it("refuses to attack with a unit that has no combat strength", () => {
    const settler = makeUnit(originTile, attackerPlayer, { strength: 0 });
    makeUnit(targetTile, defenderPlayer);

    expect(settler.meleeAttack(targetTile)).toBe(false);
  });

  it("heals 10 HP outside friendly territory, capped at full health", () => {
    const unit = makeUnit(originTile, attackerPlayer);
    unit["health"] = 50;

    unit["heal"]();
    expect(unit.getHealth()).toBe(60);

    unit["health"] = 95;
    unit["heal"]();
    expect(unit.getHealth()).toBe(100);
  });

  it("heals 20 HP in its own territory, 25 in its own city, and 10 in anyone else's", () => {
    const unit = makeUnit(originTile, attackerPlayer);
    const ownCity = { getPlayer: () => attackerPlayer } as any;
    const foreignCity = { getPlayer: () => defenderPlayer } as any;

    originTile.setCityTerritoryOf(foreignCity);
    unit["health"] = 50;
    unit["heal"]();
    expect(unit.getHealth()).toBe(60);

    originTile.setCityTerritoryOf(ownCity);
    unit["health"] = 50;
    unit["heal"]();
    expect(unit.getHealth()).toBe(70);

    originTile["city"] = ownCity;
    unit["health"] = 50;
    unit["heal"]();
    expect(unit.getHealth()).toBe(75);
  });

  describe("Fortify Until Healed", () => {
    // Runs the unit's own "nextTurn" listener, as the server does at the start of each turn.
    const nextTurn = (unit: Unit) => {
      const call = (ServerEvents.on as jest.Mock).mock.calls.find(
        ([options]) => options.eventName === "nextTurn" && options.parentObject === unit
      );
      call[0].callback({});
    };

    it("is the only way a unit heals", () => {
      const unit = makeUnit(originTile, attackerPlayer);
      unit["health"] = 50;

      nextTurn(unit);
      expect(unit.getHealth()).toBe(50);
    });

    it("is refused at full health", () => {
      const unit = makeUnit(originTile, attackerPlayer);
      unit.fortifyUntilHealed();
      expect(unit.isFortified()).toBe(false);
    });

    it("heals each turn and wakes up at full health", () => {
      const unit = makeUnit(originTile, attackerPlayer);
      unit["health"] = 75;
      unit.fortifyUntilHealed();
      expect(unit.isFortified()).toBe(true);
      expect(attackerPlayer.sendNetworkEvent).toHaveBeenCalledWith({
        event: "unitFortified",
        id: unit["id"],
        fortified: true
      });

      nextTurn(unit);
      expect(unit.getHealth()).toBe(85);
      expect(unit.isFortified()).toBe(true);

      nextTurn(unit);
      nextTurn(unit);
      expect(unit.getHealth()).toBe(100);
      expect(unit.isFortified()).toBe(false);
    });

    it("wakes up when it attacks", () => {
      const unit = makeUnit(originTile, attackerPlayer);
      makeUnit(targetTile, defenderPlayer);
      unit["health"] = 90;
      unit.fortifyUntilHealed();

      unit.meleeAttack(targetTile);
      expect(unit.isFortified()).toBe(false);
    });

    it("is offered to units that can fight, and not to Settlers", () => {
      const names = (unit: Unit) => unit.getUnitActionsJSON().map((action) => action.name);
      expect(names(Unit.createFromName("Warrior", originTile, attackerPlayer))).toEqual(["fortify_until_healed"]);
      expect(names(Unit.createFromName("Settler", originTile, attackerPlayer))).toEqual(["settle"]);
    });
  });

  it("reads combat strength from units.yml", () => {
    expect(Unit.createFromName("Warrior", originTile, attackerPlayer).getCombatStrength()).toBe(8);
    expect(Unit.createFromName("Settler", originTile, attackerPlayer).canFight()).toBe(false);
  });
});
