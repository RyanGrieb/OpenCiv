import { Strings } from "../../util/Strings";
import { Tooltip, TooltipLine } from "../components/Tooltip";
import { GoldEntry } from "./GoldTooltip";

// Sent by the server with every updateTotalStats (see server PlayerReligion.getFaithBreakdown()).
export interface FaithBreakdown {
  income: GoldEntry[];
  net: number;
}

/**
 * The box that drops down from the status bar's faith while the mouse is over it: where the faith
 * comes from each turn, laid out like the gold tooltip. The religion itself is in the faith button's window.
 */
export class FaithTooltip extends Tooltip {
  private static readonly INCOME_COLOR = "#8ee07a";

  /** Builds the tooltip with its top-left corner at (x, y). */
  public static async create(x: number, y: number, breakdown: FaithBreakdown): Promise<FaithTooltip> {
    const tooltip = new FaithTooltip(x, y);
    await tooltip.layout(FaithTooltip.getLines(breakdown));
    return tooltip;
  }

  private static getLines(breakdown: FaithBreakdown): TooltipLine[] {
    const lines: TooltipLine[] = [{ text: "Income", color: "white" }];

    if (breakdown.income.length === 0) lines.push({ text: "None", color: "gray", indent: true });
    breakdown.income.forEach((entry) =>
      lines.push({ text: `+${entry.amount} from ${entry.source}`, color: FaithTooltip.INCOME_COLOR, indent: true })
    );

    lines.push({ text: `${Strings.convertToStatUnit(breakdown.net)} faith per turn`, color: "white" });
    return lines;
  }
}
