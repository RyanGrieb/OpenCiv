import * as ex from "excalibur";
import { Tile, TileType } from "./tile";

class WorldMap extends ex.Actor {
  //private group: GraphicsGroup
  constructor() {
    super({
      x: 0,
      y: 0,
      //
    });

    let group = new ex.GraphicsGroup({
      members: [],
    });

    // Hard part :)

    this.graphics.use(group);
  }

  public static setTile(tileType: TileType, x: number, y: number) {
    console.log("hello.");
  }
}

export { WorldMap };
