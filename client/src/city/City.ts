import { GameImage, resolveSpriteRegion, SpriteRegion } from "../Assets";
import { Game } from "../Game";
import { GameMap } from "../map/GameMap";
import { Tile } from "../map/Tile";
import { NetworkEvents } from "../network/Client";
import { AbstractPlayer } from "../player/AbstractPlayer";
import { Actor } from "../scene/Actor";
import { ActorGroup } from "../scene/ActorGroup";
import { InGameScene } from "../scene/type/InGameScene";
import { FloatingText } from "../ui/components/FloatingText";
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
  health: number;
  maxHealth: number;
  strength: number;
}

// Server "cityCombatStatus" payload, from server City.refreshCombatStatus().
export interface CityCombatStatusEvent {
  cityName: string;
  health: number;
  maxHealth: number;
  strength: number;
  // Only ever true for the owner: the city has an enemy in range and hasn't fired this turn.
  canStrike: boolean;
}

// The fields of a "unitCombat" event that concern a city: it was attacked, or it fired.
interface CityCombatEvent {
  defenderCity?: string;
  defenderCityHealth?: number;
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
  private static readonly HEALTH_BAR_WIDTH = 28;
  private static readonly HEALTH_BAR_HEIGHT = 3;
  private static readonly BANNER_ICON_SIZE = 12;

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
  // Right of the name, shown on the owner's city while it can strike. Clicking it starts aiming.
  private strikeIcon: Actor;
  private health: number;
  private maxHealth: number;
  private strength: number;
  private strikeReady: boolean;
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
    this.health = options.health;
    this.maxHealth = options.maxHealth;
    this.strength = options.strength;
    this.strikeReady = false;

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

    NetworkEvents.on<CityCombatStatusEvent>({
      eventName: "cityCombatStatus",
      parentObject: this,
      callback: (data) => {
        if (data.cityName !== this.name) return;

        this.health = data.health;
        this.maxHealth = data.maxHealth;
        this.strength = data.strength;
        this.setStrikeReady(data.canStrike);
      }
    });

    NetworkEvents.on<CityCombatEvent>({
      eventName: "unitCombat",
      parentObject: this,
      callback: (data) => {
        if (data.defenderCity !== this.name) return;

        this.showDamage(this.health - data.defenderCityHealth);
        this.health = data.defenderCityHealth;
      }
    });
  }

  public draw(canvasContext: CanvasRenderingContext2D) {
    super.draw(canvasContext);
    this.drawHealthBar(canvasContext);
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
    const scene = Game.getInstance().getCurrentScene();
    [this.nameLabel, this.civIcon, this.strikeIcon].forEach((actor) => scene.removeActor(actor));
  }

  /**
   * Takes the city off the map for good, borders included - when it changes hands, GameMap builds it
   * again for its new owner.
   */
  public remove() {
    NetworkEvents.removeCallbacksByParentObject(this);
    for (const tile of this.territory) {
      GameMap.getInstance().removeOutline({ tile, cityOutline: true });
    }
    Game.getInstance().getCurrentScene().removeActor(this);
  }

  public getHealth() {
    return this.health;
  }

  public getMaxHealth() {
    return this.maxHealth;
  }

  public getStrength() {
    return this.strength;
  }

  public canStrike() {
    return this.strikeReady;
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
      this.createStrikeIcon();
    });
  }

  private createStrikeIcon() {
    this.strikeIcon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.ICON_TARGET,
      x: this.nameLabel.getX() + this.nameLabel.getWidth() + 2,
      y: this.nameLabel.getY(),
      z: 4,
      width: City.BANNER_ICON_SIZE,
      height: City.BANNER_ICON_SIZE,
      cameraApplies: true
    });
    this.strikeIcon.on("clicked", () => {
      if (!this.strikeReady) return;

      Game.getInstance().getCurrentSceneAs<InGameScene>().getClientPlayer().startCityStrike(this);
    });
    if (this.strikeReady) Game.getInstance().getCurrentScene().addActor(this.strikeIcon);
  }

  private setStrikeReady(ready: boolean) {
    if (this.strikeReady === ready) return;

    this.strikeReady = ready;
    if (!this.strikeIcon) return;

    const scene = Game.getInstance().getCurrentScene();
    if (ready) scene.addActor(this.strikeIcon);
    else scene.removeActor(this.strikeIcon);
  }

  // Only once damaged, as in Civ 5: green for health left, red for what's lost, between banner and city.
  private drawHealthBar(canvasContext: CanvasRenderingContext2D) {
    if (!this.tile || this.health >= this.maxHealth) return;

    const x = this.tile.getX() + (this.tile.getWidth() - City.HEALTH_BAR_WIDTH) / 2;
    const y = this.tile.getY() - 1;
    const healthWidth = (Math.max(0, this.health) / this.maxHealth) * City.HEALTH_BAR_WIDTH;
    const bar = { y, height: City.HEALTH_BAR_HEIGHT, canvasContext, fill: true, cameraApplies: true };

    Game.getInstance().drawRect({ ...bar, x, width: City.HEALTH_BAR_WIDTH, color: "red" });
    Game.getInstance().drawRect({ ...bar, x, width: healthWidth, color: "lime" });
  }

  // "-24" rising from the city, like the damage over a unit.
  private showDamage(damage: number) {
    if (!this.tile || damage <= 0) return;

    const centerX = this.tile.getX() + this.tile.getWidth() / 2;
    new FloatingText({
      text: `-${damage}`,
      color: "red",
      centerX,
      fromY: this.tile.getY() + 4,
      toY: this.tile.getY() - 16
    }).show();
  }
}
