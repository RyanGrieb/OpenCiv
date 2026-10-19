import { Game } from "../../Game";
import { CityReligionInfo } from "../../religion/Religions";
import { Tooltip, TooltipLine } from "../components/Tooltip";

/** Shown while the mouse is over a city's religion icon: how many of its citizens follow each religion. */
export class CityReligionTooltip extends Tooltip {
  private static readonly RELIGION_COLOR = "#f0c850";
  private static readonly MOUSE_OFFSET = 12;
  // Only one shows at a time. Building one is async, so each show() is numbered and only the latest
  // one gets on screen.
  private static shown: CityReligionTooltip | undefined;
  private static latestShow = 0;

  /** Builds the tooltip with its top-left corner at (x, y). */
  public static async create(x: number, y: number, cityName: string, info: CityReligionInfo) {
    const tooltip = new CityReligionTooltip(x, y, 11);
    await tooltip.layout(CityReligionTooltip.getLines(cityName, info));
    return tooltip;
  }

  /** Shows the city's tooltip in place of any other, just below and right of the mouse. */
  public static async show(cityName: string, info: CityReligionInfo) {
    const show = ++CityReligionTooltip.latestShow;
    const dpr = window.devicePixelRatio || 1;
    const x = Game.getInstance().getMouseX() * dpr + CityReligionTooltip.MOUSE_OFFSET;
    const y = Game.getInstance().getMouseY() * dpr + CityReligionTooltip.MOUSE_OFFSET;
    const tooltip = await CityReligionTooltip.create(x, y, cityName, info);
    if (show !== CityReligionTooltip.latestShow) return;

    CityReligionTooltip.removeShown();
    CityReligionTooltip.shown = tooltip;
    Game.getInstance().getCurrentScene().addActor(tooltip);
  }

  public static hide() {
    CityReligionTooltip.latestShow++;
    CityReligionTooltip.removeShown();
  }

  private static removeShown() {
    if (!CityReligionTooltip.shown) return;

    Game.getInstance().getCurrentScene().removeActor(CityReligionTooltip.shown);
    CityReligionTooltip.shown = undefined;
  }

  private static getLines(cityName: string, info: CityReligionInfo): TooltipLine[] {
    const title = info.majority ? `${cityName} follows ${info.majority}` : `${cityName} follows no religion`;
    const lines: TooltipLine[] = [{ text: title, color: "white" }];

    Object.entries(info.followers)
      .sort((a, b) => b[1] - a[1])
      .forEach(([religion, count]) =>
        lines.push({
          text: `${religion}: ${CityReligionTooltip.citizens(count)}`,
          color: CityReligionTooltip.RELIGION_COLOR,
          indent: true
        })
      );
    if (info.nonFollowers > 0) {
      lines.push({
        text: `No religion: ${CityReligionTooltip.citizens(info.nonFollowers)}`,
        color: "gray",
        indent: true
      });
    }
    return lines;
  }

  private static citizens(count: number): string {
    return count === 1 ? "1 citizen" : `${count} citizens`;
  }
}
