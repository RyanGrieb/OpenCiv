import { Game } from "../Game";
import { Player } from "../Player";
import { Building } from "./Building";
import { City } from "./City";

export type BuildingCategory = "buildings" | "nationalWonders" | "wonders";

/**
 * The limits on wonders, as in Civ 5. A great wonder exists once in the whole world: every civilization
 * may race for it, but only in one of its cities at a time, and once one city finishes it the others
 * lose it from their queues. A national wonder exists once per civilization.
 */
export class Wonders {
  // Which section of the production list and the city's buildings a building belongs in.
  public static getCategory(building: Building): BuildingCategory {
    if (building.isWonderBuilding()) return "wonders";
    if (building.isNationalWonder()) return "nationalWonders";
    return "buildings";
  }

  public static isWonder(building: Building): boolean {
    return Wonders.getCategory(building) !== "buildings";
  }

  /**
   * Whether `city` may start on the wonder. A great wonder is off once any city in the world has it; any
   * wonder is off once another of the player's cities has it or is building it. Ordinary buildings are
   * always allowed here: the city's own checks cover them.
   */
  public static canStart(building: Building, city: City): boolean {
    if (!Wonders.isWonder(building)) return true;

    const name = building.getName();
    if (building.isWonderBuilding() && Wonders.getAllCities().some((other) => other.hasBuilding(name))) return false;

    return !city
      .getPlayer()
      .getCities()
      .some((other) => other !== city && (other.hasBuilding(name) || other.hasQueued(name)));
  }

  /**
   * Called once `builder` finishes a great wonder. Every other city building it loses it from its queue
   * and gets the production it had put in back as gold, and every civilization hears who built it.
   */
  public static onGreatWonderBuilt(name: string, builder: City) {
    for (const city of Wonders.getAllCities()) {
      if (city === builder) continue;
      city.loseWonderToAnotherCity(name, builder);
    }

    for (const player of Wonders.getPlayers()) {
      if (player === builder.getPlayer()) continue;
      player
        .getNotifications()
        .addMessage("ICON_CULTURE", `${name} has been completed by ${builder.getPlayer().getName()}.`);
    }
  }

  private static getPlayers(): Player[] {
    return Array.from(Game.getInstance().getPlayers().values());
  }

  private static getAllCities(): City[] {
    return Wonders.getPlayers().flatMap((player) => player.getCities());
  }
}
