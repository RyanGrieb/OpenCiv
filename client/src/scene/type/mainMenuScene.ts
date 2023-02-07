import { Scene } from "../scene";
import { Actor } from "../actor";
import { Game } from "../../game";
import { Button } from "../../ui/button";
import { Sprite, SpriteSheet } from "../../assets";

export class MainMenuScene extends Scene {
  public onInitialize(): void {
    console.log("FUCKKKKKKKKKK");

    let tileActors: Actor[] = [];
    //FIXME: Optimize multiple actors
    for (let y = -1; y < Game.getHeight() / 24; y++) {
      for (let x = -1; x < Game.getWidth() / 32; x++) {
        let yPos = y * 24;
        let xPos = x * 32;
        if (y % 2 != 0) {
          xPos += 16;
        }
        tileActors.push(
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

    this.addActor(this.generateSingleActor(tileActors));

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
          Game.setScene("mp_options");
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
        sprite: Sprite.BUILDER,
        x: 32,
        y: 32,
        width: 32,
        height: 32,
      })
    );
    this.addActor(
      new Actor({
        sprite: Sprite.ARCHER,
        x: 64,
        y: 32,
        width: 32,
        height: 32,
      })
    );
  }
}
