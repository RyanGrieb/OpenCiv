import { GameImage } from "../../Assets";
import { Game } from "../../Game";
import { NetworkEvents, WebsocketClient } from "../../network/Client";
import { Actor } from "../../scene/Actor";
import { ActorGroup } from "../../scene/ActorGroup";
import { Button, ButtonSize } from "../components/Button";
import { Checkbox } from "../components/Checkbox";
import { Label } from "../components/Label";
import { SectionList, SectionListRow, SectionListSection } from "../components/SectionList";
import { SlideBar } from "../components/SlideBar";

// Mirrors server/src/GameOptions.ts's GameOptionDefinition union - the server is the sole
// source of truth for which options exist, their labels, and their current values, so this
// dialog never hardcodes an option beyond how to render each type.
interface BooleanGameOptionData {
  key: string;
  label: string;
  type: "boolean";
  hidden?: boolean;
  category?: string;
  value: boolean;
}

interface NumberGameOptionData {
  key: string;
  label: string;
  type: "number";
  hidden?: boolean;
  category?: string;
  min: number;
  max: number;
  step: number;
  valueLabels?: string[];
  value: number;
}

type GameOptionData = BooleanGameOptionData | NumberGameOptionData;

interface GameOptionsEvent {
  options: GameOptionData[];
}

export interface GameOptionsGroupOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  onClose: () => void;
}

export class GameOptionsGroup extends ActorGroup {
  private static readonly ROW_HEIGHT = 70;
  private static readonly ROWS_START_Y = 60;
  private static readonly CHECKBOX_SIZE = ButtonSize.ICON_LARGE.width;
  private static readonly SLIDER_WIDTH = 160;
  private static readonly SLIDER_HEIGHT = 24;
  private static readonly SLIDER_VALUE_WIDTH = 90;
  // Space kept clear at the bottom for the footer buttons.
  private static readonly FOOTER_HEIGHT = 70;
  // Options the server gives no category are listed under this one on the advanced page.
  private static readonly DEFAULT_CATEGORY = "General";

  private optionList: SectionList;
  private optionDefs: GameOptionData[] = [];
  private showAdvanced: boolean = false;
  private footerActors: Actor[] = [];
  private titleLabel: Label;
  private onClose: () => void;

  constructor(options: GameOptionsGroupOptions) {
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

    this.titleLabel = new Label({
      text: "Game Options",
      font: "20px serif",
      fontColor: "white"
    });
    this.addActor(this.titleLabel);

    this.onClose = options.onClose;
    this.renderPage();

    WebsocketClient.sendMessage({ event: "gameOptions" });

    NetworkEvents.on<GameOptionsEvent>({
      eventName: "gameOptions",
      parentObject: this,
      callback: (data) => {
        this.optionDefs = data.options;
        this.renderOptions();
      }
    });
  }

  public onDestroyed(): void {
    super.onDestroyed();
    NetworkEvents.removeCallbacksByParentObject(this);
  }

  // Swaps the title and footer buttons between the main page and the advanced (hidden options) page.
  private renderPage() {
    this.titleLabel.setText(this.showAdvanced ? "Advanced Options" : "Game Options");
    this.titleLabel.conformSize().then(() => {
      this.titleLabel.setPosition(this.x + this.width / 2 - this.titleLabel.getWidth() / 2, this.y + 12);
    });

    for (const actor of this.footerActors) {
      this.removeActor(actor);
    }
    this.footerActors = [];

    const buttonGap = 20;
    const buttonY = this.y + this.height - 60;
    const buttonsX = this.x + this.width / 2 - ButtonSize.MEDIUM.width - buttonGap / 2;
    const backButton = new Button({
      text: "Back",
      x: this.showAdvanced
        ? this.x + this.width / 2 - ButtonSize.MEDIUM.width / 2
        : buttonsX + ButtonSize.MEDIUM.width + buttonGap,
      y: buttonY,
      size: ButtonSize.MEDIUM,
      fontColor: "white",
      onClicked: () => {
        if (this.showAdvanced) {
          this.showAdvanced = false;
          this.renderPage();
        } else {
          this.onClose();
        }
      }
    });

    if (this.showAdvanced) {
      this.footerActors.push(backButton);
    } else {
      this.footerActors.push(
        new Button({
          text: "Advanced",
          x: buttonsX,
          y: buttonY,
          size: ButtonSize.MEDIUM,
          fontColor: "white",
          onClicked: () => {
            this.showAdvanced = true;
            this.renderPage();
          }
        }),
        backButton
      );
    }

    this.footerActors.forEach((actor) => this.addActor(actor));

    // A fresh list per page, so each page opens scrolled to the top with its categories closed.
    if (this.optionList) {
      this.removeActor(this.optionList);
    }
    this.optionList = new SectionList({
      x: this.x + 12,
      y: this.y + GameOptionsGroup.ROWS_START_Y,
      width: this.width - 24,
      height: this.height - GameOptionsGroup.ROWS_START_Y - GameOptionsGroup.FOOTER_HEIGHT,
      startCollapsed: true
    });
    this.addActor(this.optionList);
    this.renderOptions();
  }

  private renderOptions() {
    const visibleDefs = this.optionDefs.filter((def) => !!def.hidden === this.showAdvanced);
    if (!this.showAdvanced) {
      this.optionList.setSections([{ rows: this.createOptionRows(visibleDefs) }]);
      return;
    }

    // Categories in the order the server first lists them.
    const categories = [...new Set(visibleDefs.map((def) => def.category ?? GameOptionsGroup.DEFAULT_CATEGORY))];
    const sections: SectionListSection[] = categories.map((category) => ({
      title: category,
      rows: this.createOptionRows(
        visibleDefs.filter((def) => (def.category ?? GameOptionsGroup.DEFAULT_CATEGORY) === category)
      )
    }));
    this.optionList.setSections(sections);
  }

  // Grouped by type (all checkboxes, then all sliders, ...) regardless of the order the
  // server lists them in, so the two control kinds never interleave row to row.
  private createOptionRows(defs: GameOptionData[]): SectionListRow[] {
    const orderedDefs = [
      ...defs.filter((def) => def.type === "boolean"),
      ...defs.filter((def) => def.type === "number")
    ];

    return orderedDefs.map((optionDef) => ({
      height: GameOptionsGroup.ROW_HEIGHT,
      create: (x: number, y: number) =>
        optionDef.type === "boolean" ? this.createBooleanRow(optionDef, x, y) : this.createNumberRow(optionDef, x, y)
    }));
  }

  private createBooleanRow(optionDef: BooleanGameOptionData, rowX: number, rowY: number): Actor[] {
    const checkbox = new Checkbox({
      x: rowX + 8,
      y: rowY,
      width: GameOptionsGroup.CHECKBOX_SIZE,
      height: GameOptionsGroup.CHECKBOX_SIZE,
      checked: optionDef.value,
      onToggled: (checked) => {
        WebsocketClient.sendMessage({ event: "setGameOption", option: optionDef.key, value: checked });
      }
    });

    return [checkbox, this.createOptionLabel(optionDef.label, rowX + 8 + GameOptionsGroup.CHECKBOX_SIZE + 12, rowY)];
  }

  private createNumberRow(optionDef: NumberGameOptionData, rowX: number, rowY: number): Actor[] {
    const sliderY = rowY + GameOptionsGroup.CHECKBOX_SIZE / 2 - GameOptionsGroup.SLIDER_HEIGHT / 2;
    const valueLabelX = rowX + 8 + GameOptionsGroup.SLIDER_WIDTH + 12;

    const valueLabel = new Label({
      text: this.formatOptionValue(optionDef, optionDef.value),
      font: "20px serif",
      fontColor: "white",
      x: valueLabelX
    });
    valueLabel.conformSize().then(() => {
      valueLabel.setPosition(valueLabel.getX(), rowY + GameOptionsGroup.CHECKBOX_SIZE / 2 - valueLabel.getHeight() / 2);
    });

    const slideBar = new SlideBar({
      x: rowX + 8,
      y: sliderY,
      width: GameOptionsGroup.SLIDER_WIDTH,
      height: GameOptionsGroup.SLIDER_HEIGHT,
      min: optionDef.min,
      max: optionDef.max,
      step: optionDef.step,
      value: optionDef.value,
      onDragging: (value) => valueLabel.setText(this.formatOptionValue(optionDef, value)),
      onChanged: (value) => {
        WebsocketClient.sendMessage({ event: "setGameOption", option: optionDef.key, value });
      }
    });

    return [
      valueLabel,
      slideBar,
      this.createOptionLabel(optionDef.label, valueLabelX + GameOptionsGroup.SLIDER_VALUE_WIDTH, rowY)
    ];
  }

  private formatOptionValue(optionDef: NumberGameOptionData, value: number): string {
    if (!optionDef.valueLabels) {
      return value.toString();
    }

    const index = Math.round((value - optionDef.min) / optionDef.step);
    return optionDef.valueLabels[index] ?? value.toString();
  }

  private createOptionLabel(text: string, x: number, rowY: number): Label {
    const label = new Label({
      text: text,
      font: "20px serif",
      fontColor: "white",
      x: x
    });
    label.conformSize().then(() => {
      label.setPosition(label.getX(), rowY + GameOptionsGroup.CHECKBOX_SIZE / 2 - label.getHeight() / 2);
    });
    return label;
  }
}
