import { Strings } from "../../util/Strings";
import { Tooltip, TooltipLine } from "../components/Tooltip";

// One line of the server's gold breakdown, e.g. { source: "Rome", amount: 4 }.
export interface GoldEntry {
  source: string;
  amount: number;
}

// Sent by the server with every updateTotalStats. The server works it out; this only shows it.
export interface GoldBreakdown {
  income: GoldEntry[];
  expenses: GoldEntry[];
  net: number;
}

/**
 * The box that drops down from the status bar's gold while the mouse is over it: where the gold
 * comes from each turn, what it's spent on, and what's left.
 */
export class GoldTooltip extends Tooltip {
  private static readonly INCOME_COLOR = "#8ee07a";
  private static readonly EXPENSE_COLOR = "#ff8a80";

  /** Builds the tooltip with its top-left corner at (x, y). */
  public static async create(x: number, y: number, breakdown: GoldBreakdown): Promise<GoldTooltip> {
    const tooltip = new GoldTooltip(x, y);
    await tooltip.layout(GoldTooltip.getLines(breakdown));
    return tooltip;
  }

  private static getLines(breakdown: GoldBreakdown): TooltipLine[] {
    const lines: TooltipLine[] = [{ text: "Income", color: "white" }];

    if (breakdown.income.length === 0) lines.push({ text: "None", color: "gray", indent: true });
    breakdown.income.forEach((entry) =>
      lines.push({ text: `+${entry.amount} from ${entry.source}`, color: GoldTooltip.INCOME_COLOR, indent: true })
    );

    lines.push({ text: "Expenses", color: "white" });
    if (breakdown.expenses.length === 0) lines.push({ text: "None", color: "gray", indent: true });
    breakdown.expenses.forEach((entry) =>
      lines.push({ text: `-${entry.amount} ${entry.source}`, color: GoldTooltip.EXPENSE_COLOR, indent: true })
    );

    lines.push({ text: `${Strings.convertToStatUnit(breakdown.net)} gold per turn`, color: "white" });
    return lines;
  }
}
