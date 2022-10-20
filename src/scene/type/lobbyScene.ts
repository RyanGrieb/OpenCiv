import { Scene } from "../scene";
import { Actor } from "../actor";
import { Game } from "../../game";
import { Button } from "../../ui/button";
import { Sprites, Textures } from "../../assets";
export class LobbyScene extends Scene {
  public onInitialize(): void {
    // TODO: onclick callback function...
    this.addActor(
      new Button({
        title: "Singleplayer",
        x: Game.getWidth() / 2 - 142 / 2,
        y: Game.getHeight() / 3,
        width: 142,
        height: 42,
      })
    );

    this.addActor(
      new Actor({
        sprite: Sprites.BUILDER,
        x: 32,
        y: 32,
        width: 32,
        height: 32,
      })
    );
    this.addActor(
      new Actor({
        sprite: Sprites.ARCHER,
        x: 64,
        y: 32,
        width: 32,
        height: 32,
      })
    );
  }
}
