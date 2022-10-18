import * as ex from "excalibur";
import { GraphicsComponent } from "excalibur";
import { WorldMap } from "../map/worldmap";
import { TileType } from "../map/tile";
import test from "node:test";
import { Button } from "../ui/button";
import { spritesheet } from "../resources";
import { GameScene } from "./gameScene";
import { Resources } from "../resources";
import { Textbox } from "../ui/textbox";

class MainMenu extends GameScene {
  public onInitialize(engine: ex.Engine): void {
    this.engine = engine;

    const singleplayerButton = new Button(
      "Singleplayer",
      engine.canvasWidth / 2,
      230,
      300,
      60,
      () => {
        console.log("singleplayer");
        this.game.goToScene("ingame");
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
        this.game.goToScene("multiplayeroptions");
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
    const logoActor = new ex.Actor({
      width: 400,
      height: 107,
      x: this.engine.canvasWidth / 2,
      y: 100,
    });

    logoActor.graphics.use(Resources.logo.toSprite());
    this.add(logoActor);

    this.add(new Textbox("ex. 4F31K", this.engine.canvasWidth / 2, 50, 200, 32));
    //TODO: Move this later
    //let map = new WorldMap();
    //map.setTile(null, 0, 0);
  }
}

export { MainMenu };
