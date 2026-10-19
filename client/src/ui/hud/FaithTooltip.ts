import { Tooltip, TooltipLine } from "../components/Tooltip";

// Sent by the server with every updateTotalStats (see server PlayerReligion.getFaithBreakdown()).
export interface FaithBreakdown {
  pantheon: { name: string; description: string } | null;
  pantheonCost: number;
  pantheonsLeft: number;
}

/**
 * The box that drops down from the status bar's faith while the mouse is over it: the pantheon the
 * player founded, or the faith the next one costs.
 */
export class FaithTooltip extends Tooltip {
  private static readonly BONUS_COLOR = "#8ee07a";

  /** Builds the tooltip with its top-left corner at (x, y). */
  public static async create(x: number, y: number, faith: number, breakdown: FaithBreakdown): Promise<FaithTooltip> {
    const tooltip = new FaithTooltip(x, y);
    await tooltip.layout(FaithTooltip.getLines(faith, breakdown));
    return tooltip;
  }

  private static getLines(faith: number, breakdown: FaithBreakdown): TooltipLine[] {
    if (breakdown.pantheon) {
      return [
        { text: `Pantheon: ${breakdown.pantheon.name}`, color: "white" },
        { text: breakdown.pantheon.description, color: FaithTooltip.BONUS_COLOR }
      ];
    }
    if (breakdown.pantheonsLeft < 1) return [{ text: "Every pantheon has been founded", color: "gray" }];

    return [
      { text: "No pantheon yet", color: "white" },
      { text: `Found one at ${breakdown.pantheonCost} Faith (you have ${faith})`, color: "white" }
    ];
  }
}
