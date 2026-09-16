import { City } from "../city/City";
import { Unit, UnitAction } from "./Unit";

export class UnitActions {
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

  public createReligion() { }
}
