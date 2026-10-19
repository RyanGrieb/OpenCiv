import { PantheonData } from "../../../religion/Pantheons";
import { Tooltip, TooltipLine } from "../../components/Tooltip";

/**
 * Shown beside a pantheon in the pantheon list while the mouse is over it, laid out like a building's
 * tooltip: the name, its yields as icons, the bonus in words, and what the game can't do yet.
 */
export class PantheonTooltip extends Tooltip {
  private static readonly BONUS_COLOR = "#8ee07a";
  private static readonly NOT_YET_COLOR = "gray";

  /** Builds the tooltip with its top-left corner at (x, y). */
  public static async create(x: number, y: number, pantheon: PantheonData): Promise<PantheonTooltip> {
    const tooltip = new PantheonTooltip(x, y);
    await tooltip.layout(PantheonTooltip.getLines(pantheon));
    return tooltip;
  }

  private static getLines(pantheon: PantheonData): TooltipLine[] {
    const lines: TooltipLine[] = [{ text: pantheon.name, color: "white" }];

    const yields = Tooltip.getYields([pantheon.yields ?? {}]);
    if (yields.length > 0) lines.push({ text: "", color: "white", yields });

    lines.push({ text: pantheon.description, color: PantheonTooltip.BONUS_COLOR });

    const notYet = pantheon.not_yet ?? [];
    if (notYet.length > 0) lines.push({ text: "Not in the game yet:", color: PantheonTooltip.NOT_YET_COLOR });
    notYet.forEach((text) => lines.push({ text, color: PantheonTooltip.NOT_YET_COLOR }));

    return lines;
  }
}
