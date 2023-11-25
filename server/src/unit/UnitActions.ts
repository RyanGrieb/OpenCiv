import { Game } from "../Game";
import { City } from "../city/City";
import { Unit, UnitAction } from "./Unit";

export class UnitActions {
  public static settleCity(): UnitAction {
    return {
      name: "settle",
      icon: "SETTLE_ICON",
      requirements: ["awayFromCity", "movement"],
      desc: "Settle City",
      onAction: (unit: Unit) => {
        console.log("ACTION: Act on settle city.");

        const tile = unit.getTile();
        const player = unit.getPlayer();
        unit.delete();

        const city = new City({ player: player, tile: tile });
        tile.setCity(city);
        player.getCities().push(city);

        Game.getInstance()
          .getPlayers()
          .forEach((gamePlayer) => {
            gamePlayer.sendNetworkEvent({
              event: "newCity",
              ...city.getJSON()
            });
          });

        // Add palace to city if it's the first city
        if (player.getCities().length < 2) {
          city.addBuilding("palace");
        }
      }
    };
  }

  public createReligion() {}
}
