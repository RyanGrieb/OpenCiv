import { GameImage } from "../Assets";
import { Game } from "../Game";
import { Actor } from "../scene/Actor";
import { Vector } from "../util/Vector";
import { Tile } from "./Tile";

export interface RiverOptions {
  tile: Tile;
  side: number;
}

export class River extends Actor {
  private tile: Tile;

  constructor(options: RiverOptions) {
    const vectorOffset = -1.75; // Shift all vectors away from the center by 1.5 pixels.. (Causes our rivers to reside between tiles)

    /**
     * server -> client
     * 0 -> 4
     * 1 -> 3
     * 2 -> 2
     * 3 -> 1
     * 4 -> 0
     * 5 -> 5
     * We do this because the position of our vectors starts at the bottom-center of the tile, while for the server the position of tile sides starts at the top-left.
     */
    //FIXME: We should have uniform adjacency and sides for server and client. Converting between is dumb and confusing.
    let side = River.mapServerSideToClientSide(options.side);

    let otherVectorSide = side - 1;

    if (side == 0) {
      otherVectorSide = 5;
    }

    // Get angle b/w two vectors for 0 it's b/w 0 & 5
    const shiftedTileVectors = Vector.shiftVectorsAwayFromCenter(
      options.tile.getX() + options.tile.getWidth() / 2,
      options.tile.getY() + options.tile.getHeight() / 2,
      options.tile.getVectors(),
      vectorOffset
    );
    const originV1 = shiftedTileVectors[side];
    const originV2 = shiftedTileVectors[otherVectorSide];

    const v1 = new Vector(originV1.x, originV1.y);
    const v2 = new Vector(originV2.x, originV2.y);

    const dx = v2.x - v1.x;
    const dy = v2.y - v1.y;

    const rotation = (Math.atan2(dy, dx) * 180) / Math.PI;
    let distance = Math.sqrt(dx ** 2 + dy ** 2);

    let x = v1.x;
    let y = v1.y;

    // Again align our sides some more to have a flush surface if they are against each other.
    super({
      x: x,
      y: y,
      image: Game.getImage(GameImage.RIVER),
      width: distance,
      height: 3,
      transparency: 1,
    });

    this.tile = options.tile;

    this.setRotation(rotation * (Math.PI / 180));
  }

  public static mapServerSideToClientSide(serverSide: number): number {
    const clientMap = [4, 3, 2, 1, 0, 5];
    return clientMap[serverSide];
  }

  //FIXME: Remove these?
  public getRotationOriginX(): number {
    return this.x;
  }

  public getRotationOriginY(): number {
    return this.y;
  }
}
