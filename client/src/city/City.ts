import { GameImage, resolveSpriteRegion, SpriteRegion } from "../Assets";
import { Game } from "../Game";
import { GameMap } from "../map/GameMap";
import { Tile } from "../map/Tile";
import { NetworkEvents } from "../network/Client";
import { AbstractPlayer } from "../player/AbstractPlayer";
import { Actor } from "../scene/Actor";
import { ActorGroup } from "../scene/ActorGroup";
import { CityReligionInfo, CityReligionsEvent, Religions } from "../religion/Religions";
import { Marking } from "../scene/Marking";
import { Standing } from "../scene/Standing";
import { InGameScene } from "../scene/type/InGameScene";
import { FloatingText } from "../ui/components/FloatingText";
import { Buidling, BuildingData } from "./Building";
import { CityBanner } from "./CityBanner";

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
  // The owner's era id from the server ("ancient", "classical", ...), which picks the city's look.
  era: string;
  // The strongest walls the city has built ("walls", "castle"), or null - drawn round it.
  walls: string | null;
  // Who follows what here.
  religion?: CityReligionInfo;
  population?: number;
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
  // What buying it outright with gold costs right now. Absent for what can't be bought (wonders).
  goldCost?: number;
  // In the faith purchase list, what buying it with faith costs.
  faithCost?: number;
  // Turns the city's production would take to finish it, as the server works it out.
  turns?: number;
  // In the production and purchase lists, what a building gives: shown in its tooltip.
  building?: BuildingData;
}

// What the server offers in updateProductionOptions and updatePurchaseOptions. The purchase list never
// has wonders, since gold can't buy them, so it leaves those sections out.
export interface ProductionOptions {
  units: ProductionQueueItem[];
  buildings: ProductionQueueItem[];
  nationalWonders?: ProductionQueueItem[];
  wonders?: ProductionQueueItem[];
}

/**
 * City class actor handles city name, healthbar, and other attributes. It's not a tile layer.
 */
export class City extends ActorGroup {
  // What a city looks like until the server says otherwise.
  public static readonly DEFAULT_ERA = "ancient";
  private static readonly BANNER_ICON_SIZE = 7;
  // The bottom of the city's tile, from its center: where a unit there stands (see Unit.getStandingPoint()).
  private static readonly STANDING_BELOW_CENTER = 14;
  // Between stacked floating texts, e.g. several religions an Inquisitor removed at once.
  private static readonly FLOATING_LINE_GAP = 10;

  private player: AbstractPlayer;
  private tile: Tile;
  private territory: Tile[];
  private territoryOverlays: Actor[];
  private workedTiles: Tile[];
  // The tile the server will grow this city's borders into next, if any is left to claim.
  private nextBorderTile: Tile | undefined;
  private name: string;
  // Over the city: population, growth, name, religion and production, like Civ 5's.
  private banner: CityBanner;
  // Right of the name, shown on the owner's city while it can strike. Clicking it starts aiming.
  private strikeIcon: Actor;
  private religion: CityReligionInfo;
  private population: number;
  // Only the owner hears it: turns until the next citizen, or null while the city isn't growing.
  private turnsToGrow: number | null = null;
  // Its own scene object, standing over the city on the globe - see CityHealthBar.
  private health: number;
  private maxHealth: number;
  private strength: number;
  private strikeReady: boolean;
  private era: string;
  private walls: string | null;
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
    // Before the center tile is attached below, which draws the city in this era's style.
    this.era = options.era ?? City.DEFAULT_ERA;
    this.walls = options.walls ?? null;
    this.religion = options.religion ?? { followers: {}, nonFollowers: 0, majority: null };
    this.population = options.population ?? 1;

    this.innerBorderColor = this.player.getCivilizationData()["inside_border_color"];
    this.outsideBorderColor = this.player.getCivilizationData()["outside_border_color"];

    this.territoryOverlays = [];
    this.territory = [];

    this.workedTiles = options.workedTiles;
    console.log(
      `[City ${this.name}] Initialized with ${this.workedTiles ? this.workedTiles.length : "undefined"} worked tiles.`
    );

    this.setTerritory(options.territory);

    if (options.tile) {
      this.setCenterTile(options.tile);
    }

    NetworkEvents.on<{ cityName: string; population: number }>({
      eventName: "cityPopulation",
      parentObject: this,
      callback: (data) => {
        if (data.cityName === this.name) this.setPopulation(data.population);
      }
    });

    NetworkEvents.on<CityReligionsEvent>({
      eventName: "cityReligions",
      parentObject: this,
      callback: (data) => {
        const info = data.cities.find((city) => city.cityName === this.name);
        if (info) this.setReligion(info);
      }
    });

    NetworkEvents.on<{ cityName: string; religion: string; converted: number }>({
      eventName: "religionSpread",
      parentObject: this,
      callback: (data) => {
        if (data.cityName === this.name) this.showSpread(data.religion, data.converted);
      }
    });

    NetworkEvents.on<{ cityName: string; removed: Record<string, number> }>({
      eventName: "heresyRemoved",
      parentObject: this,
      callback: (data) => {
        if (data.cityName === this.name) this.showHeresyRemoved(data.removed);
      }
    });

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
        this.nextBorderTile = nextBorderTile
          ? GameMap.getInstance().getTiles()[nextBorderTile.x]?.[nextBorderTile.y]
          : undefined;
        this.turnsToGrow = data["turnsToGrow"] ?? null;
        this.statsPresent = true;
        this.population = this.stats.get("population") ?? this.population;
        this.refreshBanner();
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
        this.refreshBanner();
      }
    });

    NetworkEvents.on<CityCombatEvent>({
      eventName: "unitCombat",
      parentObject: this,
      callback: (data) => {
        if (data.defenderCity !== this.name) return;

        this.showDamage(this.health - data.defenderCityHealth);
        this.health = data.defenderCityHealth;
        this.refreshBanner();
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
    this.createBanner();
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

    this.removeTerritoryOverlays();

    for (const tile of this.territory) {
      GameMap.getInstance().removeOutline({ tile: tile, cityOutline: true });
      if (tile.getTerritoryCity() === this) tile.setTerritoryCity(undefined);
    }

    this.territory = territory;
    this.territory.forEach((tile) => tile.setTerritoryCity(this));

    for (const tile of this.territory) {
      const territoryOverlay = new Actor({
        image: Game.getInstance().getImage(GameImage.SPRITESHEET),
        spriteRegion: SpriteRegion.TILE_BLANK,
        x: tile.getX(),
        y: tile.getY(),
        // Over the fog of war (1), under units (2).
        z: 1.5,
        width: 32,
        height: 32,
        color: this.innerBorderColor
      });
      // Its own actor in the scene, not one of the city's: on the globe it lies over the trees and the
      // like standing on the tile, as on the flat map, rather than painted into the ground under them.
      Marking.markUnderUnits(territoryOverlay);
      Game.getInstance().getCurrentScene().addActor(territoryOverlay);
      this.territoryOverlays.push(territoryOverlay);
    }

    GameMap.getInstance().drawBorder(this.territory, this.outsideBorderColor);
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
    [this.banner, this.strikeIcon].filter((actor) => actor).forEach((actor) => scene.removeActor(actor));
    this.removeTerritoryOverlays();
  }

  /**
   * Takes the city off the map for good, borders included - when it changes hands, GameMap builds it
   * again for its new owner.
   */
  public remove() {
    NetworkEvents.removeCallbacksByParentObject(this);
    for (const tile of this.territory) {
      GameMap.getInstance().removeOutline({ tile, cityOutline: true });
      if (tile.getTerritoryCity() === this) tile.setTerritoryCity(undefined);
    }
    this.removeTerritoryOverlays();
    Game.getInstance().getCurrentScene().removeActor(this);
  }

  public getReligion(): CityReligionInfo {
    return this.religion;
  }

  public getPopulation(): number {
    return this.population;
  }

  public setPopulation(population: number) {
    if (population === undefined || population === this.population) return;

    this.population = population;
    this.refreshBanner();
  }

  public getTurnsToGrow(): number | null {
    return this.turnsToGrow;
  }

  public isOwnedByClient(): boolean {
    return this.player === Game.getInstance().getCurrentSceneAs<InGameScene>().getClientPlayer();
  }

  public hasReligionIcon(): boolean {
    return !!this.banner && !!this.religion.majority;
  }

  /** Shows the religion the city now follows by its name, and keeps who follows what for the tooltip. */
  public setReligion(religion: CityReligionInfo) {
    if (!religion) return;

    this.religion = religion;
    this.refreshBanner();
  }

  /** Redraws the city when its owner enters a new era or it builds walls. */
  public setAppearance(era: string, walls: string | null) {
    walls = walls ?? null;
    if (!era || (era === this.era && walls === this.walls)) return;

    this.era = era;
    this.walls = walls;
    if (this.tile) GameMap.getInstance().redrawMap([this.tile]);
  }

  public getEra() {
    return this.era;
  }

  public getWalls() {
    return this.walls;
  }

  // The sprite the city is drawn with on the map, for showing it elsewhere (the combat preview).
  public getSpriteRegion(): SpriteRegion {
    const tileType = Tile.getCityType(this.era, this.tile?.getGridX() ?? 0, this.tile?.getGridY() ?? 0);
    return resolveSpriteRegion(`TILE_${tileType.toUpperCase()}`);
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

  private removeTerritoryOverlays() {
    const scene = Game.getInstance().getCurrentScene();
    this.territoryOverlays.forEach((overlay) => scene.removeActor(overlay));
    this.territoryOverlays = [];
  }

  // The city's banner, positioned off its center tile - so this only runs once that tile has been
  // discovered (see setCenterTile).
  private createBanner() {
    this.banner = new CityBanner(this, 4);
    this.banner.refresh();
    // On the globe the banner stands over the city, always in front of the map. It stands on the tile's
    // middle rather than its bottom like a unit, so it isn't lifted high off the ground.
    Standing.set(this.banner, {
      anchor: () => this.getTileMiddle(),
      tileMiddle: () => this.getTileMiddle(),
      overlay: true
    });
    Game.getInstance().getCurrentScene().addActor(this.banner);
    this.createStrikeIcon();
  }

  // Lays the banner out again for what it shows now, and the strike icon beside it.
  private refreshBanner() {
    if (!this.banner) return;

    this.banner.refresh();
    this.strikeIcon?.setPosition(this.banner.getRight() + 2, this.banner.getPillTop());
  }

  private createStrikeIcon() {
    this.strikeIcon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.ICON_TARGET,
      x: this.banner.getRight() + 2,
      y: this.banner.getPillTop(),
      z: 4,
      width: City.BANNER_ICON_SIZE,
      height: City.BANNER_ICON_SIZE,
      cameraApplies: true
    });
    Standing.set(this.strikeIcon, {
      anchor: () => this.getTileMiddle(),
      tileMiddle: () => this.getTileMiddle(),
      overlay: true
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

  // Where the city's damage stands on the globe: the bottom of its tile, like a unit there.
  private getStandingPoint(): [number, number] {
    const center = this.tile.getCenterPosition();
    return [center.x, center.y + City.STANDING_BELOW_CENTER];
  }

  // The middle of its tile: where its banner, strike icon and health bar stand on the globe, and what
  // its damage stands off (see StandingOptions.tileMiddle).
  private getTileMiddle(): [number, number] {
    const center = this.tile.getCenterPosition();
    return [center.x, center.y];
  }

  // "-24" rising from the city, like the damage over a unit.
  private showDamage(damage: number) {
    if (damage > 0) this.showFloatingText(`-${damage}`, "red");
  }

  // The religion's icon and "+2 Followers" rising from the city when a Missionary or Great Prophet
  // converts its citizens. Nothing when the spread only built up pressure.
  private showSpread(religion: string, converted: number) {
    if (converted <= 0) return;

    const icon = SpriteRegion[Religions.getIcon(religion)];
    this.showFloatingText(`!{${icon}} +${converted} ${converted === 1 ? "Follower" : "Followers"}`, "white");
  }

  // A religion's icon and "-2 Heretics" rising in red from the city for each religion an Inquisitor
  // removed there, one line above the next.
  private showHeresyRemoved(removed: Record<string, number>) {
    Object.entries(removed)
      .filter(([, count]) => count > 0)
      .forEach(([religion, count], index) => {
        const icon = SpriteRegion[Religions.getIcon(religion)];
        const heretics = count === 1 ? "Heretic" : "Heretics";
        this.showFloatingText(`!{${icon}} -${count} ${heretics}`, "red", index * City.FLOATING_LINE_GAP);
      });
  }

  // `raise` lifts the text that much higher, for several lines at once.
  private showFloatingText(text: string, color: string, raise = 0) {
    if (!this.tile) return;

    new FloatingText({
      text,
      color,
      standsOn: () => this.getStandingPoint(),
      tileMiddle: () => this.getTileMiddle(),
      centerX: this.tile.getX() + this.tile.getWidth() / 2,
      fromY: this.tile.getY() + 4 - raise,
      toY: this.tile.getY() - 16 - raise
    }).show();
  }
}
