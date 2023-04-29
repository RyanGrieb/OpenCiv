import { Game } from "../../Game";
import { Label } from "../../ui/Label";
import { Scene } from "../Scene";
import { SceneBackground } from "../SceneBackground";

export class LoadingScene extends Scene {
  public onInitialize(): void {
    super.onInitialize();
    this.addActor(SceneBackground.generateRandomGrassland());

    const loadingLabel = new Label({
      text: "Loading Map...",
      font: "bold 22px arial",
      fontColor: "white",
      shadowColor: "black",
      lineWidth: 4,
      shadowBlur: 20,
    });

    loadingLabel.conformSize().then(() => {
      loadingLabel.setPosition(
        Game.getWidth() / 2 - loadingLabel.getWidth() / 2,
        Game.getHeight() / 2 - loadingLabel.getHeight() / 2
      );
    });

    this.addActor(loadingLabel);
  }
}
