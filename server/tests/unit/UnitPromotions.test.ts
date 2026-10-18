import { Combat } from "../../src/unit/Combat";
import { Unit } from "../../src/unit/Unit";
import { UnitPromotions } from "../../src/unit/UnitPromotions";
import { Tile } from "../../src/map/Tile";
import { Player } from "../../src/Player";
import { Game } from "../../src/Game";
import { GameMap } from "../../src/map/GameMap";
import { BuildingEffects } from "../../src/city/BuildingEffects";
import { City } from "../../src/city/City";
import { Building } from "../../src/city/Building";

jest.mock("../../src/Events");
jest.mock("../../src/Game");
jest.mock("../../src/map/GameMap");

describe("UnitPromotions", () => {
  it("needs 10, 30, 60, 100 experience for each level in turn, as in Civ 5", () => {
    expect([1, 2, 3, 4].map(UnitPromotions.getExperienceNeeded)).toEqual([10, 30, 60, 100]);
  });

  it("names each promotion's icon after it", () => {
    expect(UnitPromotions.getIcon("Shock I")).toBe("PROMOTION_SHOCK_I");
    expect(UnitPromotions.getIcon("Range (Air)")).toBe("PROMOTION_RANGE_AIR");
  });

  it("offers a class only its own promotions, and only once their prerequisites are taken", () => {
    const melee = new UnitPromotions("melee");
    melee.addExperience(10);
    const names = () => melee.getChoices({ wounded: false }).map((promotion) => promotion.name);

    expect(names()).toEqual(expect.arrayContaining(["Shock I", "Drill I", "Cover I"]));
    expect(names()).not.toContain("Shock II");
    expect(names()).not.toContain("Accuracy I");
    expect(names()).not.toContain("Heal Instantly");

    melee.choose("Shock I", { wounded: false });
    melee.addExperience(20);
    expect(names()).toEqual(expect.arrayContaining(["Shock II", "Amphibious", "Medic"]));
    expect(names()).not.toContain("Shock I");
  });

  it("swaps prerequisites for the classes requires_by_class names", () => {
    const helicopter = new UnitPromotions("helicopter");
    helicopter.addExperience(10);
    expect(helicopter.getChoices({ wounded: false }).map((promotion) => promotion.name)).toContain("Ambush I");
  });

  it("only offers anything once enough experience is earned, and spends a level on each pick", () => {
    const promotions = new UnitPromotions("melee");
    promotions.addExperience(9);
    expect(promotions.canPromote()).toBe(false);
    expect(promotions.choose("Shock I", { wounded: false })).toBeUndefined();

    expect(promotions.addExperience(1)).toBe(true);
    expect(promotions.choose("Shock I", { wounded: false })?.name).toBe("Shock I");
    expect(promotions.getLevel()).toBe(2);
    expect(promotions.getExperienceNeeded()).toBe(30);
    expect(promotions.canPromote()).toBe(false);
  });

  it("stops teaching from barbarian fights at 30 experience", () => {
    const promotions = new UnitPromotions("melee");
    promotions.addExperience(28, { fromBarbarian: true });
    promotions.addExperience(5, { fromBarbarian: true });
    expect(promotions.getExperience()).toBe(30);

    promotions.addExperience(5);
    expect(promotions.getExperience()).toBe(35);
  });

  it("offers Heal Instantly only to a wounded unit, and doesn't keep it", () => {
    const promotions = new UnitPromotions("ranged");
    promotions.addExperience(10);

    expect(promotions.choose("Heal Instantly", { wounded: true })?.effects?.heal_instantly).toBe(50);
    expect(promotions.getPromotions()).toEqual([]);
    expect(promotions.getLevel()).toBe(2);
  });

  describe("combat modifiers", () => {
    const grass = new Tile("grass", 0, 0);
    const hill = new Tile("grass_hill", 0, 0);

    it("gives Shock in open terrain and Drill in rough terrain, on either side of the fight", () => {
      const promotions = new UnitPromotions("melee");
      promotions.grant("Shock I");
      promotions.grant("Drill I");

      expect(promotions.getCombatModifiers({ attacking: true, ranged: false, tile: grass })).toEqual([
        { label: "Shock I", value: 0.15 }
      ]);
      expect(promotions.getCombatModifiers({ attacking: false, ranged: false, tile: hill })).toEqual([
        { label: "Drill I", value: 0.15 }
      ]);
    });

    it("gives Cover only against ranged attacks, and Siege only against cities", () => {
      const promotions = new UnitPromotions("melee");
      promotions.grant("Cover I");
      promotions.grant("Siege");

      expect(promotions.getCombatModifiers({ attacking: false, ranged: false, tile: hill })).toEqual([]);
      expect(promotions.getCombatModifiers({ attacking: false, ranged: true, tile: hill })).toEqual([
        { label: "Cover I", value: 0.25 }
      ]);
      expect(promotions.getCombatModifiers({ attacking: true, ranged: false, tile: hill })).toEqual([
        { label: "Siege", value: 0.5 }
      ]);
    });
  });
});

describe("Unit experience and promotions", () => {
  let attackerPlayer: Player;
  let defenderPlayer: Player;
  let originTile: Tile;
  let targetTile: Tile;

  const fakePlayer = (name: string, options: { barbarian?: boolean } = {}) =>
    ({
      getName: () => name,
      addUnit: jest.fn(),
      removeUnit: jest.fn(),
      sendNetworkEvent: jest.fn(),
      hasResearchedTech: () => false,
      getCivilizationName: (): string | undefined => undefined,
      getVisibility: () => ({ isVisible: () => true, update: jest.fn() }),
      getHappiness: () => ({ getCombatModifiers: (): unknown[] => [] }),
      getNotifications: () => ({ addMessage: jest.fn() }),
      getCities: (): City[] => [],
      isBarbarian: () => options.barbarian ?? false,
      getDiplomacy: () => ({ isAtWarWith: () => true })
    }) as unknown as Player;

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
    jest.spyOn(GameMap, "getInstance").mockReturnValue({
      getTilesInRange: (tile: Tile) => [tile, tile === originTile ? targetTile : originTile],
      hasLineOfSight: () => true
    } as any);
  });

  const place = (name: string, tile: Tile, player: Player) => {
    const unit = Unit.createFromName(name, tile, player);
    tile.addUnit(unit);
    return unit;
  };

  it("earns 5 experience for attacking in melee, and the defender 4", () => {
    const attacker = place("Warrior", originTile, attackerPlayer);
    const defender = place("Warrior", targetTile, defenderPlayer);
    jest.spyOn(Combat, "resolveMelee").mockReturnValue({ attackerHealth: 80, defenderHealth: 70 });

    attacker.meleeAttack(targetTile);

    expect(attacker.getPromotions().getExperience()).toBe(5);
    expect(defender.getPromotions().getExperience()).toBe(4);
    expect(attackerPlayer.sendNetworkEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: "unitPromotions", id: attacker.getId(), experience: 5, experienceNeeded: 10 })
    );
  });

  it("earns 2 experience for a ranged attack, and so does its target", () => {
    const archer = place("Archer", originTile, attackerPlayer);
    const defender = place("Warrior", targetTile, defenderPlayer);
    jest.spyOn(Combat, "resolveRanged").mockReturnValue({ attackerHealth: 100, defenderHealth: 70 });

    archer.rangedAttack(targetTile);

    expect(archer.getPromotions().getExperience()).toBe(2);
    expect(defender.getPromotions().getExperience()).toBe(2);
  });

  it("offers the Promote action once a level is earned, and applies the pick", () => {
    const warrior = place("Warrior", originTile, attackerPlayer);
    const promoteAvailable = () =>
      warrior.getUnitActionsJSON().find((action) => action.name === "promote")?.available;
    expect(promoteAvailable()).toBe(false);

    warrior.gainExperience(10);
    expect(promoteAvailable()).toBe(true);

    warrior.promote("Shock I");
    expect(warrior.getPromotions().has("Shock I")).toBe(true);
    expect(promoteAvailable()).toBe(false);
  });

  it("puts promotions into the attack screen's modifiers", () => {
    const attacker = place("Warrior", originTile, attackerPlayer);
    place("Warrior", targetTile, defenderPlayer);
    attacker.getPromotions().grant("Shock I");

    const preview = attacker.getMeleePreview(targetTile);
    expect(preview.attackerModifiers).toContainEqual({ label: "Shock I", value: 0.15 });
    expect(preview.attackerStrength).toBeCloseTo(8 * 1.15);
  });

  it("heals 50 HP with Heal Instantly", () => {
    const warrior = place("Warrior", originTile, attackerPlayer);
    warrior.setHealth(30);
    warrior.gainExperience(10);

    warrior.promote("Heal Instantly");
    expect(warrior.getHealth()).toBe(80);
  });

  it("gives Mobility's extra move right away and every turn after", () => {
    const horseman = place("Horseman", originTile, attackerPlayer);
    ["Shock I", "Shock II", "Shock III"].forEach((name) => horseman.getPromotions().grant(name));
    horseman.gainExperience(10);

    horseman.promote("Mobility");
    expect(horseman.getMaxMovement()).toBe(4);
    expect(horseman.getAvailableMovement()).toBe(4);
  });

  it("lets Blitz attack twice in a turn", () => {
    const attacker = place("Warrior", originTile, attackerPlayer);
    place("Warrior", targetTile, defenderPlayer);
    attacker.getPromotions().grant("Blitz");
    jest.spyOn(Combat, "resolveMelee").mockReturnValue({ attackerHealth: 90, defenderHealth: 80 });

    expect(attacker.meleeAttack(targetTile)).toBe(true);
    expect(attacker.getAvailableMovement()).toBe(1);
    expect(attacker.meleeAttack(targetTile)).toBe(true);
    expect(attacker.getAvailableMovement()).toBe(0);
  });

  it("adds Range to a ranged unit's reach", () => {
    const archer = place("Archer", originTile, attackerPlayer);
    archer.getPromotions().grant("Range");
    expect(archer.getRange()).toBe(3);
  });

  it("starts a Lancer with Formation I and Artillery with Indirect Fire", () => {
    expect(place("Lancer", originTile, attackerPlayer).getPromotions().has("Formation I")).toBe(true);
    expect(place("Artillery", targetTile, attackerPlayer).getPromotions().has("Indirect Fire")).toBe(true);
  });

  it("halves forest movement with Woodsman", () => {
    const forest = new Tile("grass", 1, 0);
    forest.addTileType("forest");
    originTile.setAdjacentTile(0, forest);
    const warrior = place("Warrior", originTile, attackerPlayer);
    const cost = () => warrior.getTileWeight(originTile, forest);

    expect(cost()).toBe(2);
    warrior.getPromotions().grant("Woodsman");
    expect(cost()).toBe(1);
  });

  it("heals a March unit every turn even after acting, and Medics heal their neighbours more", () => {
    const warrior = place("Warrior", originTile, attackerPlayer);
    warrior.setHealth(50);
    warrior.getPromotions().grant("March");
    warrior["actedThisTurn"] = true;

    expect(warrior["healsThisTurn"]()).toBe(true);

    const medic = place("Spearman", targetTile, attackerPlayer);
    medic.getPromotions().grant("Medic");
    warrior["heal"]();
    expect(warrior.getHealth()).toBe(50 + Combat.HEAL_ELSEWHERE + 5);
  });

  it("gives land units trained in a city with Barracks 15 experience", () => {
    const barracks = Building.createFromName("Barracks");
    const city = { getBuildings: () => [barracks] } as unknown as City;
    const warrior = place("Warrior", originTile, attackerPlayer);

    BuildingEffects.applyToTrainedUnit(city, warrior);
    expect(warrior.getPromotions().getExperience()).toBe(15);
    expect(warrior.canPromote()).toBe(true);
  });

  it("gives land units trained in the Alhambra's city Drill I", () => {
    const alhambra = Building.createFromName("Alhambra");
    const city = { getBuildings: () => [alhambra] } as unknown as City;
    const warrior = place("Warrior", originTile, attackerPlayer);

    BuildingEffects.applyToTrainedUnit(city, warrior);
    expect(warrior.getPromotions().has("Drill I")).toBe(true);
  });
});
