import { GameMap } from "../../map/gameMap";
import { Camera } from "../camera";
import { Scene } from "../scene";

export class InGameScene extends Scene {
  public onInitialize(): void {
    GameMap.init();
    const camera = new Camera({
      wasd_controls: true,
      mouse_controls: true,
      //initial_position: [1, 1],
    });
    this.setCamera(camera);
  }
}
