import * as ex from "excalibur";
import { WorldMap } from "../map/worldmap";
import { TileType } from "../map/tile";
import { GameScene } from "./gameScene";
import { Button } from "../ui/button";

class MultiplayerOptions extends GameScene {
  public onInitialize(engine: ex.Engine): void {
    const joinLobbyButton = new Button(
      "Join Lobby",
      engine.canvasWidth / 2 - 200,
      engine.canvasHeight / 2,
      300,
      60,
      () => {
        console.log("join lobby");
      }
    );

    const hostLobbyButton = new Button(
      "Host Lobby",
      engine.canvasWidth / 2 + 200,
      engine.canvasHeight / 2,
      300,
      60,
      () => {
        console.log("host lobby");
      }
    );

    this.add(joinLobbyButton)
    this.add(hostLobbyButton)
  }
}

export { MultiplayerOptions };
