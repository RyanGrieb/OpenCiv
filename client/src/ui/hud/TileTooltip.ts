import { Tile } from "../../map/Tile";
import { Tooltip, TooltipLine } from "../components/Tooltip";
import { YieldText } from "../components/YieldText";

// One thing adding to a tile's yields, e.g. { source: "Wheat", stats: [{ food: 1 }] }.
export interface TileYieldSource {
  source: string;
  stats: Record<string, number>[];
}

// The server's answer to requestTileInfo (see InGameState). The server works it out; this only shows it.
export interface TileInfo {
  x: number;
  y: number;
  sources: TileYieldSource[];
  yields: Record<string, number>[];
  cityName?: string;
  worked: boolean;
}

/**
 * Opened by middle-clicking a tile: what the tile is, which city's it is, what it yields and what
 * each of those yields comes from (terrain, feature, resource, improvement, techs, buildings).
 */
export class TileTooltip extends Tooltip {
  private static readonly SOURCE_COLOR = "#8ee07a";
  private static readonly CITY_COLOR = "#f0c850";
  /** Builds the tooltip with its top-left corner at (x, y). */
  public static async create(x: number, y: number, tile: Tile, info: TileInfo): Promise<TileTooltip> {
    const tooltip = new TileTooltip(x, y);
    await tooltip.layout(TileTooltip.getLines(tile, info));
    return tooltip;
  }

  private static getLines(tile: Tile, info: TileInfo): TooltipLine[] {
    const names = tile.getTileTypes().map((type) => Tile.getTileTypeName(type));
    if (tile.hasRiver()) names.push("River");
    const lines: TooltipLine[] = [{ text: names.join(", "), color: "white" }];

    if (info.cityName) {
      const worked = info.worked ? "worked" : "not worked";
      lines.push({ text: `${info.cityName}'s territory, ${worked}`, color: TileTooltip.CITY_COLOR });
    }

    if (info.sources.length === 0) lines.push({ text: "No yields", color: "gray" });
    info.sources.forEach((source) =>
      lines.push({ text: `${source.source} ${YieldText.of(source.stats)}`, color: TileTooltip.SOURCE_COLOR })
    );

    if (info.sources.length > 0) lines.push({ text: `Total ${YieldText.of(info.yields)}`, color: "white" });
    return lines;
  }
}
