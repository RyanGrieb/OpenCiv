import { GameImage } from "../../../Assets";
import { Game } from "../../../Game";
import { City, ProductionQueueItem } from "../../../city/City";
import { WebsocketClient } from "../../../network/Client";
import { Actor } from "../../../scene/Actor";
import { ListBox } from "../../components/Listbox";
import { Button } from "../../components/Button";
import { UITheme } from "../../UITheme";
import { CityScreen } from "./CityScreen";

// Takes the stats window's place while the player picks something to add to the production queue.
// Clicking a row queues it; the gold price on its right buys it outright instead.
export class ChooseProductionList extends ListBox {
  private static readonly BUY_BUTTON_WIDTH = 100;

  private city: City;
  private onChosen: () => void;

  constructor(options: {
    city: City;
    units: ProductionQueueItem[];
    buildings: ProductionQueueItem[];
    onChosen: () => void;
  }) {
    super({
      x: 0,
      y: UITheme.STATUS_BAR_HEIGHT,
      width: CityScreen.STATS_WINDOW_WIDTH,
      // Fills the space down to the top of the production queue window.
      height: Game.getInstance().getHeight() - UITheme.STATUS_BAR_HEIGHT - CityScreen.PRODUCTION_WINDOW_HEIGHT,
      textFont: UITheme.FONT,
      fontColor: "white"
    });

    this.city = options.city;
    this.onChosen = options.onChosen;

    this.addCategory("Units");
    for (const unit of options.units) {
      this.addOptionRow(unit);
    }

    this.addCategory("Buildings");
    for (const building of options.buildings) {
      this.addOptionRow(building);
    }
  }

  private addOptionRow(option: ProductionQueueItem) {
    const rowX = this.getNextRowPosition().x;
    const rowY = this.getNextRowPosition().y;
    const rowHeight = CityScreen.PRODUCTION_ROW_HEIGHT;
    const textX = rowX + 8 + UITheme.ICON_SIZE + 8;
    const buyButton = this.createBuyButton(option, rowX, rowY);

    const row = this.addRow({
      text: option.name,
      textX: textX,
      maxWidth: CityScreen.STATS_WINDOW_WIDTH - (textX - rowX) - ChooseProductionList.BUY_BUTTON_WIDTH - 16,
      centerTextY: true,
      rowHeight: rowHeight,
      actorIcons: [
        ...(buyButton ? [buyButton] : []),
        new Actor({
          image: Game.getInstance().getImage(GameImage.SPRITESHEET),
          spriteRegion: CityScreen.resolveProductionIcon(option),
          x: rowX + 8,
          y: rowY + rowHeight / 2 - UITheme.ICON_SIZE / 2,
          z: CityScreen.Z,
          width: UITheme.ICON_SIZE,
          height: UITheme.ICON_SIZE,
          cameraApplies: false
        })
      ]
    });

    row.on("clicked", () => {
      // The buy button sits on the row, so its clicks reach the row too.
      if (buyButton?.isMouseInside()) return;

      WebsocketClient.sendMessage({
        event: "addToProductionQueue",
        cityName: this.city.getName(),
        type: option.type,
        name: option.name
      });
      this.onChosen();
    });

    row.on("mousemove", () => {
      if (row.isMouseInside()) {
        Game.getInstance().setCursor("pointer");
      }
    });
    row.on("mouse_exit", () => {
      Game.getInstance().setCursor("default");
    });
  }

  private createBuyButton(option: ProductionQueueItem, rowX: number, rowY: number): Button | undefined {
    if (option.goldCost === undefined) return undefined;

    return CityScreen.createBuyButton({
      item: option,
      x: rowX + CityScreen.STATS_WINDOW_WIDTH - ChooseProductionList.BUY_BUTTON_WIDTH - 8,
      y: rowY + CityScreen.PRODUCTION_ROW_HEIGHT / 2 - CityScreen.BUY_BUTTON_HEIGHT / 2,
      width: ChooseProductionList.BUY_BUTTON_WIDTH,
      onBuy: () => {
        WebsocketClient.sendMessage({
          event: "purchaseProductionOption",
          cityName: this.city.getName(),
          type: option.type,
          name: option.name
        });
        this.onChosen();
      }
    });
  }
}
