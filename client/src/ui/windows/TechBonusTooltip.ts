import { BuildingData } from "../../city/Building";
import { Tooltip, TooltipLine } from "../components/Tooltip";
import { YieldText } from "../components/YieldText";
import { BuildingTooltip } from "./city/BuildingTooltip";

export type TechBonusKind = "unit" | "building" | "wonder" | "improvement" | "note";

// One icon in a tech's bonus row, as the server describes it (server/src/research/TechBonuses.ts).
export interface TechBonusData {
  name: string;
  asset_name?: string;
  kind: TechBonusKind;
  building?: BuildingData;
  stats?: Record<string, number>[];
  lines?: string[];
}

/**
 * Shown under a bonus icon on a research tree button while the mouse is over it. Buildings and wonders
 * get the production list's BuildingTooltip; units and improvements their name, kind and the server's
 * lines about them; a note is just its own words.
 */
export class TechBonusTooltip extends Tooltip {
  private static readonly KIND_COLOR = "#f0c850";
  private static readonly KIND_TEXT: Partial<Record<TechBonusKind, string>> = {
    unit: "Unit",
    improvement: "Tile Improvement"
  };

  /** Builds the tooltip with its top-left corner at (x, y). */
  public static async create(x: number, y: number, bonus: TechBonusData): Promise<Tooltip> {
    if (bonus.building) return BuildingTooltip.create(x, y, bonus.building);

    const tooltip = new TechBonusTooltip(x, y);
    await tooltip.layout(TechBonusTooltip.getLines(bonus));
    return tooltip;
  }

  private static getLines(bonus: TechBonusData): TooltipLine[] {
    const lines: TooltipLine[] = [{ text: bonus.name, color: "white" }];

    const kind = TechBonusTooltip.KIND_TEXT[bonus.kind];
    if (kind) lines.push({ text: kind, color: TechBonusTooltip.KIND_COLOR });

    const yields = YieldText.of(bonus.stats ?? []);
    if (yields) lines.push({ text: yields, color: "white" });

    (bonus.lines ?? []).forEach((text) => lines.push({ text, color: "white" }));
    return lines;
  }
}
