import { GameImage } from "../Assets";
import { ClientSettings } from "../ClientSettings";
import { Game } from "../Game";
import { Actor } from "../scene/Actor";
import { ActorGroup } from "../scene/ActorGroup";
import { Button, ButtonSize } from "./Button";
import { Label } from "./Label";
import { SlideBar } from "./SlideBar";

interface SettingRow {
  key: "HUD_TRANSPARENCY";
  label: string;
  min: number;
  max: number;
  step: number;
}

export interface ClientSettingsGroupOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  onClose: () => void;
}

// Client-only preferences, as opposed to GameOptionsGroup's server-owned game rules.
export class ClientSettingsGroup extends ActorGroup {
  private static readonly ROW_HEIGHT = 70;
  private static readonly ROWS_START_Y = 60;
  private static readonly CONTROL_SIZE = ButtonSize.ICON_LARGE.width;
  private static readonly SLIDER_WIDTH = 160;
  private static readonly SLIDER_HEIGHT = 24;
  private static readonly SLIDER_VALUE_WIDTH = 90;

  private static readonly ROWS: SettingRow[] = [
    { key: "HUD_TRANSPARENCY", label: "HUD Transparency", min: 0, max: 1, step: 0.05 }
  ];

  constructor(options: ClientSettingsGroupOptions) {
    super({
      x: options.x,
      y: options.y,
      width: options.width,
      height: options.height,
      cameraApplies: false // Screen-anchored; InGameScene has a camera that would otherwise move it.
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
      text: "Settings",
      font: "20px serif",
      fontColor: "white"
    });
    this.addActor(titleLabel);
    titleLabel.conformSize().then(() => {
      titleLabel.setPosition(this.x + this.width / 2 - titleLabel.getWidth() / 2, this.y + 12);
    });

    ClientSettingsGroup.ROWS.forEach((row, index) => {
      this.renderNumberRow(row, this.y + ClientSettingsGroup.ROWS_START_Y + index * ClientSettingsGroup.ROW_HEIGHT);
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
  }

  // Stepping a 0-1 range lands on values like 0.7500000000000001, so never show the raw number.
  private static formatPercent(value: number): string {
    return `${Math.round(value * 100)}%`;
  }

  private renderNumberRow(row: SettingRow, rowY: number) {
    const valueLabelX = this.x + 20 + ClientSettingsGroup.SLIDER_WIDTH + 12;
    const value = ClientSettings.get(row.key);

    const valueLabel = new Label({
      text: ClientSettingsGroup.formatPercent(value),
      font: "20px serif",
      fontColor: "white",
      x: valueLabelX
    });
    this.addActor(valueLabel);
    valueLabel.conformSize().then(() => {
      valueLabel.setPosition(
        valueLabel.getX(),
        rowY + ClientSettingsGroup.CONTROL_SIZE / 2 - valueLabel.getHeight() / 2
      );
    });

    this.addActor(
      new SlideBar({
        x: this.x + 20,
        y: rowY + ClientSettingsGroup.CONTROL_SIZE / 2 - ClientSettingsGroup.SLIDER_HEIGHT / 2,
        width: ClientSettingsGroup.SLIDER_WIDTH,
        height: ClientSettingsGroup.SLIDER_HEIGHT,
        min: row.min,
        max: row.max,
        step: row.step,
        value: value,
        onDragging: (dragged) => valueLabel.setText(ClientSettingsGroup.formatPercent(dragged)),
        onChanged: (changed) => ClientSettings.set(row.key, changed)
      })
    );

    this.addSettingLabel(row.label, valueLabelX + ClientSettingsGroup.SLIDER_VALUE_WIDTH, rowY);
  }

  private addSettingLabel(text: string, x: number, rowY: number) {
    const label = new Label({
      text: text,
      font: "20px serif",
      fontColor: "white",
      x: x
    });
    this.addActor(label);
    label.conformSize().then(() => {
      label.setPosition(label.getX(), rowY + ClientSettingsGroup.CONTROL_SIZE / 2 - label.getHeight() / 2);
    });
  }
}
