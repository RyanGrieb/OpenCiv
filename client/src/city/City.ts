import { GameImage, resolveSpriteRegion, SpriteRegion } from "../Assets";
import { Game } from "../Game";
import { GameMap } from "../map/GameMap";
import { Tile } from "../map/Tile";
import { NetworkEvents } from "../network/Client";
import { AbstractPlayer } from "../player/AbstractPlayer";
import { Actor } from "../scene/Actor";
import { ActorGroup } from "../scene/ActorGroup";
import { InGameScene } from "../scene/type/InGameScene";
import { Label } from "../ui/components/Label";
import { Buidling } from "./Building";

export interface CityOptions {
  player: AbstractPlayer;
  // Undefined until this player has actually discovered the city's center tile. A city's outlying
  // territory is visible (and its borders drawn) well before that - see City.setCenterTile().
  tile?: Tile;
  territory: Tile[];
  workedTiles: Tile[];
  name: string;
}

export interface ProductionQueueItem {
  type: "unit" | "building";
  name: string;
  cost: number;
  // Accumulated production toward this item - only meaningful for the front
  // (currently-producing) item, since the server only advances that one.
  progress?: number;
}

/**
 * City class actor handles city name, healthbar, and other attributes. It's not a tile layer.
 */
export class City extends ActorGroup {
  private player: AbstractPlayer;
  private tile: Tile;
  private territory: Tile[];
  private territoryOverlays: Actor[];
  private workedTiles: Tile[];
  // The tile the server will grow this city's borders into next, if any is left to claim.
  private nextBorderTile: Tile | undefined;
  private name: string;
  private civIcon: Actor;
  private nameLabel: Label;
  private innerBorderColor: string;
  private outsideBorderColor: string;
  private buildings: Buidling[];
  private stats: Map<string, number>;
  private statsPresent: boolean;
  private productionQueue: ProductionQueueItem[] = [];

  constructor(options: CityOptions) {
    super({ x: 0, y: 0, z: 2, width: 0, height: 0 });

    this.player = options.player;
    this.player.addCity(this);
    this.name = options.name;
    this.buildings = [];
    this.stats = new Map<string, number>();
    this.statsPresent = false;

    this.innerBorderColor = this.player.getCivilizationData()["inside_border_color"];
    this.outsideBorderColor = this.player.getCivilizationData()["outside_border_color"];

    this.territoryOverlays = [];
    this.territory = [];

    this.workedTiles = options.workedTiles;
    console.log(`[City ${this.name}] Initialized with ${this.workedTiles ? this.workedTiles.length : 'undefined'} worked tiles.`);

    this.setTerritory(options.territory);

    if (options.tile) {
      this.setCenterTile(options.tile);
    }

    NetworkEvents.on({
      eventName: "addBuilding",
      parentObject: this,
      callback: (data: any) => {
        if (data["cityName"] !== this.name) return;

        const buildingData = data["building"];
        this.buildings.push(new Buidling(buildingData));
      }
    });

    NetworkEvents.on({
      eventName: "updateCityStats",
      parentObject: this,
      callback: (data: any) => {
        // Every owned city hears every city's update.
        if (data["cityName"] !== this.name) return;

        const stats = data["cityStats"];
        for (const stat of stats) {
          const statType = Object.keys(stat)[0]; // Get the stat type, e.g., "science", "gold", etc.
          const statValue = stat[statType]; // Get the stat value
          this.stats.set(statType, statValue);
        }

        const workedTilesData = data["workedTiles"];
        if (workedTilesData) {
          const newWorkedTiles: Tile[] = [];
          for (const tileData of workedTilesData) {
            newWorkedTiles.push(GameMap.getInstance().getTiles()[tileData.x][tileData.y]);
          }
          this.workedTiles = newWorkedTiles;
          console.log(`[City ${this.name}] Updated worked tiles: ${this.workedTiles.length}`);
        }

        this.productionQueue = data["productionQueue"] ?? [];
        const nextBorderTile = data["nextBorderTile"];
        this.nextBorderTile = nextBorderTile ? GameMap.getInstance().getTiles()[nextBorderTile.x]?.[nextBorderTile.y] : undefined;
        this.statsPresent = true;
      }
    });
  }

  /**
   * Attaches this city to its center tile, once this player has actually discovered it. Until then
   * the city exists as borders and territory alone - you can see another civilization's outlying
   * land well before you've laid eyes on the city itself, so the name and civ icon (which hang off
   * the center tile) only appear at that point.
   */
  public setCenterTile(tile: Tile) {
    if (this.tile || !tile) return;

    this.tile = tile;
    this.tile.setCity(this);
    this.createNameLabel();
  }

  /**
   * Replaces the territory this city is drawn with. Called again each time more of it is revealed,
   * since a player discovers another civilization's territory a tile at a time rather than all at
   * once - the overlays and border are rebuilt from whatever is currently known.
   */
  public setTerritory(territory: Tile[]) {
    if (territory.length === this.territory.length && territory.every((tile) => this.territory.includes(tile))) {
      return;
    }

    for (const overlay of this.territoryOverlays) {
      this.removeActor(overlay);
    }
    this.territoryOverlays = [];

    for (const tile of this.territory) {
      GameMap.getInstance().removeOutline({ tile: tile, cityOutline: true });
    }

    this.territory = territory;

    for (const tile of this.territory) {
      const territoryOverlay = new Actor({
        image: Game.getInstance().getImage(GameImage.SPRITESHEET),
        spriteRegion: SpriteRegion.TILE_BLANK,
        x: tile.getX(),
        y: tile.getY(),
        width: 32,
        height: 32,
        color: this.innerBorderColor
      });

      this.addActor(territoryOverlay);
      this.territoryOverlays.push(territoryOverlay);
    }

    GameMap.getInstance().drawBorder(this.territory, this.outsideBorderColor, 3);
  }

  public hasStats(): boolean {
    return this.statsPresent;
  }

  public getStat(stat: string): number {
    return this.stats.get(stat);
  }

  public getProductionQueue(): ProductionQueueItem[] {
    return this.productionQueue;
  }

  public onDestroyed(): void {
    this.player.removeCity(this);
    super.onDestroyed();
    Game.getInstance().getCurrentScene().removeActor(this.nameLabel);
  }

  public getTerritory() {
    return this.territory;
  }

  public getNextBorderTile(): Tile | undefined {
    return this.nextBorderTile;
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

  public getWorkedTiles() {
    return this.workedTiles;
  }

  // The city's name and civ icon, positioned off its center tile - so this only runs once that
  // tile has been discovered (see setCenterTile).
  private createNameLabel() {
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
      z: 4
    });

    if (this.player == Game.getInstance().getCurrentSceneAs<InGameScene>().getClientPlayer()) {
      this.nameLabel.setOnClick(() => {
        Game.getInstance().getCurrentSceneAs<InGameScene>().toggleCityUI(this);
      });
    }

    this.nameLabel.conformSize().then(() => {
      this.nameLabel.setPosition(
        this.tile.getX() - this.nameLabel.getWidth() / 2 + this.tile.getWidth() / 2 + 7,
        this.tile.getY() - this.nameLabel.getHeight()
      );
      Game.getInstance().getCurrentScene().addActor(this.nameLabel);

      this.civIcon = new Actor({
        image: Game.getInstance().getImage(GameImage.SPRITESHEET),
        spriteRegion: resolveSpriteRegion(this.player.getCivilizationData().icon_name),
        x: this.nameLabel.getX() - 14,
        y: this.nameLabel.getY(),
        z: 4,
        width: 12,
        height: 12
      });
      //this.addActor(this.civIcon);

      Game.getInstance().getCurrentScene().addActor(this.civIcon);
    });
  }
}
