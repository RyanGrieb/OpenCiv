import { City } from "../city/City";
import { Game } from "../Game";
import { Improvement, ImprovementData } from "../map/Improvement";
import { Unit, UnitAction, UnitYMLTypeData } from "./Unit";

export class UnitActions {
  // The actions every unit of this type starts with.
  public static forUnitType(data: UnitYMLTypeData): UnitAction[] {
    if (data.name === "Settler") return [UnitActions.settleCity()];
    if (data.name === "Builder") return Improvement.getBuildableImprovementData().map(UnitActions.buildImprovement);
    if (data.ranged_strength > 0) return [UnitActions.rangedAttack(), UnitActions.fortifyUntilHealed()];
    if (data.combat_strength > 0) return [UnitActions.fortifyUntilHealed()];
    return [];
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

  // One per improvement - the client only shows the ones isAvailable allows on the Builder's tile.
  public static buildImprovement(improvement: ImprovementData): UnitAction {
    const verb = improvement.removes_feature ? "" : "Build ";

    return {
      name: `build_${improvement.name.toLowerCase().replace(/ /g, "_")}`,
      icon: improvement.icon ?? "ICON_UNKNOWN",
      requirements: ["movement", "notBuilding"],
      desc: `${verb}${improvement.name} (${improvement.build_turns} turns)`,
      isAvailable: (unit: Unit) => Improvement.canBuild(improvement, unit.getTile(), unit.getPlayer()),
      onAction: (unit: Unit) => unit.startBuilding(improvement.name)
    };
  }

  public createReligion() {}
}
