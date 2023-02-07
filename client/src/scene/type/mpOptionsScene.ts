import { Scene } from "../scene";
import { Actor } from "../actor";
import { Game } from "../../game";
import { Button } from "../../ui/button";
import { Sprite, SpriteSheet } from "../../assets";
import { WebsocketClient } from "../../network/client";

export class MPOptionsScene extends Scene {
  public onInitialize(): void {
    WebsocketClient.init();

    //FIXME: Optimize multiple actors
    for (let y = -1; y < Game.getHeight() / 24; y++) {
      for (let x = -1; x < Game.getWidth() / 32; x++) {
        let yPos = y * 24;
        let xPos = x * 32;
        if (y % 2 != 0) {
          xPos += 16;
        }
        this.addActor(
          new Actor({
            sprite: Sprite.OCEAN,
            x: xPos,
            y: yPos,
            width: 32,
            height: 32,
          })
        );
      }
    }

    // TODO: onclick callback function...
    this.addActor(
      new Button({
        title: "Host Game",
        x: Game.getWidth() / 2 - 142 / 2 - 150,
        y: Game.getHeight() / 2 - 42 / 2,
        width: 142,
        height: 42,
        onClicked: () => {
          console.log("singleplayer scene");
        },
      })
    );

    this.addActor(
      new Button({
        title: "Join Game",
        x: Game.getWidth() / 2 - 142 / 2 + 150,
        y: Game.getHeight() / 2 - 42 / 2,
        width: 142,
        height: 42,
        onClicked: () => {},
      })
    );

    this.addActor(
      new Button({
        title: "Back",
        x: Game.getWidth() / 2 - 142 / 2,
        y: Game.getHeight() / 2 - 42 / 2 + 100,
        width: 142,
        height: 42,
        onClicked: () => {
          Game.setScene("main_menu");
        },
      })
    );
  }
}
