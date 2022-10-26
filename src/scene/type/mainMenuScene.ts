import { Scene } from "../scene";
import { Actor } from "../actor";
import { Game } from "../../game";
import { Button } from "../../ui/button";
import { Sprites, Textures } from "../../assets";

export class LobbyScene extends Scene {
  public onInitialize(): void {
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
            sprite: Sprites.OCEAN,
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
        title: "Singleplayer",
        x: Game.getWidth() / 2 - 142 / 2,
        y: Game.getHeight() / 3,
        width: 142,
        height: 42,
        onClicked: () => {
          console.log("singleplayer scene");
        },
      })
    );

    this.addActor(
      new Button({
        title: "Multiplayer",
        x: Game.getWidth() / 2 - 142 / 2,
        y: Game.getHeight() / 3 + 50,
        width: 142,
        height: 42,
        onClicked: () => {
          console.log("multiplayer options scene");
        },
      })
    );

    this.addActor(
      new Button({
        title: "Options",
        x: Game.getWidth() / 2 - 142 / 2,
        y: Game.getHeight() / 3 + 100,
        width: 142,
        height: 42,
        onClicked: () => {
          console.log("options scene");
        },
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
