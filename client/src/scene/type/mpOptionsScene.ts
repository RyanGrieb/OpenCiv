import { Scene } from "../scene";
import { Game } from "../../game";
import { Button } from "../../ui/button";
import { SceneBackground } from "../sceneBackground";

export class MPOptionsScene extends Scene {
  public onInitialize(): void {
    super.onInitialize();
    this.addActor(SceneBackground.generateRandomGrassland());

    // TODO: onclick callback function...
    this.addActor(
      new Button({
        text: "Host Game",
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
        text: "Join Game",
        x: Game.getWidth() / 2 - 242 / 2,
        y: Game.getHeight() / 3 + 68,
        width: 242,
        height: 62,
        fontColor: "white",
        onClicked: () => {
          Game.setScene("join_game");
        },
      })
    );

    this.addActor(
      new Button({
        text: "Back",
        x: Game.getWidth() / 2 - 242 / 2,
        y: Game.getHeight() / 3 + 136,
        width: 242,
        height: 62,
        fontColor: "white",
        onClicked: () => {
          Game.setScene("main_menu");
        },
      })
    );
  }
}
