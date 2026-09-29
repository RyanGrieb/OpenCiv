import { Strings } from "../../util/Strings";
import { Tooltip, TooltipLine } from "../components/Tooltip";

// One line of the server's happiness breakdown, e.g. { source: "Citrus", amount: 4 }.
export interface HappinessEntry {
  source: string;
  amount: number;
}

export type HappinessStatus = "content" | "unhappy" | "veryUnhappy";

// Sent by the server with every updateTotalStats. The server works it out; this only shows it.
export interface HappinessBreakdown {
  sources: HappinessEntry[];
  unhappiness: HappinessEntry[];
  net: number;
  status: HappinessStatus;
  // What the status costs the empire, e.g. "City growth -75%".
  effects: string[];
}

/**
 * The box that drops down from the status bar's happiness while the mouse is over it: where the
 * empire's happiness comes from, what its cities and citizens cost, and what being unhappy is doing.
 */
export class HappinessTooltip extends Tooltip {
  private static readonly SOURCE_COLOR = "#8ee07a";
  private static readonly UNHAPPINESS_COLOR = "#ff8a80";
  private static readonly UNHAPPY_COLOR = "#f0c850";
  private static readonly STATUS_TEXT: Record<HappinessStatus, string> = {
    content: "Content",
    unhappy: "Unhappy",
    veryUnhappy: "Very Unhappy"
  };

  /** Builds the tooltip with its top-left corner at (x, y). */
  public static async create(x: number, y: number, breakdown: HappinessBreakdown): Promise<HappinessTooltip> {
    const tooltip = new HappinessTooltip(x, y);
    await tooltip.layout(HappinessTooltip.getLines(breakdown));
    return tooltip;
  }

  private static getLines(breakdown: HappinessBreakdown): TooltipLine[] {
    const lines: TooltipLine[] = [{ text: "Happiness", color: "white" }];
    breakdown.sources.forEach((entry) =>
      lines.push({
        text: `${Strings.convertToStatUnit(entry.amount)} ${entry.source}`,
        color: entry.amount < 0 ? HappinessTooltip.UNHAPPINESS_COLOR : HappinessTooltip.SOURCE_COLOR,
        indent: true
      })
    );

    lines.push({ text: "Unhappiness", color: "white" });
    if (breakdown.unhappiness.length === 0) lines.push({ text: "None", color: "gray", indent: true });
    breakdown.unhappiness.forEach((entry) =>
      lines.push({
        text: `-${entry.amount} from ${entry.source}`,
        color: HappinessTooltip.UNHAPPINESS_COLOR,
        indent: true
      })
    );

    const status = HappinessTooltip.STATUS_TEXT[breakdown.status];
    const statusColor = breakdown.status === "content" ? "white" : HappinessTooltip.UNHAPPY_COLOR;
    lines.push({ text: `${Strings.convertToStatUnit(breakdown.net)} Happiness: ${status}`, color: statusColor });
    breakdown.effects.forEach((effect) =>
      lines.push({ text: effect, color: HappinessTooltip.UNHAPPINESS_COLOR, indent: true })
    );
    return lines;
  }
}
