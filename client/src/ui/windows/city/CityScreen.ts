import { resolveSpriteRegion, SpriteRegion } from "../../../Assets";
import { Game } from "../../../Game";
import { ProductionQueueItem } from "../../../city/City";
import { InGameScene } from "../../../scene/type/InGameScene";
import { Strings } from "../../../util/Strings";
import { Button } from "../../components/Button";

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
  public static readonly BUY_BUTTON_HEIGHT = 40;

  // e.g. UNIT_WORK_BOAT for the Work Boat - names with spaces need them as underscores.
  public static resolveProductionIcon(item: ProductionQueueItem): SpriteRegion {
    const region = `${Strings.toConstantCase(item.type)}_${Strings.toConstantCase(item.name)}`;
    return resolveSpriteRegion(region) ?? SpriteRegion.ICON_UNKNOWN;
  }

  /**
   * A button showing the gold price of `item` (which must have a goldCost), e.g. "190" beside the gold
   * icon. While the player can't afford it, its text is grey and clicking it does nothing.
   */
  public static createBuyButton(options: {
    item: ProductionQueueItem;
    label?: string;
    x: number;
    y: number;
    width: number;
    onBuy: () => void;
  }): Button {
    const gold = Game.getInstance().getCurrentSceneAs<InGameScene>().getClientPlayer().getAccumulatedStat("gold");
    const affordable = gold >= options.item.goldCost;
    const price = `${options.item.goldCost}`;

    return new Button({
      text: options.label ? `${options.label} ${price}` : price,
      icon: SpriteRegion.ICON_GOLD,
      iconPosition: "right",
      x: options.x,
      y: options.y,
      z: CityScreen.Z,
      width: options.width,
      height: CityScreen.BUY_BUTTON_HEIGHT,
      fontColor: affordable ? "white" : "gray",
      onClicked: () => {
        if (affordable) options.onBuy();
      }
    });
  }

  // "1 turn", "3 turns"
  public static turnsText(turns: number): string {
    return `${turns} turn${turns === 1 ? "" : "s"}`;
  }
}
