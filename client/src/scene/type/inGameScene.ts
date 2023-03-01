import { GameMap } from "../../map/gameMap";
import { Camera } from "../camera";
import { Scene } from "../scene";

export class InGameScene extends Scene {
  private keysHeld: string[];
  public onInitialize(): void {
    this.keysHeld = [];

    GameMap.init();
    this.setCamera(new Camera());

    this.on("keydown", (options) => {
      if (this.keysHeld.includes(options.key)) {
        return;
      }

      this.keysHeld.push(options.key);

      if (options.key == "a" || options.key == "A") {
        console.log("a");
        this.getCamera().addVel(5, 0);
      }
      if (options.key == "d" || options.key == "D") {
        this.getCamera().addVel(-5, 0);
      }
      if (options.key == "w" || options.key == "W") {
        this.getCamera().addVel(0, 5);
      }
      if (options.key == "s" || options.key == "S") {
        this.getCamera().addVel(0, -5);
      }
    });

    this.on("keyup", (options) => {
      this.keysHeld = this.keysHeld.filter((element) => element !== options.key); // Remove key from held lits

      if (options.key == "a" || options.key == "A") {
        console.log("no a ");
        this.getCamera().addVel(-5, 0);
      }
      if (options.key == "d" || options.key == "D") {
        this.getCamera().addVel(5, 0);
      }

      if (options.key == "w" || options.key == "W") {
        this.getCamera().addVel(0, -5);
      }
      if (options.key == "s" || options.key == "S") {
        this.getCamera().addVel(0, 5);
      }
    });
  }
}
