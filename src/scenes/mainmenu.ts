import * as ex from "excalibur";
import { GraphicsComponent } from "excalibur";
import { WorldMap } from "../map/worldmap";
import { TileType } from "../map/tile";
import test from "node:test";
import { Button } from "../button";
import { spritesheet } from "../resources";

class MainMenu extends ex.Scene {
  private map: WorldMap;

  public onInitialize(engine: ex.Engine): void {
    this.map = new WorldMap();

    this.map.setTile(TileType.GRASS, 0, 0);

    const singleplayerButton = new Button(
      "Singleplayer",
      engine.canvasWidth / 2,
      230,
      300,
      60,
      () => {
        console.log("singleplayer");
      }
    );
    const multiplayerButton = new Button(
      "Multiplayer",
      engine.canvasWidth / 2,
      300,
      300,
      60,
      () => {
        console.log("multiplayer");
      }
    );
    const optionsButton = new Button(
      "Options",
      engine.canvasWidth / 2,
      370,
      300,
      60,
      () => {
        console.log("settings");
      }
    );

    // add player to the current scene
    this.add(singleplayerButton);
    this.add(multiplayerButton);
    this.add(optionsButton);

    this.renderBackground();
  }

  private renderBackground() {
    const testActor = new ex.Actor({
      width: 28,
      height: 32,
      x: 100,
      y: 100,
    });

    testActor.graphics.use(spritesheet.getSprite(3, 6) as ex.Graphic);

    this.add(testActor);

    this.add(this.map );
    //TODO: Move this later
    //let map = new WorldMap();
    //map.setTile(null, 0, 0);
  }
}

export { MainMenu };
