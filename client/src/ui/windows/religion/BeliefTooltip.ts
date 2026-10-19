import { BeliefData } from "../../../religion/Religions";
import { Tooltip, TooltipLine } from "../../components/Tooltip";

/**
 * Shown beside a pantheon or belief in its list while the mouse is over it, laid out like a building's
 * tooltip: the name, its yields as icons, the bonus in words, and what the game can't do yet.
 */
export class BeliefTooltip extends Tooltip {
  private static readonly BONUS_COLOR = "#8ee07a";
  private static readonly NOT_YET_COLOR = "gray";

  /** Builds the tooltip with its top-left corner at (x, y). */
  public static async create(x: number, y: number, belief: BeliefData): Promise<BeliefTooltip> {
    const tooltip = new BeliefTooltip(x, y);
    await tooltip.layout(BeliefTooltip.getLines(belief));
    return tooltip;
  }

  private static getLines(belief: BeliefData): TooltipLine[] {
    const lines: TooltipLine[] = [{ text: belief.name, color: "white" }];

    const yields = Tooltip.getYields([belief.yields ?? {}]);
    if (yields.length > 0) lines.push({ text: "", color: "white", yields });

    lines.push({ text: belief.description, color: BeliefTooltip.BONUS_COLOR });

    const notYet = belief.not_yet ?? [];
    if (notYet.length > 0) lines.push({ text: "Not in the game yet:", color: BeliefTooltip.NOT_YET_COLOR });
    notYet.forEach((text) => lines.push({ text, color: BeliefTooltip.NOT_YET_COLOR }));

    return lines;
  }
}
