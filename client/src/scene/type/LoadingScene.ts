import { LoadingScreen } from "../../ui/components/LoadingScreen";
import { Scene } from "../Scene";

// Shown while the server builds the world. The in-game scene carries the same loading screen on
// until the map is drawn (see InGameScene).
export class LoadingScene extends Scene {
  public onInitialize(): void {
    super.onInitialize();
    this.addActor(new LoadingScreen("Generating the world...", 0));
  }
}
