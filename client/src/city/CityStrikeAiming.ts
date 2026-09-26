import { Game } from "../Game";
import { GameMap } from "../map/GameMap";
import { MapWrap } from "../map/MapWrap";
import { Tile } from "../map/Tile";
import { NetworkEvents, WebsocketClient } from "../network/Client";
import { RangedAiming } from "../player/RangedAiming";
import { Actor } from "../scene/Actor";
import { Line } from "../scene/Line";
import { CombatPreviewEvent, CombatPreviewWindow } from "../ui/hud/CombatPreviewWindow";
import { City } from "./City";

// Server "cityStrikeTargets" payload, from server City.sendStrikeTargets(): every tile the city can reach.
export interface CityStrikeTargetsEvent {
  cityName: string;
  tiles: { x: number; y: number }[];
}

/**
 * Aiming a city's ranged strike, started from the target icon on its banner or from the "A city can
 * attack" notification. The city's reach is tinted red like a ranged unit's; hovering an enemy shows
 * the server's preview, a left-click on it fires, and a right-click anywhere stops aiming.
 */
export class CityStrikeAiming {
  private city: City | undefined;
  private rangeTiles: Tile[] = [];
  private overlays: Actor[] = [];
  private aimedTile: Tile | undefined;
  private line: Line | undefined;
  private previewWindow: CombatPreviewWindow | undefined;

  constructor() {
    NetworkEvents.on<CityStrikeTargetsEvent>({
      eventName: "cityStrikeTargets",
      parentObject: this,
      callback: (data) => this.setTargets(data)
    });

    // Dropped if the player has aimed elsewhere since asking.
    NetworkEvents.on<CombatPreviewEvent>({
      eventName: "combatPreview",
      parentObject: this,
      callback: (data) => this.showPreview(data)
    });
  }

  public start(city: City) {
    this.stop();
    this.city = city;
    WebsocketClient.sendMessage({ event: "requestCityStrikeTargets", cityName: city.getName() });
  }

  public isAiming(): boolean {
    return this.city !== undefined;
  }

  // Mirrors server City.canStrikeAt(), with the reach taken from the server's list.
  public canStrike(tile: Tile | undefined): boolean {
    if (!tile || !this.city?.canStrike() || !this.rangeTiles.includes(tile)) return false;

    return tile.getUnits().some((unit) => unit.getPlayer() !== this.city.getPlayer() && unit.canFight());
  }

  // Called as the pointer moves onto a new tile: a red line and preview for a target, nothing otherwise.
  public aimAt(tile: Tile | undefined) {
    this.clearAim();
    if (!this.canStrike(tile)) return;

    this.aimedTile = tile;
    this.drawLine(this.city.getTile(), tile);
    WebsocketClient.sendMessage({
      event: "requestCityStrikePreview",
      cityName: this.city.getName(),
      targetX: tile.getGridX(),
      targetY: tile.getGridY()
    });
  }

  public fire(tile: Tile) {
    WebsocketClient.sendMessage({
      event: "cityStrike",
      cityName: this.city.getName(),
      targetX: tile.getGridX(),
      targetY: tile.getGridY()
    });
    this.stop();
  }

  public stop() {
    this.clearAim();
    for (const overlay of this.overlays) Game.getInstance().getCurrentScene().removeActor(overlay);
    this.overlays = [];
    this.rangeTiles = [];
    this.city = undefined;
  }

  private setTargets(data: CityStrikeTargetsEvent) {
    if (!this.city || this.city.getName() !== data.cityName) return;

    const tiles = GameMap.getInstance().getTiles();
    this.rangeTiles = data.tiles.map(({ x, y }) => tiles[x]?.[y]).filter(Boolean);
    this.overlays = RangedAiming.tintTiles(this.rangeTiles, (tile) => this.canStrike(tile));
  }

  private showPreview(data: CombatPreviewEvent) {
    if (!this.city || data.attackerCity !== this.city.getName()) return;

    const target = this.aimedTile;
    if (!target || target.getGridX() !== data.targetX || target.getGridY() !== data.targetY) return;

    const defender = target.getUnits().find((unit) => unit.getID() === data.defenderId);
    if (!defender) return;

    this.hidePreview();
    this.previewWindow = new CombatPreviewWindow(
      CombatPreviewWindow.citySide(this.city),
      CombatPreviewWindow.unitSide(defender),
      data
    );
    Game.getInstance().getCurrentScene().addActor(this.previewWindow);
  }

  private drawLine(from: Tile, to: Tile) {
    const start = from.getCenterPosition();
    const end = to.getCenterPosition();
    this.line = new Line({
      color: "red",
      girth: 2,
      z: 3,
      x1: start.x,
      y1: start.y,
      x2: start.x + MapWrap.shortestDeltaX(start.x, end.x),
      y2: end.y
    });
    Game.getInstance().getCurrentScene().addLine(this.line);
  }

  private clearAim() {
    this.aimedTile = undefined;
    this.hidePreview();
    if (!this.line) return;

    Game.getInstance().getCurrentScene().removeLine(this.line);
    this.line = undefined;
  }

  private hidePreview() {
    if (!this.previewWindow) return;

    Game.getInstance().getCurrentScene().removeActor(this.previewWindow);
    this.previewWindow = undefined;
  }
}
