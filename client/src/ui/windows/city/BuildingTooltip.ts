import { BuildingData } from "../../../city/Building";
import { Strings } from "../../../util/Strings";
import { Tooltip, TooltipLine } from "../../components/Tooltip";
import { YieldText } from "../../components/YieldText";

/**
 * Shown beside a building or wonder in the production and purchase lists while the mouse is over it:
 * what the city gets once it's built, and what it costs to keep up. The server sends the numbers and
 * the words for its effects, including the ones the game doesn't have the systems for yet.
 */
export class BuildingTooltip extends Tooltip {
  private static readonly BONUS_COLOR = "#8ee07a";
  private static readonly UPKEEP_COLOR = "#ff8a80";
  private static readonly WONDER_COLOR = "#f0c850";
  private static readonly NOT_YET_COLOR = "gray";

  /** Builds the tooltip with its top-left corner at (x, y). */
  public static async create(x: number, y: number, building: BuildingData): Promise<BuildingTooltip> {
    const tooltip = new BuildingTooltip(x, y);
    await tooltip.layout(BuildingTooltip.getLines(building));
    return tooltip;
  }

  private static getLines(building: BuildingData): TooltipLine[] {
    const lines: TooltipLine[] = [{ text: building.name, color: "white" }];

    const kind = BuildingTooltip.getWonderText(building);
    if (kind) lines.push({ text: kind, color: BuildingTooltip.WONDER_COLOR });

    const yields = YieldText.of([...building.stats, { city_health: building.city_health ?? 0 }]);
    if (yields) lines.push({ text: yields, color: "white" });

    const bonuses = [...BuildingTooltip.getBonuses(building), ...(building.effect_lines ?? [])];
    if (bonuses.length === 0 && !yields) lines.push({ text: "No bonuses", color: "gray" });
    bonuses.forEach((text) => lines.push({ text, color: BuildingTooltip.BONUS_COLOR }));

    if (building.maintenance) {
      lines.push({
        text: `Maintenance ${YieldText.of([{ gold: -building.maintenance }])}`,
        color: BuildingTooltip.UPKEEP_COLOR
      });
    }

    const notYet = building.not_yet ?? [];
    if (notYet.length > 0) lines.push({ text: "Not in the game yet:", color: BuildingTooltip.NOT_YET_COLOR });
    notYet.forEach((text) => lines.push({ text, color: BuildingTooltip.NOT_YET_COLOR }));

    return lines;
  }

  private static getWonderText(building: BuildingData): string | undefined {
    if (building.is_wonder) return "Great Wonder: only one in the world";
    if (building.national_wonder) return "National Wonder: one per civilization";
    return undefined;
  }

  // Any stat without an icon, in words.
  private static getBonuses(building: BuildingData): string[] {
    return building.stats
      .flatMap((stat) => Object.entries(stat))
      .filter(([stat, value]) => value !== 0 && !YieldText.isYieldStat(stat))
      .map(([stat, value]) => `${Strings.convertToStatUnit(value)} ${Strings.capitalizeWords(stat)}`);
  }
}
