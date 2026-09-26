import { City } from "../city/City";
import { Unit, UnitAction, UnitYMLTypeData } from "./Unit";

export class UnitActions {
  // The actions every unit of this type starts with.
  public static forUnitType(data: UnitYMLTypeData): UnitAction[] {
    if (data.name === "Settler") return [UnitActions.settleCity()];
    if (data.combat_strength > 0) return [UnitActions.fortifyUntilHealed()];
    return [];
  }

  public static settleCity(): UnitAction {
    return {
      name: "settle",
      icon: "ICON_SETTLE",
      requirements: ["awayFromCity", "movement"],
      desc: "Settle City",
      onAction: (unit: Unit) => {
        console.log("ACTION: Act on settle city.");

        const tile = unit.getTile();
        const player = unit.getPlayer();
        unit.delete();

        const city = new City({ player: player, tile: tile });
        player.getCities().push(city);

        city.announceCreated();
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

  public createReligion() {}
}
