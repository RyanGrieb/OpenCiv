import { Game } from "../Game";
import { Player } from "../Player";
import { Tile } from "../map/Tile";

export interface CityOptions {
  tile: Tile;
  player: Player;
}

export class City {
  private tile: Tile;
  private player: Player;
  private name: string;
  /**
   * Creates a new City instance.
   * @param options - The options for initializing the city.
   * @param options.tile - The tile where the city is located.
   * @param options.player - The player who owns the city.
   */
  constructor(options: CityOptions) {
    this.tile = options.tile;
    this.player = options.player;
    this.name = this.player.getNextAvailableCityName();
  }

  public getTile(): Tile {
    return this.tile;
  }

  public getPlayer(): Player {
    return this.player;
  }

  public getName() {
    return this.name;
  }
}
