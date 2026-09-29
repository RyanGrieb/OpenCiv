import { BuildingData } from "../../../city/Building";
import { Strings } from "../../../util/Strings";
import { Tooltip, TooltipLine } from "../../components/Tooltip";

/**
 * Shown beside a building or wonder in the production and purchase lists while the mouse is over it:
 * what the city gets once it's built, and what it costs to keep up. The server sends the numbers.
 */
export class BuildingTooltip extends Tooltip {
  private static readonly BONUS_COLOR = "#8ee07a";
  private static readonly UPKEEP_COLOR = "#ff8a80";
  private static readonly WONDER_COLOR = "#f0c850";

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

    const bonuses = BuildingTooltip.getBonuses(building);
    if (bonuses.length === 0) lines.push({ text: "No bonuses", color: "gray", indent: true });
    bonuses.forEach((text) => lines.push({ text, color: BuildingTooltip.BONUS_COLOR, indent: true }));

    if (building.maintenance) {
      lines.push({
        text: `-${building.maintenance} Gold per turn upkeep`,
        color: BuildingTooltip.UPKEEP_COLOR,
        indent: true
      });
    }
    return lines;
  }

  private static getWonderText(building: BuildingData): string | undefined {
    if (building.is_wonder) return "Great Wonder: only one in the world";
    if (building.national_wonder) return "National Wonder: one per civilization";
    return undefined;
  }

  // "+3 Food", "+5 Defense", "+25 City Health"
  private static getBonuses(building: BuildingData): string[] {
    const bonuses = building.stats
      .flatMap((stat) => Object.entries(stat))
      .filter(([, value]) => value !== 0)
      .map(([stat, value]) => `${Strings.convertToStatUnit(value)} ${Strings.capitalizeWords(stat)}`);

    if (building.city_health) bonuses.push(`+${building.city_health} City Health`);
    return bonuses;
  }
}
