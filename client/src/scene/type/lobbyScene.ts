import { Scene } from "../scene";
import { SceneBackground } from "../sceneBackground";

export class LobbyScene extends Scene {
  public onInitialize(): void {
    super.onInitialize();
    this.addActor(SceneBackground.generateRandomGrassland());
  }
}
