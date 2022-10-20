import { Scene } from "../scene";
import { Actor } from "../actor";
import { Game } from "../../game";
export class LobbyScene extends Scene {
  public onInitialize(): void {
    this.addActor(
      new Actor({
        image: Game.getImages()[0],
        x: 0,
        y: Game.getHeight() - 32,
        width: 32,
        height: 32,
      })
    );

    this.addActor(
        new Actor({
          image: Game.getImages()[1],
          x: 32,
          y: Game.getHeight() - 32,
          width: 32,
          height: 32,
        })
      );
  }
}
