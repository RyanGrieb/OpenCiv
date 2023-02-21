import { Scene } from "../scene";
import { Game } from "../../game";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { SceneBackground } from "../sceneBackground";
export class MainMenuScene extends Scene {
  public onInitialize(): void {
    super.onInitialize();
    this.addActor(SceneBackground.generateRandomGrassland());

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
