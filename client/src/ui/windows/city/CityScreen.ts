import { resolveSpriteRegion, SpriteRegion } from "../../../Assets";
import { ProductionQueueItem } from "../../../city/City";
import { Strings } from "../../../util/Strings";

// Layout constants and helpers shared by the city screen's windows.
export class CityScreen {
  public static readonly Z = 6;

  public static readonly STATS_WINDOW_WIDTH = 320;
  // Vertical space a progress readout (one text line plus its bar) claims. The growth and border
  // readouts stack under the Population row, and every stat row below shifts down by both.
  public static readonly READOUT_ROW_HEIGHT = 56;
  public static readonly READOUT_BAR_HEIGHT = 12;
  public static readonly STATS_WINDOW_HEIGHT = 390 + CityScreen.READOUT_ROW_HEIGHT;

  public static readonly BUILDINGS_WINDOW_WIDTH = 340;

  public static readonly PRODUCTION_WINDOW_WIDTH = 360;
  public static readonly PRODUCTION_WINDOW_HEIGHT = 320;
  // Two wrapped lines of UITheme.FONT still fit inside a row of this height.
  public static readonly PRODUCTION_ROW_HEIGHT = 56;
  // Right-edge strip reserved for a row's cancel + reorder buttons (cancel sits at
  // -32, the arrows step left by 28 each), so row text wraps before it reaches them.
  public static readonly PRODUCTION_BUTTON_ZONE = 88;

  // e.g. UNIT_WORK_BOAT for the Work Boat - names with spaces need them as underscores.
  public static resolveProductionIcon(item: ProductionQueueItem): SpriteRegion {
    const region = `${Strings.toConstantCase(item.type)}_${Strings.toConstantCase(item.name)}`;
    return resolveSpriteRegion(region) ?? SpriteRegion.ICON_UNKNOWN;
  }

  // "1 turn", "3 turns"
  public static turnsText(turns: number): string {
    return `${turns} turn${turns === 1 ? "" : "s"}`;
  }
}
