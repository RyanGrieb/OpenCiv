import { GameImage } from "../../Assets";
import { Game } from "../../Game";
import { Actor } from "../../scene/Actor";
import { ActorGroup } from "../../scene/ActorGroup";
import { ScenarioRegistry } from "../../testing/ScenarioRegistry";
import { Button, ButtonSize } from "../components/Button";
import { Label } from "../components/Label";
import { SectionList, SectionListRow, SectionListSection } from "../components/SectionList";
import { UITheme } from "../UITheme";

export interface ScenarioListGroupOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  onClose: () => void;
}

// A clickable scenario line that lights up under the cursor.
class ScenarioRow extends Actor {
  private static readonly COLOR = "rgba(0, 0, 0, 0)";
  private static readonly HOVER_COLOR = "rgba(255, 255, 255, 0.1)";

  constructor(x: number, y: number, width: number, height: number, onClicked: () => void) {
    super({ x, y, width, height, color: ScenarioRow.COLOR, cameraApplies: false });

    this.on("mouse_enter", () => {
      this.color = ScenarioRow.HOVER_COLOR;
      Game.getInstance().setCursor("pointer");
    });
    this.on("mouse_exit", () => {
      this.color = ScenarioRow.COLOR;
      Game.getInstance().setCursor("default");
    });
    this.on("clicked", onClicked);
  }
}

// Main menu window listing every registered test scenario in a collapsible section per category; clicking one launches it.
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

  private createScenarioList(): SectionList {
    const list = new SectionList({
      x: this.x + ScenarioListGroup.LIST_SIDE_MARGIN,
      y: this.y + ScenarioListGroup.LIST_TOP,
      width: this.width - ScenarioListGroup.LIST_SIDE_MARGIN * 2,
      height: this.height - ScenarioListGroup.LIST_TOP - ScenarioListGroup.LIST_BOTTOM_MARGIN,
      headerHeight: ScenarioListGroup.ROW_HEIGHT,
      font: UITheme.FONT
    });

    const sections: SectionListSection[] = [];
    for (const [category, names] of ScenarioRegistry.getScenariosByCategory()) {
      sections.push({ title: category, rows: names.map((name) => this.createScenarioRow(name)) });
    }
    list.setSections(sections);

    return list;
  }

  private createScenarioRow(name: string): SectionListRow {
    return {
      height: ScenarioListGroup.ROW_HEIGHT,
      create: (x, y, width) => {
        const row = new ScenarioRow(x, y, width, ScenarioListGroup.ROW_HEIGHT, () => ScenarioRegistry.launch(name));

        const label = new Label({
          text: name,
          font: UITheme.FONT,
          fontColor: "white",
          x: x + ScenarioListGroup.ROW_TEXT_INDENT
        });
        label.conformSize().then(() => {
          label.setPosition(label.getX(), y + ScenarioListGroup.ROW_HEIGHT / 2 - label.getHeight() / 2);
        });

        return [row, label];
      }
    };
  }
}
