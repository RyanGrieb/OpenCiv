import { GameImage } from "../../Assets";
import { Game } from "../../Game";
import { Actor } from "../../scene/Actor";
import { ActorGroup } from "../../scene/ActorGroup";
import { ScenarioRegistry } from "../../testing/ScenarioRegistry";
import { Button, ButtonSize } from "../components/Button";
import { Label } from "../components/Label";
import { ListBox } from "../components/Listbox";
import { UITheme } from "../UITheme";

export interface ScenarioListGroupOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  onClose: () => void;
}

// Main menu window listing every registered test scenario by category; clicking one launches it.
export class ScenarioListGroup extends ActorGroup {
  private static readonly TITLE_Y = 12;
  private static readonly LIST_TOP = 56;
  private static readonly LIST_BOTTOM_MARGIN = 80;
  private static readonly LIST_SIDE_MARGIN = 16;
  private static readonly ROW_HEIGHT = 40;
  private static readonly ROW_TEXT_INDENT = 24;

  constructor(options: ScenarioListGroupOptions) {
    super({
      x: options.x,
      y: options.y,
      width: options.width,
      height: options.height
    });

    this.addActor(
      new Actor({
        image: Game.getInstance().getImage(GameImage.POPUP_BOX),
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        nineSlice: true,
        cornerSize: 20
      })
    );

    const titleLabel = new Label({
      text: "Scenarios",
      font: UITheme.FONT,
      fontColor: "white"
    });
    this.addActor(titleLabel);
    titleLabel.conformSize().then(() => {
      titleLabel.setPosition(this.x + this.width / 2 - titleLabel.getWidth() / 2, this.y + ScenarioListGroup.TITLE_Y);
    });

    this.addActor(this.createScenarioList());

    this.addActor(
      new Button({
        text: "Back",
        x: this.x + this.width / 2 - ButtonSize.MEDIUM.width / 2,
        y: this.y + this.height - 60,
        size: ButtonSize.MEDIUM,
        fontColor: "white",
        onClicked: () => options.onClose()
      })
    );
  }

  private createScenarioList(): ListBox {
    const listbox = new ListBox({
      x: this.x + ScenarioListGroup.LIST_SIDE_MARGIN,
      y: this.y + ScenarioListGroup.LIST_TOP,
      width: this.width - ScenarioListGroup.LIST_SIDE_MARGIN * 2,
      height: this.height - ScenarioListGroup.LIST_TOP - ScenarioListGroup.LIST_BOTTOM_MARGIN,
      rowHeight: ScenarioListGroup.ROW_HEIGHT,
      textFont: UITheme.FONT,
      fontColor: "white"
    });

    for (const [category, names] of ScenarioRegistry.getScenariosByCategory()) {
      listbox.addCategory(category, ScenarioListGroup.ROW_HEIGHT);
      for (const name of names) {
        this.addScenarioRow(listbox, name);
      }
    }

    return listbox;
  }

  private addScenarioRow(listbox: ListBox, name: string) {
    const row = listbox.addRow({
      text: name,
      textX: listbox.getX() + ScenarioListGroup.ROW_TEXT_INDENT,
      centerTextY: true
    });

    row.on("clicked", () => ScenarioRegistry.launch(name));
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
