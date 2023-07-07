import { Game } from "../Game";
import { InGameScene } from "../scene/type/InGameScene";

export class AbstractPlayer {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  public static getPlayerByName(name: string) {
    const players = (Game.getCurrentScene() as InGameScene).getPlayers();
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
}
