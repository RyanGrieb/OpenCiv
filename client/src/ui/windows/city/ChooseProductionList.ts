import { GameImage, SpriteRegion } from "../../../Assets";
import { Game } from "../../../Game";
import { City, ProductionOptions, ProductionQueueItem } from "../../../city/City";
import { WebsocketClient } from "../../../network/Client";
import { Actor } from "../../../scene/Actor";
import { InGameScene } from "../../../scene/type/InGameScene";
import { Label } from "../../components/Label";
import { ListBox } from "../../components/Listbox";
import { UITheme } from "../../UITheme";
import { CityScreen } from "./CityScreen";

// "produce" lists what the city can queue, with the turns each would take; "purchase" lists what gold
// can buy, with each price.
export type ProductionListMode = "produce" | "purchase";

// Takes the stats window's place while the player picks something to produce or buy. Clicking a row
// queues it or, in the purchase list, buys it.
export class ChooseProductionList extends ListBox {
  // As wide as the queue window below it, which is wider than the stats window this replaces.
  private static readonly WIDTH = CityScreen.PRODUCTION_WINDOW_WIDTH;
  // Right-edge strip for a purchase row's price and gold icon.
  private static readonly PRICE_ZONE = 110;

  private city: City;
  private mode: ProductionListMode;
  private onChosen: () => void;

  constructor(options: {
    city: City;
    mode: ProductionListMode;
    productionOptions: ProductionOptions;
    onChosen: () => void;
  }) {
    super({
      x: 0,
      y: UITheme.STATUS_BAR_HEIGHT,
      width: ChooseProductionList.WIDTH,
      // Fills the space down to the top of the production queue window.
      height: Game.getInstance().getHeight() - UITheme.STATUS_BAR_HEIGHT - CityScreen.PRODUCTION_WINDOW_HEIGHT,
      textFont: UITheme.FONT,
      fontColor: "white"
    });

    this.city = options.city;
    this.mode = options.mode;
    this.onChosen = options.onChosen;

    // Units and Buildings always show, even empty; the wonder sections only when there's one to build.
    const { units, buildings, nationalWonders = [], wonders = [] } = options.productionOptions;
    this.addSection("Units", units);
    this.addSection("Buildings", buildings);
    if (nationalWonders.length > 0) this.addSection("National Wonders", nationalWonders);
    if (wonders.length > 0) this.addSection("Great Wonders", wonders);
  }

  // "Warrior (10 turns)". A no-break space keeps "(10 turns)" together when a long name wraps.
  private static getProduceText(option: ProductionQueueItem): string {
    return `${option.name} (${CityScreen.turnsText(option.turns).replace(" ", " ")})`;
  }

  public getMode(): ProductionListMode {
    return this.mode;
  }

  private addSection(name: string, sectionOptions: ProductionQueueItem[]) {
    this.addCategory(name);
    for (const option of sectionOptions) {
      this.addOptionRow(option);
    }
  }

  private addOptionRow(option: ProductionQueueItem) {
    const rowX = this.getNextRowPosition().x;
    const rowY = this.getNextRowPosition().y;
    const rowHeight = CityScreen.PRODUCTION_ROW_HEIGHT;
    const textX = rowX + 8 + UITheme.ICON_SIZE + 8;
    const purchasing = this.mode === "purchase";
    const affordable = !purchasing || this.getGold() >= option.goldCost;

    const row = this.addRow({
      text: purchasing ? option.name : ChooseProductionList.getProduceText(option),
      textX: textX,
      maxWidth: ChooseProductionList.WIDTH - (textX - rowX) - (purchasing ? ChooseProductionList.PRICE_ZONE : 8),
      centerTextY: true,
      rowHeight: rowHeight,
      actorIcons: [
        new Actor({
          image: Game.getInstance().getImage(GameImage.SPRITESHEET),
          spriteRegion: CityScreen.resolveProductionIcon(option),
          x: rowX + 8,
          y: rowY + rowHeight / 2 - UITheme.ICON_SIZE / 2,
          z: CityScreen.Z,
          width: UITheme.ICON_SIZE,
          height: UITheme.ICON_SIZE,
          cameraApplies: false
        }),
        ...(purchasing ? this.createPrice(option, rowX, rowY, affordable) : [])
      ]
    });

    row.on("clicked", () => {
      if (!affordable) return;

      WebsocketClient.sendMessage({
        event: purchasing ? "purchaseProductionOption" : "addToProductionQueue",
        cityName: this.city.getName(),
        type: option.type,
        name: option.name
      });
      this.onChosen();
    });

    row.on("mousemove", () => {
      if (row.isMouseInside() && affordable) {
        Game.getInstance().setCursor("pointer");
      }
    });
    row.on("mouse_exit", () => {
      Game.getInstance().setCursor("default");
    });
  }

  // The price and a gold icon at the row's right edge, the price greyed out while it's unaffordable.
  private createPrice(option: ProductionQueueItem, rowX: number, rowY: number, affordable: boolean): Actor[] {
    const rowCenterY = rowY + CityScreen.PRODUCTION_ROW_HEIGHT / 2;
    const iconX = rowX + ChooseProductionList.WIDTH - UITheme.ICON_SIZE - 8;
    const text = `${option.goldCost}`;
    const { width: textWidth, height: textHeight } = Game.getInstance().measureText(text, UITheme.FONT);

    return [
      new Label({
        text,
        x: iconX - textWidth,
        y: rowCenterY - textHeight / 2,
        font: UITheme.FONT,
        fontColor: affordable ? "white" : "gray"
      }),
      new Actor({
        image: Game.getInstance().getImage(GameImage.SPRITESHEET),
        spriteRegion: SpriteRegion.ICON_GOLD,
        x: iconX,
        y: rowCenterY - UITheme.ICON_SIZE / 2,
        z: CityScreen.Z,
        width: UITheme.ICON_SIZE,
        height: UITheme.ICON_SIZE,
        cameraApplies: false
      })
    ];
  }

  private getGold(): number {
    return Game.getInstance().getCurrentSceneAs<InGameScene>().getClientPlayer().getAccumulatedStat("gold");
  }
}
