import { NetworkEvents } from "../../network/Client";
import { LoadingScreen } from "../../ui/components/LoadingScreen";
import { Scene } from "../Scene";

interface LoadingProgressEvent {
  text: string;
  // How far through the server's own work, from 0 to 1.
  progress: number;
}

// Shown while the server builds the world, with each step it reports. The in-game scene carries the
// same loading screen on until the map is drawn (see InGameScene).
export class LoadingScene extends Scene {
  public onInitialize(): void {
    super.onInitialize();

    const loadingScreen = new LoadingScreen("Generating the world...", 0);
    this.addActor(loadingScreen);

    NetworkEvents.on<LoadingProgressEvent>({
      eventName: "loadingProgress",
      parentObject: this,
      callback: (data) => loadingScreen.setStatus(data.text, data.progress * LoadingScreen.SERVER_SHARE)
    });
  }
}
