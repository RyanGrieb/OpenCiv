import { Game } from "../Game";
import { InGameScene } from "../scene/type/InGameScene";

export class AbstractPlayer {
  private name: string;
  private civData: JSON;

  constructor(playerJSON: JSON) {
    this.civData = playerJSON["civData"];
    this.name = playerJSON["name"];
  }

  public static getPlayerByName(name: string) {
    const players = Game.getInstance().getCurrentSceneAs<InGameScene>().getPlayers();
    for (const player of players) {
      if (player.getName() === name) {
        return player;
      }
    }

    return undefined;
  }

  public getName(): string {
    return this.name;
  }

  public setName(name: string) {
    this.name = name;
  }

  public getCivilizationData() {
    return this.civData;
  }
}
