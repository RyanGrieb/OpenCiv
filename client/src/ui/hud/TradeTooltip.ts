import { YieldText } from "../components/YieldText";
import { Tooltip, TooltipLine } from "../components/Tooltip";
import { TradeRouteData } from "../windows/TradeRouteList";

// Sent by the server with every updateTotalStats (see server PlayerTradeRoutes.getSummary()).
export interface TradeSummary {
  slots: number;
  routes: TradeRouteData[];
}

/**
 * The box that drops down from the status bar's trade routes while the mouse is over it: each running
 * route, where it goes, what it carries and what both ends get, and how many more there's room for.
 */
export class TradeTooltip extends Tooltip {
  private static readonly YIELD_COLOR = "#8ee07a";
  private static readonly KIND_NAMES: Record<string, string> = { gold: "Gold", food: "Food", production: "Production" };

  /** Builds the tooltip with its top-left corner at (x, y). */
  public static async create(x: number, y: number, summary: TradeSummary): Promise<TradeTooltip> {
    const tooltip = new TradeTooltip(x, y);
    await tooltip.layout(TradeTooltip.getLines(summary));
    return tooltip;
  }

  private static getLines(summary: TradeSummary): TooltipLine[] {
    const lines: TooltipLine[] = [
      { text: `Trade Routes: ${summary.routes.length} of ${summary.slots}`, color: "white" }
    ];

    if (summary.routes.length === 0) lines.push({ text: "None running", color: "gray" });
    summary.routes.forEach((route) => {
      const kind = TradeTooltip.KIND_NAMES[route.kind] ?? route.kind;
      const place = route.kind === "gold" ? `${route.cityName} (${route.civilization})` : route.cityName;
      lines.push({ text: `${route.originName} to ${place}: ${kind}, ${route.turns} turns left`, color: "white" });
      lines.push({ text: TradeTooltip.getYields(route), color: TradeTooltip.YIELD_COLOR });
    });

    const free = summary.slots - summary.routes.length;
    if (free > 0) {
      lines.push({
        text: `${free} more can be set up with a Caravan or Cargo Ship`,
        color: "gray"
      });
    }
    return lines;
  }

  // "+4 !{gold}+1 !{science} for Rome, +2 !{gold} for Athens"
  private static getYields(route: TradeRouteData): string {
    return [
      { name: route.originName, text: YieldText.of([route.origin]) },
      { name: route.cityName, text: YieldText.of([route.destination]) }
    ]
      .filter((end) => end.text !== "")
      .map((end) => `${end.text} for ${end.name}`)
      .join(", ");
  }
}
