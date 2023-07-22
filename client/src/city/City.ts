import { GameImage, SpriteRegion } from "../Assets";
import { Game } from "../Game";
import { GameMap } from "../map/GameMap";
import { Tile } from "../map/Tile";
import { AbstractPlayer } from "../player/AbstractPlayer";
import { Actor } from "../scene/Actor";
import { ActorGroup } from "../scene/ActorGroup";
import { Label } from "../ui/Label";

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
  private territory: Tile[];
  private territoryOverlays: Actor[];
  private name: string;
  private nameLabel: Label;

  constructor(options: CityOptions) {
    super({ x: 0, y: 0, z: 2, width: 0, height: 0 });

    this.player = options.player;
    this.tile = options.tile;
    this.name = "Athens"; //FIXME: Generate city names server-side

    this.territoryOverlays = [];
    this.territory = [this.tile];
    for (const adjTile of this.tile.getAdjacentTiles()) {
      if (!adjTile) continue;

      this.territory.push(adjTile);
    }

    this.nameLabel = new Label({
      text: this.name,
      x: this.tile.getX(),
      y: this.tile.getY(),
      font: "12px serif",
      fontColor: "white",
      transparency: 1,
      shadowBlur: 1,
      shadowColor: "black",
      lineWidth: 1,
      onClick: () => {
        Game.getCurrentScene().call("toggleCityUI", { city: this });
      },
    });

    this.nameLabel.conformSize().then(() => {
      this.nameLabel.setPosition(
        this.tile.getX() -
          this.nameLabel.getWidth() / 2 +
          this.tile.getWidth() / 2,
        this.tile.getY() - this.nameLabel.getHeight()
      );
      this.addActor(this.nameLabel);
    });

    for (const tile of this.territory) {
      const territoryOverlay = new Actor({
        image: Game.getImage(GameImage.SPRITESHEET),
        spriteRegion: SpriteRegion.BLANK_TILE,
        x: tile.getX(),
        y: tile.getY(),
        width: 32,
        height: 32,
        color: "yellow",
        transparency: 0.1,
      });

      this.addActor(territoryOverlay);
      this.territoryOverlays.push(territoryOverlay);
    }

    GameMap.getInstance().drawBorder(this.territory);
  }

  public getTerritory() {
    return this.territory;
  }

  public getPlayer() {
    return this.player;
  }

  public getTile() {
    return this.tile;
  }

  public getName() {
    return this.name;
  }
}
