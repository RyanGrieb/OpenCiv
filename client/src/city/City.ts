import { GameImage, SpriteRegion } from "../Assets";
import { Game } from "../Game";
import { GameMap } from "../map/GameMap";
import { Tile } from "../map/Tile";
import { NetworkEvents } from "../network/Client";
import { AbstractPlayer } from "../player/AbstractPlayer";
import { Actor } from "../scene/Actor";
import { ActorGroup } from "../scene/ActorGroup";
import { InGameScene } from "../scene/type/InGameScene";
import { Label } from "../ui/Label";
import { Buidling } from "./Building";

export interface CityOptions {
  player: AbstractPlayer;
  tile: Tile;
  name: string;
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
  private innerBorderColor: string;
  private outsideBorderColor: string;
  private buildings: Buidling[];
  private stats: Map<string, number>;

  constructor(options: CityOptions) {
    super({ x: 0, y: 0, z: 2, width: 0, height: 0 });

    this.player = options.player;
    this.tile = options.tile;
    this.name = options.name;
    this.buildings = [];
    this.stats = new Map<string, number>();

    this.innerBorderColor =
      this.player.getCivilizationData()["inside_border_color"];
    this.outsideBorderColor =
      this.player.getCivilizationData()["outside_border_color"];

    this.territoryOverlays = [];

    //FIXME: Have the server communicate what tiles are our territory.
    this.territory = [this.tile];
    for (const adjTile of this.tile.getAdjacentTiles()) {
      if (!adjTile) continue;

      this.territory.push(adjTile);
    }

    this.nameLabel = new Label({
      text: this.name,
      cameraApplies: true,
      x: this.tile.getX(),
      y: this.tile.getY(),
      font: "12px serif",
      fontColor: "white",
      transparency: 1,
      shadowBlur: 1,
      shadowColor: "black",
      lineWidth: 1,
      z: 4,
      onClick: () => {
        Game.getCurrentSceneAs<InGameScene>().toggleCityUI(this);
      },
    });

    this.nameLabel.conformSize().then(() => {
      this.nameLabel.setPosition(
        this.tile.getX() -
          this.nameLabel.getWidth() / 2 +
          this.tile.getWidth() / 2,
        this.tile.getY() - this.nameLabel.getHeight()
      );
      Game.getCurrentScene().addActor(this.nameLabel);
    });

    for (const tile of this.territory) {
      const territoryOverlay = new Actor({
        image: Game.getImage(GameImage.SPRITESHEET),
        spriteRegion: SpriteRegion.BLANK_TILE,
        x: tile.getX(),
        y: tile.getY(),
        width: 32,
        height: 32,
        color: this.innerBorderColor,
      });

      this.addActor(territoryOverlay);
      this.territoryOverlays.push(territoryOverlay);
    }

    GameMap.getInstance().drawBorder(
      this.territory,
      this.outsideBorderColor,
      3
    );

    NetworkEvents.on({
      eventName: "addBuilding",
      parentObject: this,
      callback: (data: any) => {
        const buildingData = data["building"];
        this.buildings.push(new Buidling(buildingData));
      },
    });

    NetworkEvents.on({
      eventName: "updateCityStats",
      parentObject: this,
      callback: (data: any) => {
        const stats = data["cityStats"];
        for (const stat of stats) {
          const statType = Object.keys(stat)[0]; // Get the stat type, e.g., "science", "gold", etc.
          const statValue = stat[statType]; // Get the stat value
          this.stats.set(statType, statValue);
        }
      },
    });
  }

  public getStat(stat: string): number {
    return this.stats.get(stat);
  }

  public onDestroyed(): void {
    super.onDestroyed();
    Game.getCurrentScene().removeActor(this.nameLabel);
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

  public getBuildings() {
    return this.buildings;
  }
}
