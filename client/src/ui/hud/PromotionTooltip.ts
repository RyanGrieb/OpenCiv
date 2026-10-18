import { Game } from "../../Game";
import { PromotionInfo } from "../../Unit";
import { Tooltip, TooltipLine } from "../components/Tooltip";

/** A promotion's name and what it does, shown while the mouse is over its icon or button. */
export class PromotionTooltip extends Tooltip {
  private static readonly EFFECT_COLOR = "#8ee07a";
  // Only one promotion tooltip shows at a time. Building one is async, so each show() is numbered and
  // only the latest one gets on screen.
  private static shown: PromotionTooltip | undefined;
  private static latestShow = 0;

  /**
   * Builds the tooltip with its bottom-right corner at (right, bottom), so it sits above and to the left
   * of whatever it describes.
   */
  public static async create(right: number, bottom: number, promotion: PromotionInfo): Promise<PromotionTooltip> {
    const tooltip = new PromotionTooltip(right, bottom, 11);
    await tooltip.layout(PromotionTooltip.getLines(promotion), "bottomRight");
    return tooltip;
  }

  /** Shows the tooltip for `promotion` in place of any other, its bottom-right corner at (right, bottom). */
  public static async show(right: number, bottom: number, promotion: PromotionInfo) {
    const show = ++PromotionTooltip.latestShow;
    const tooltip = await PromotionTooltip.create(right, bottom, promotion);
    if (show !== PromotionTooltip.latestShow) return;

    PromotionTooltip.removeShown();
    PromotionTooltip.shown = tooltip;
    Game.getInstance().getCurrentScene().addActor(tooltip);
  }

  public static hide() {
    PromotionTooltip.latestShow++;
    PromotionTooltip.removeShown();
  }

  private static removeShown() {
    if (!PromotionTooltip.shown) return;

    Game.getInstance().getCurrentScene().removeActor(PromotionTooltip.shown);
    PromotionTooltip.shown = undefined;
  }

  private static getLines(promotion: PromotionInfo): TooltipLine[] {
    const lines: TooltipLine[] = [
      { text: promotion.displayName, color: "white" },
      { text: promotion.description, color: PromotionTooltip.EFFECT_COLOR, indent: true }
    ];
    if (promotion.notYet.length > 0) lines.push({ text: "Not in the game yet:", color: "gray" });
    promotion.notYet.forEach((text) => lines.push({ text, color: "gray", indent: true }));
    return lines;
  }
}
