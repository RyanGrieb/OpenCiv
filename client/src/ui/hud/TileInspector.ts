import { Game } from "../../Game";
import { GameMap } from "../../map/GameMap";
import { Tile } from "../../map/Tile";
import { NetworkEvents, WebsocketClient } from "../../network/Client";
import { Scene } from "../../scene/Scene";
import { TileInfo, TileTooltip } from "./TileTooltip";

/**
 * Middle-clicking a tile asks the server what it yields and why, and shows the answer in a
 * TileTooltip by the mouse. Any other click, or moving onto another tile, closes it.
 */
export class TileInspector {
  private static readonly MIDDLE_BUTTON = 1;
  private static readonly MOUSE_OFFSET = 16;

  private scene: Scene;
  private hoveredTile?: Tile;
  private inspectedTile?: Tile;
  private tooltip?: TileTooltip;
  private info?: TileInfo;
  private position = { x: 0, y: 0 };
  // Bumped on every open and close, so a tooltip still being laid out when it's closed is dropped.
  private build = 0;

  constructor(scene: Scene) {
    this.scene = scene;

    scene.on("tileHovered", (options) => {
      this.hoveredTile = options.tile;
      if (options.tile !== this.inspectedTile) this.close();
    });
    scene.on("mousedown", (options) => {
      this.close();
      if (options.button !== TileInspector.MIDDLE_BUTTON || !this.hoveredTile) return;
      this.inspect(this.hoveredTile, options.x, options.y);
    });
    NetworkEvents.on<TileInfo>({
      eventName: "tileInfo",
      parentObject: this,
      callback: (info) => this.show(info)
    });
  }

  /** Asks the server about the tile, opening the tooltip at screen (x, y) when it answers. */
  public inspect(tile: Tile, x: number, y: number) {
    this.close();
    this.inspectedTile = tile;
    this.position = { x: x + TileInspector.MOUSE_OFFSET, y: y + TileInspector.MOUSE_OFFSET };
    WebsocketClient.sendMessage({ event: "requestTileInfo", x: tile.getGridX(), y: tile.getGridY() });
  }

  public getTooltip(): TileTooltip | undefined {
    return this.tooltip;
  }

  // What the server last said about the tile the tooltip is open on.
  public getInfo(): TileInfo | undefined {
    return this.tooltip ? this.info : undefined;
  }

  public close() {
    this.build++;
    this.inspectedTile = undefined;
    if (!this.tooltip) return;

    this.scene.removeActor(this.tooltip);
    this.tooltip = undefined;
  }

  private async show(info: TileInfo) {
    const tile = GameMap.getInstance().getTiles()[info.x]?.[info.y];
    if (!tile || tile !== this.inspectedTile) return;

    const build = this.build;
    const tooltip = await TileTooltip.create(this.position.x, this.position.y, tile, info);
    if (build !== this.build || Game.getInstance().getCurrentScene() !== this.scene) return;

    this.tooltip = tooltip;
    this.info = info;
    this.scene.addActor(tooltip);
  }
}
