import { GameMap } from "../../map/gameMap";
import { Scene } from "../scene";

export class InGameScene extends Scene {
  public onInitialize(): void {
    GameMap.init();
    //this.setCamera(new Camera)
    //this.on("keydown", (options) => {});
    //this.on("keyup", (options) => {});
  }
}
