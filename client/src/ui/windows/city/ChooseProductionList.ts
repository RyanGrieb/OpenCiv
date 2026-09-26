import { GameImage } from "../../../Assets";
import { Game } from "../../../Game";
import { City, ProductionQueueItem } from "../../../city/City";
import { WebsocketClient } from "../../../network/Client";
import { Actor } from "../../../scene/Actor";
import { ListBox } from "../../components/Listbox";
import { UITheme } from "../../UITheme";
import { CityScreen } from "./CityScreen";

// Takes the stats window's place while the player picks something to add to the production queue.
export class ChooseProductionList extends ListBox {
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
      height: CityScreen.STATS_WINDOW_HEIGHT,
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

    const row = this.addRow({
      text: option.name,
      textX: rowX + 8 + UITheme.ICON_SIZE + 8,
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
        })
      ]
    });

    row.on("clicked", () => {
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
}
