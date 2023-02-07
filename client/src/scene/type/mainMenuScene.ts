import { Scene } from "../scene";
import { Actor } from "../actor";
import { Game } from "../../game";
import { Button } from "../../ui/button";
import { SpriteRegion, GameImage } from "../../assets";

export class MainMenuScene extends Scene {
  public onInitialize(): void {
    let tileActors: Actor[] = [];
    //FIXME: Optimize multiple actors
    for (let y = -1; y < (Game.getHeight() + 24) / 24; y++) {
      for (let x = -1; x < (Game.getWidth() + 32) / 32; x++) {
        let yPos = y * 24;
        let xPos = x * 32;
        if (y % 2 != 0) {
          xPos += 16;
        }
        tileActors.push(
          new Actor({
            image: Game.getImage(GameImage.SPRITESHEET),
            spriteRegion: SpriteRegion.OCEAN,
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
        x: Game.getWidth() / 2 - 242 / 2,
        y: Game.getHeight() / 3,
        width: 242,
        height: 62,
        fontColor: "white",
        onClicked: () => {
          console.log("singleplayer scene");
        },
      })
    );

    this.addActor(
      new Button({
        title: "Multiplayer",
        x: Game.getWidth() / 2 - 242 / 2,
        y: Game.getHeight() / 3 + 68,
        width: 242,
        height: 62,
        fontColor: "white",
        onClicked: () => {
          Game.setScene("mp_options");
        },
      })
    );

    this.addActor(
      new Button({
        title: "Options",
        x: Game.getWidth() / 2 - 242 / 2,
        y: Game.getHeight() / 3 + 136,
        width: 242,
        height: 62,
        fontColor: "white",
        onClicked: () => {
          console.log("options scene");
        },
      })
    );

    this.addActor(
      new Actor({
        image: Game.getImage(GameImage.SPRITESHEET),
        spriteRegion: SpriteRegion.BUILDER,
        x: 32,
        y: 32,
        width: 32,
        height: 32,
      })
    );
    
    this.addActor(
      new Actor({
        image: Game.getImage(GameImage.SPRITESHEET),
        spriteRegion: SpriteRegion.ARCHER,
        x: 64,
        y: 32,
        width: 32,
        height: 32,
      })
    );
  }
}
