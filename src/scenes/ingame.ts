import * as ex from "excalibur";
import { WorldMap } from "../map/worldmap";
import { TileType } from "../map/tile";
import { GameScene } from "./gameScene";

class InGame extends GameScene {
  public onInitialize(engine: ex.Engine): void {
    WorldMap.setTile(TileType.GRASS, 0, 0);
  }
}

export { InGame };
