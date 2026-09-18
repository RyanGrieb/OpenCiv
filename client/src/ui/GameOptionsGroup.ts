import { GameImage } from "../Assets";
import { Game } from "../Game";
import { NetworkEvents, WebsocketClient } from "../network/Client";
import { Actor } from "../scene/Actor";
import { ActorGroup } from "../scene/ActorGroup";
import { Button, ButtonSize } from "./Button";
import { Checkbox } from "./Checkbox";
import { Label } from "./Label";
import { SlideBar } from "./SlideBar";

// Mirrors server/src/GameOptions.ts's GameOptionDefinition union - the server is the sole
// source of truth for which options exist, their labels, and their current values, so this
// dialog never hardcodes an option beyond how to render each type.
interface BooleanGameOptionData {
  key: string;
  label: string;
  type: "boolean";
  value: boolean;
}

interface NumberGameOptionData {
  key: string;
  label: string;
  type: "number";
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

  private optionActors: Actor[];

  constructor(options: GameOptionsGroupOptions) {
    super({
      x: options.x,
      y: options.y,
      width: options.width,
      height: options.height
    });

    this.optionActors = [];

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
      text: "Game Options",
      font: "20px serif",
      fontColor: "white"
    });
    this.addActor(titleLabel);
    titleLabel.conformSize().then(() => {
      titleLabel.setPosition(this.x + this.width / 2 - titleLabel.getWidth() / 2, this.y + 12);
    });

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

    WebsocketClient.sendMessage({ event: "gameOptions" });

    NetworkEvents.on<GameOptionsEvent>({
      eventName: "gameOptions",
      parentObject: this,
      callback: (data) => this.renderOptions(data.options)
    });
  }

  public onDestroyed(): void {
    super.onDestroyed();
    NetworkEvents.removeCallbacksByParentObject(this);
  }

  private renderOptions(optionDefs: GameOptionData[]) {
    for (const actor of this.optionActors) {
      this.removeActor(actor);
    }
    this.optionActors = [];

    // Grouped by type (all checkboxes, then all sliders, ...) regardless of the order the
    // server lists them in, so the two control kinds never interleave row to row.
    const orderedDefs = [
      ...optionDefs.filter((def) => def.type === "boolean"),
      ...optionDefs.filter((def) => def.type === "number")
    ];

    orderedDefs.forEach((optionDef, index) => {
      const rowY = this.y + GameOptionsGroup.ROWS_START_Y + index * GameOptionsGroup.ROW_HEIGHT;

      if (optionDef.type === "boolean") {
        this.renderBooleanRow(optionDef, rowY);
      } else {
        this.renderNumberRow(optionDef, rowY);
      }
    });
  }

  private renderBooleanRow(optionDef: BooleanGameOptionData, rowY: number) {
    const checkbox = new Checkbox({
      x: this.x + 20,
      y: rowY,
      width: GameOptionsGroup.CHECKBOX_SIZE,
      height: GameOptionsGroup.CHECKBOX_SIZE,
      checked: optionDef.value,
      onToggled: (checked) => {
        WebsocketClient.sendMessage({ event: "setGameOption", option: optionDef.key, value: checked });
      }
    });
    this.addActor(checkbox);
    this.optionActors.push(checkbox);

    this.addOptionLabel(optionDef.label, this.x + 20 + GameOptionsGroup.CHECKBOX_SIZE + 12, rowY);
  }

  private renderNumberRow(optionDef: NumberGameOptionData, rowY: number) {
    const sliderY = rowY + GameOptionsGroup.CHECKBOX_SIZE / 2 - GameOptionsGroup.SLIDER_HEIGHT / 2;
    const valueLabelX = this.x + 20 + GameOptionsGroup.SLIDER_WIDTH + 12;

    const valueLabel = new Label({
      text: this.formatOptionValue(optionDef, optionDef.value),
      font: "20px serif",
      fontColor: "white",
      x: valueLabelX
    });
    this.addActor(valueLabel);
    this.optionActors.push(valueLabel);
    valueLabel.conformSize().then(() => {
      valueLabel.setPosition(valueLabel.getX(), rowY + GameOptionsGroup.CHECKBOX_SIZE / 2 - valueLabel.getHeight() / 2);
    });

    const slideBar = new SlideBar({
      x: this.x + 20,
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
    this.addActor(slideBar);
    this.optionActors.push(slideBar);

    this.addOptionLabel(optionDef.label, valueLabelX + GameOptionsGroup.SLIDER_VALUE_WIDTH, rowY);
  }

  private formatOptionValue(optionDef: NumberGameOptionData, value: number): string {
    if (!optionDef.valueLabels) {
      return value.toString();
    }

    const index = Math.round((value - optionDef.min) / optionDef.step);
    return optionDef.valueLabels[index] ?? value.toString();
  }

  private addOptionLabel(text: string, x: number, rowY: number) {
    const label = new Label({
      text: text,
      font: "20px serif",
      fontColor: "white",
      x: x
    });
    this.addActor(label);
    this.optionActors.push(label);
    label.conformSize().then(() => {
      label.setPosition(label.getX(), rowY + GameOptionsGroup.CHECKBOX_SIZE / 2 - label.getHeight() / 2);
    });
  }
}
