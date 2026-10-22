import { GameImage, SpriteRegion } from "../../Assets";
import { Game } from "../../Game";
import { NetworkEvents, WebsocketClient } from "../../network/Client";
import { Actor } from "../../scene/Actor";
import { Label } from "../components/Label";
import { ListBox } from "../components/Listbox";
import { YieldText } from "../components/YieldText";
import { UITheme } from "../UITheme";

export type TradeRouteKind = "gold" | "food" | "production";

// One route, on offer or running, as the server's PlayerTradeRoutes.toJSON() sends it.
export interface TradeRouteData {
  cityName: string;
  civilization: string;
  kind: TradeRouteKind;
  sea: boolean;
  turns: number;
  // What the origin and the destination each get every turn.
  origin: Record<string, number>;
  destination: Record<string, number>;
  // Only on running routes.
  originName?: string;
}

// The server's "tradeRouteOptions": the routes the unit could set up from its city, and those already running.
export interface TradeRouteOptionsEvent {
  unitId: number;
  originName: string;
  slots: number;
  used: number;
  options: TradeRouteData[];
  routes: TradeRouteData[];
}

/**
 * Brave New World's trade route picker, opened from a Caravan's or Cargo Ship's Establish Trade Route,
 * down the left of the screen like the pantheon list: every city the unit can reach from its own,
 * each with what both ends get on the line below. Clicking one sets the route up. The routes already
 * running are listed below. The server decides what's on offer and whether it goes through (see
 * server PlayerTradeRoutes).
 */
export class TradeRouteList extends ListBox {
  private static readonly WIDTH = 560;
  private static readonly ROW_HEIGHT = 84;
  private static readonly TITLE_HEIGHT = 44;
  private static readonly PADDING = 8;
  private static readonly LINE_GAP = 8;
  private static readonly YIELD_COLOR = "#8ee07a";
  private static readonly RUNNING_COLOR = "gray";
  private static readonly KIND_NAMES: Record<TradeRouteKind, string> = {
    gold: "Gold",
    food: "Food",
    production: "Production"
  };

  private unitId: number;
  private onChosen: () => void;
  private onClose: () => void;
  private options: TradeRouteData[];

  constructor(options: { unitId: number; onChosen: () => void; onClose: () => void }) {
    super({
      x: 0,
      y: UITheme.STATUS_BAR_HEIGHT,
      width: TradeRouteList.WIDTH,
      height: Game.getInstance().getHeight() - UITheme.STATUS_BAR_HEIGHT,
      rowHeight: TradeRouteList.ROW_HEIGHT,
      textFont: UITheme.FONT,
      fontColor: "white"
    });

    this.unitId = options.unitId;
    this.onChosen = options.onChosen;
    this.onClose = options.onClose;
    this.options = [];

    NetworkEvents.on<TradeRouteOptionsEvent>({
      eventName: "tradeRouteOptions",
      parentObject: this,
      callback: (data) => {
        if (data.unitId === this.unitId) this.build(data);
      }
    });

    WebsocketClient.sendMessage({ event: "requestTradeRoutes", unitId: this.unitId });
  }

  // "Athens (Greece)" for another civilization's city, "Antium (Food)" for one of the player's own.
  private static getName(route: TradeRouteData, own: boolean): string {
    const detail = own ? TradeRouteList.KIND_NAMES[route.kind] : route.civilization;
    return `${route.cityName} (${detail})${route.sea ? " by sea" : ""}`;
  }

  // "+4 !{gold} +1 !{science} for Rome, +2 !{gold} for Athens", leaving out an end that gets nothing.
  private static getYields(route: TradeRouteData, originName: string): string {
    return [
      { name: originName, stats: route.origin },
      { name: route.cityName, stats: route.destination }
    ]
      .map((end) => ({ ...end, text: YieldText.of([end.stats]) }))
      .filter((end) => end.text !== "")
      .map((end) => `${end.text} for ${end.name}`)
      .join(", ");
  }

  public getOptionNames(): string[] {
    return this.options.map((route) => `${route.cityName}:${route.kind}`);
  }

  /** Sets the route up, as clicking its row would. For scenarios. */
  public choose(cityName: string, kind: TradeRouteKind): boolean {
    const route = this.options.find((option) => option.cityName === cityName && option.kind === kind);
    if (!route) return false;

    WebsocketClient.sendMessage({ event: "establishTradeRoute", unitId: this.unitId, cityName, kind });
    this.onChosen();
    return true;
  }

  public onDestroyed(): void {
    NetworkEvents.removeCallbacksByParentObject(this);
    super.onDestroyed();
  }

  private build(data: TradeRouteOptionsEvent) {
    this.clearRows();
    this.options = data.options;

    const own = (route: TradeRouteData) => route.kind !== "gold";
    this.addClosableTitle(
      `Trade Routes from ${data.originName} (${data.used}/${data.slots})`,
      TradeRouteList.TITLE_HEIGHT,
      this.onClose
    );
    data.options.forEach((route) => {
      const row = this.addRouteRow(
        TradeRouteList.getName(route, own(route)),
        TradeRouteList.getYields(route, data.originName),
        TradeRouteList.YIELD_COLOR
      );
      row.on("clicked", () => this.choose(route.cityName, route.kind));
      row.on("mousemove", () => {
        if (row.isMouseInside()) Game.getInstance().setCursor("pointer");
      });
      row.on("mouse_exit", () => Game.getInstance().setCursor("default"));
    });

    if (data.routes.length === 0) return;

    this.addCategory("Running Routes", TradeRouteList.TITLE_HEIGHT);
    data.routes.forEach((route) =>
      this.addRouteRow(
        `${route.originName} to ${route.cityName}, ${route.turns} turns left`,
        TradeRouteList.getYields(route, route.originName),
        TradeRouteList.RUNNING_COLOR
      )
    );
  }

  private addRouteRow(name: string, yields: string, yieldColor: string) {
    const { x: rowX, y: rowY } = this.getNextRowPosition();
    const textX = rowX + TradeRouteList.PADDING + UITheme.ICON_SIZE + TradeRouteList.PADDING;
    const nameY = rowY + TradeRouteList.PADDING + 4;
    const yieldsY = nameY + UITheme.FONT_SIZE + TradeRouteList.LINE_GAP;

    return this.addRow({
      text: name,
      textX,
      textY: nameY,
      rowHeight: TradeRouteList.ROW_HEIGHT,
      actorIcons: [
        new Actor({
          image: Game.getInstance().getImage(GameImage.SPRITESHEET),
          spriteRegion: SpriteRegion.ICON_TRADE,
          x: rowX + TradeRouteList.PADDING,
          y: rowY + TradeRouteList.ROW_HEIGHT / 2 - UITheme.ICON_SIZE / 2,
          width: UITheme.ICON_SIZE,
          height: UITheme.ICON_SIZE,
          cameraApplies: false
        }),
        new Label({ text: yields, x: textX, y: yieldsY, font: UITheme.FONT, fontColor: yieldColor })
      ]
    });
  }
}
