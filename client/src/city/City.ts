import { Tile } from "../map/Tile";
import { AbstractPlayer } from "../player/AbstractPlayer";
import { ActorGroup } from "../scene/ActorGroup";

export interface CityOptions {
  player: AbstractPlayer;
  tile: Tile;
}

/**
 * City class actor handles city name, healthbar, and other attributes. It's not a tile layer.
 */
export class City extends ActorGroup {
  private player: AbstractPlayer;
  private tile: Tile;

  constructor(options: CityOptions) {
    super({ x: 0, y: 0, z: 2, width: 0, height: 0 });

    this.player = options.player;
    this.tile = options.tile;
  }

  public getPlayer() {
    return this.player;
  }

  public getTile() {
    return this.tile;
  }
}
