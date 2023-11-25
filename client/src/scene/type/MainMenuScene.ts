import { Scene } from "../Scene";
import { Game } from "../../Game";
import { Button } from "../../ui/Button";
import { Label } from "../../ui/Label";
import { SceneBackground } from "../SceneBackground";

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
      shadowBlur: 20
    });
    titleLabel.conformSize().then(() => {
      titleLabel.setPosition(Game.getInstance().getWidth() / 2 - titleLabel.getWidth() / 2, 135);
    });

    this.addActor(titleLabel);

    /*const backgroundActor = new Actor({
      color: "rgba(0, 0, 0, 0.5)",
      x: Game.getWidth() / 2 - 600 / 2,
      y: Game.getHeight() / 3 + 68 / 2,
      width: 600,
      height: 200,
    });

    this.addActor(backgroundActor);*/

    this.addActor(
      new Button({
        text: "Singleplayer",
        x: Game.getInstance().getWidth() / 2 - 242 / 2 - 250 / 2,
        y: Game.getInstance().getHeight() / 3 + 68,
        width: 242,
        height: 62,
        fontColor: "white",
        onClicked: () => {
          console.log("singleplayer scene");
        }
      })
    );

    this.addActor(
      new Button({
        text: "Host Game",
        x: Game.getInstance().getWidth() / 2 - 242 / 2 + 250 / 2,
        y: Game.getInstance().getHeight() / 3 + 68,
        width: 242,
        height: 62,
        fontColor: "white",
        onClicked: () => {
          console.log("singleplayer scene");
        }
      })
    );

    this.addActor(
      new Button({
        text: "Join Game",
        x: Game.getInstance().getWidth() / 2 - 242 / 2 + 250 / 2,
        y: Game.getInstance().getHeight() / 3 + 136,
        width: 242,
        height: 62,
        fontColor: "white",
        onClicked: () => {
          Game.getInstance().setScene("join_game");
        }
      })
    );

    this.addActor(
      new Button({
        text: "Options",
        x: Game.getInstance().getWidth() / 2 - 242 / 2 - 250 / 2,
        y: Game.getInstance().getHeight() / 3 + 136,
        width: 242,
        height: 62,
        fontColor: "white",
        onClicked: () => {
          console.log("options scene");
        }
      })
    );
  }
}
