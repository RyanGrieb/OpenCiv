import { City } from "../city/City";
import { Game } from "../Game";
import { Improvement, ImprovementData } from "../map/Improvement";
import { Unit, UnitAction, UnitYMLTypeData } from "./Unit";
import { UnitUpgrades } from "./UnitUpgrades";

export class UnitActions {
  // The actions every unit of this type starts with.
  public static forUnitType(data: UnitYMLTypeData): UnitAction[] {
    const upgrade = data.upgrades_to ? [UnitActions.upgrade()] : [];
    return [...UnitActions.typeActions(data), ...upgrade, UnitActions.skipTurn()];
  }

  // Civ 5's Skip Turn: every unit can be left where it is for a turn, so it stops holding up the next turn.
  public static skipTurn(): UnitAction {
    return {
      name: "skip_turn",
      icon: "ICON_SKIP_TURN",
      requirements: ["movement"],
      desc: "Skip Turn (Space)",
      onAction: (unit: Unit) => unit.skipTurn()
    };
  }

  // Shown once the unit has earned a promotion. The owner's client opens the list of promotions on offer,
  // and sends the pick back as "promoteUnit" (see Unit.promote()).
  public static promote(): UnitAction {
    return {
      name: "promote",
      icon: "ICON_PROMOTE",
      requirements: [],
      desc: "Promote",
      isAvailable: (unit: Unit) => unit.canPromote(),
      onAction: () => {}
    };
  }

  // Civ 5's Upgrade, offered once the owner has the tech for the unit's upgrade (see UnitUpgrades). The
  // button names the new unit and its price, and only works in the owner's territory with gold to pay.
  public static upgrade(): UnitAction {
    return {
      name: "upgrade",
      icon: "ICON_UPGRADE",
      requirements: ["movement"],
      desc: "Upgrade",
      getDesc: (unit: Unit) => {
        const target = UnitUpgrades.getResearchedTarget(unit);
        if (!target) return "Upgrade";
        return `Upgrade to ${target.name} (${UnitUpgrades.getCost(unit.getName(), target)} gold)`;
      },
      isAvailable: (unit: Unit) => UnitUpgrades.canUpgrade(unit),
      onAction: (unit: Unit) => unit.upgrade()
    };
  }

  // old_java's Target action: the server answers with the tiles in range, and the owner's client
  // highlights them until the player left-clicks an enemy to shoot it (or right-clicks to stop aiming).
  public static rangedAttack(): UnitAction {
    return {
      name: "ranged_attack",
      icon: "ICON_TARGET",
      requirements: ["movement"],
      desc: "Ranged Attack (B)",
      onAction: (unit: Unit) => unit.sendRangedTargets({ aiming: true })
    };
  }

  public static settleCity(): UnitAction {
    return {
      name: "settle",
      icon: "ICON_SETTLE",
      requirements: ["awayFromCity", "movement"],
      desc: "Settle City",
      isAvailable: (unit: Unit) => City.canFoundAt(unit.getTile(), unit.getPlayer()),
      onAction: (unit: Unit) => {
        console.log("ACTION: Act on settle city.");

        const tile = unit.getTile();
        const player = unit.getPlayer();
        unit.delete();

        const city = new City({ player: player, tile: tile });
        player.getCities().push(city);

        city.announceCreated();
        // The new borders change what Builders can build, and where every civilization's Settlers can settle.
        Game.getInstance()
          .getPlayers()
          .forEach((everyPlayer) => everyPlayer.getUnits().forEach((playerUnit) => playerUnit.sendActionsToOwner()));
      }
    };
  }

  public static fortifyUntilHealed(): UnitAction {
    return {
      name: "fortify_until_healed",
      icon: "ICON_FORTIFY_HEAL",
      requirements: ["wounded", "notFortified"],
      desc: "Fortify Until Healed",
      onAction: (unit: Unit) => unit.fortifyUntilHealed()
    };
  }

  // One per improvement - the client only shows the ones isAvailable allows on the unit's tile.
  public static buildImprovement(improvement: ImprovementData): UnitAction {
    const verb = improvement.removes_feature ? "" : "Build ";
    const duration = improvement.consumes_unit ? "" : ` (${improvement.build_turns} turns)`;

    return {
      name: `build_${improvement.name.toLowerCase().replace(/ /g, "_")}`,
      icon: improvement.icon ?? "ICON_UNKNOWN",
      requirements: ["movement", "notBuilding"],
      desc: `${verb}${improvement.name}${duration}`,
      isAvailable: (unit: Unit) => Improvement.canBuild(improvement, unit.getTile(), unit.getPlayer()),
      onAction: (unit: Unit) =>
        improvement.consumes_unit ? unit.buildAndDisband(improvement.name) : unit.startBuilding(improvement.name)
    };
  }

  // What this kind of unit can do besides skipping a turn.
  private static typeActions(data: UnitYMLTypeData): UnitAction[] {
    if (data.name === "Settler") return [UnitActions.settleCity()];
    if (data.name === "Builder")
      return Improvement.getBuildableImprovementData("land").map(UnitActions.buildImprovement);
    if (data.name === "Work Boat")
      return Improvement.getBuildableImprovementData("sea").map(UnitActions.buildImprovement);
    if (data.ranged_strength > 0)
      return [UnitActions.promote(), UnitActions.rangedAttack(), UnitActions.fortifyUntilHealed()];
    if (data.combat_strength > 0) return [UnitActions.promote(), UnitActions.fortifyUntilHealed()];
    return [];
  }

  public createReligion() {}
}
