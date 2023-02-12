import { Scene } from "../scene";
import { Actor } from "../actor";
import { Game } from "../../game";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { SpriteRegion, GameImage } from "../../assets";
import { TextBox } from "../../ui/textbox";

export class MainMenuScene extends Scene {
  public onInitialize(): void {
    super.onInitialize();

    let tileActors: Actor[] = [];
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
            spriteRegion: Math.random() < 0.1 ? SpriteRegion.GRASS_HILL : SpriteRegion.GRASS,
            x: xPos,
            y: yPos,
            width: 32,
            height: 32,
          })
        );
      }
    }

    // Sparse background with a random unit
    //const spriteRegionNum = Math.floor(Math.random() * 9); // Random sprite region b/w 0-2
    for (let y = -1; y < (Game.getHeight() + 24) / 24; y++) {
      for (let x = -1; x < (Game.getWidth() + 32) / 32; x++) {
        let yPos = y * 24;
        let xPos = x * 32;
        if (y % 2 != 0) {
          xPos += 16;
        }
        if (Math.random() > 0.02) continue;

        tileActors.push(
          new Actor({
            image: Game.getImage(GameImage.SPRITESHEET),
            spriteRegion: Object.values(SpriteRegion)[Math.floor(Math.random() * 9)],
            x: xPos,
            y: yPos,
            width: 32,
            height: 32,
          })
        );
      }
    }

    this.addActor(this.generateSingleActor(tileActors));

    const titleLabel = new Label({
      text: "Open Civilization",
      font: "bold 97px arial",
      fontColor: "white",
      shadowColor: "black",
      lineWidth: 4,
      shadowBlur: 20,
    });
    titleLabel.conformWidth().then(() => {
      titleLabel.setPosition(Game.getWidth() / 2 - titleLabel.getWidth() / 2, 135);
    });

    this.addActor(titleLabel);

    this.addActor(new TextBox({ x: 100, y: 100, width: 300, height: 50 }));

    // TODO: onclick callback function...
    this.addActor(
      new Button({
        text: "Singleplayer",
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
        text: "Multiplayer",
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
        text: "Options",
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
  }
}
