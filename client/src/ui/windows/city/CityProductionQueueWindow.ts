import { GameImage, SpriteRegion } from "../../../Assets";
import { Game } from "../../../Game";
import { City, ProductionQueueItem } from "../../../city/City";
import { WebsocketClient } from "../../../network/Client";
import { Actor } from "../../../scene/Actor";
import { ActorGroup } from "../../../scene/ActorGroup";
import { Button, ButtonSize } from "../../components/Button";
import { Label } from "../../components/Label";
import { ListBox } from "../../components/Listbox";
import { UITheme } from "../../UITheme";
import { CityScreen } from "./CityScreen";

// Bottom-left window: the city's production queue, with cancel and reorder buttons on each row,
// and a button that opens (or cancels) the choose-production list.
export class CityProductionQueueWindow extends ActorGroup {
  private static readonly X = 0;
  private static readonly WIDTH = CityScreen.PRODUCTION_WINDOW_WIDTH;
  private static readonly HEIGHT = CityScreen.PRODUCTION_WINDOW_HEIGHT;
  private static readonly ROW_HEIGHT = CityScreen.PRODUCTION_ROW_HEIGHT;

  private city: City;
  private queue: ProductionQueueItem[];
  private windowY: number;

  constructor(options: { city: City; isChoosingProduction: boolean; onToggleChooseProduction: () => void }) {
    super({ x: 0, y: 0, z: CityScreen.Z, width: 0, height: 0, cameraApplies: false });

    this.city = options.city;
    this.queue = this.city.getProductionQueue();
    this.windowY = Game.getInstance().getHeight() - CityProductionQueueWindow.HEIGHT;

    this.addBackground();

    if (this.queue.length === 0) {
      this.addEmptyQueueLabel();
    } else {
      this.addQueueList();
    }

    this.addChooseProductionButton(options.isChoosingProduction, options.onToggleChooseProduction);
  }

  private addBackground() {
    this.addActor(
      new Actor({
        image: Game.getInstance().getImage(GameImage.POPUP_BOX),
        x: CityProductionQueueWindow.X,
        y: this.windowY,
        cornerSize: 20,
        width: CityProductionQueueWindow.WIDTH,
        height: CityProductionQueueWindow.HEIGHT,
        nineSlice: true
      })
    );
  }

  private addEmptyQueueLabel() {
    const label = new Label({ text: "Nothing being produced", font: UITheme.FONT, fontColor: "white" });
    label.conformSize().then(() => {
      label.setPosition(
        CityProductionQueueWindow.X + CityProductionQueueWindow.WIDTH / 2 - label.getWidth() / 2,
        this.windowY + 20
      );
      this.addActor(label);
    });
  }

  private addQueueList() {
    const listbox = new ListBox({
      x: CityProductionQueueWindow.X,
      y: this.windowY,
      width: CityProductionQueueWindow.WIDTH,
      height: CityProductionQueueWindow.HEIGHT - 68,
      rowHeight: CityProductionQueueWindow.ROW_HEIGHT,
      textFont: UITheme.FONT,
      fontColor: "white"
    });

    this.queue.forEach((item, index) => this.addQueueRow(listbox, item, index));

    this.addActor(listbox);
  }

  private addQueueRow(listbox: ListBox, item: ProductionQueueItem, index: number) {
    const rowX = listbox.getNextRowPosition().x;
    const rowY = listbox.getNextRowPosition().y;
    const rowHeight = CityProductionQueueWindow.ROW_HEIGHT;
    const textX = rowX + 8 + UITheme.ICON_SIZE + 8;

    const itemIcon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: CityScreen.resolveProductionIcon(item),
      x: rowX + 8,
      y: rowY + rowHeight / 2 - UITheme.ICON_SIZE / 2,
      z: CityScreen.Z,
      width: UITheme.ICON_SIZE,
      height: UITheme.ICON_SIZE,
      cameraApplies: false
    });

    listbox.addRow({
      text: this.getQueueRowText(item, index),
      textX: textX,
      maxWidth: CityProductionQueueWindow.WIDTH - (textX - rowX) - CityScreen.PRODUCTION_BUTTON_ZONE - 8,
      centerTextY: true,
      rowHeight: rowHeight,
      actorIcons: [itemIcon, ...this.createRowButtons(rowX, rowY, index)]
    });
  }

  // Only the front item accumulates progress (the server only advances
  // queue[0] each turn) - remaining items just show their name.
  private getQueueRowText(item: ProductionQueueItem, index: number): string {
    if (index !== 0) return item.name;

    // Guard against a zero/negative production rate to avoid a div-by-zero.
    const productionRate = Math.max(1, this.city.getStat("production"));
    const progress = item.progress ?? 0;
    const turnsLeft = Math.ceil(Math.max(0, item.cost - progress) / productionRate);
    return `${item.name} — ${progress}/${item.cost} (${CityScreen.turnsText(turnsLeft)})`;
  }

  // Cancel at the row's right edge, then up/down arrows stepping left of it - the front item has
  // no up arrow and the last item no down arrow.
  private createRowButtons(rowX: number, rowY: number, index: number): Button[] {
    const iconY = rowY + CityProductionQueueWindow.ROW_HEIGHT / 2 - ButtonSize.ICON_SMALL.height / 2;
    const buttons: Button[] = [];

    buttons.push(
      this.createRowButton(SpriteRegion.ICON_CANCEL, rowX + CityProductionQueueWindow.WIDTH - 32, iconY, () => {
        WebsocketClient.sendMessage({
          event: "removeFromProductionQueue",
          cityName: this.city.getName(),
          index: index
        });
      })
    );

    let arrowX = rowX + CityProductionQueueWindow.WIDTH - 60;

    if (index > 0) {
      buttons.push(
        this.createRowButton(SpriteRegion.ICON_UP_ARROW, arrowX, iconY, () => this.moveQueueItem(index, "up"))
      );
      arrowX -= 28;
    }

    if (index < this.queue.length - 1) {
      buttons.push(
        this.createRowButton(SpriteRegion.ICON_DOWN_ARROW, arrowX, iconY, () => this.moveQueueItem(index, "down"))
      );
    }

    return buttons;
  }

  private createRowButton(icon: SpriteRegion, x: number, y: number, onClicked: () => void): Button {
    return new Button({
      icon: icon,
      iconOnly: true,
      x: x,
      y: y,
      z: CityScreen.Z,
      size: ButtonSize.ICON_SMALL,
      onClicked: onClicked
    });
  }

  private moveQueueItem(index: number, direction: "up" | "down") {
    WebsocketClient.sendMessage({
      event: "moveProductionQueueItem",
      cityName: this.city.getName(),
      index: index,
      direction: direction
    });
  }

  private addChooseProductionButton(isChoosingProduction: boolean, onClicked: () => void) {
    let text = this.queue.length === 0 ? "Choose Production" : "Add to Queue";
    if (isChoosingProduction) text = "Cancel";

    this.addActor(
      new Button({
        text: text,
        x: CityProductionQueueWindow.X + CityProductionQueueWindow.WIDTH / 2 - ButtonSize.LARGE.width / 2,
        y: this.windowY + CityProductionQueueWindow.HEIGHT - ButtonSize.LARGE.height - 4,
        z: CityScreen.Z,
        size: ButtonSize.LARGE,
        fontColor: "white",
        onClicked: onClicked
      })
    );
  }
}
