import { Scene } from "../Scene";
import { Game } from "../../Game";
import { Button, ButtonSize } from "../../ui/Button";
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
      titleLabel.setPosition(Game.getInstance().getWidth() / 2 - titleLabel.getWidth() / 2, Game.getInstance().getHeight() / 3 - 75);
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
        text: "Play",
        x: Game.getInstance().getWidth() / 2 - ButtonSize.LARGE.width / 2,
        y: Game.getInstance().getHeight() / 3 + 68,
        size: ButtonSize.LARGE,
        fontColor: "white",
        onClicked: () => {
          Game.getInstance().setScene("join_game");
        }
      })
    );

    this.addActor(
      new Button({
        text: "Options",
        x: Game.getInstance().getWidth() / 2 - ButtonSize.LARGE.width / 2,
        y: Game.getInstance().getHeight() / 3 + 136,
        size: ButtonSize.LARGE,
        fontColor: "white",
        onClicked: () => {
          console.log("options scene");
        }
      })
    );
  }
}
