import { GameImage } from "../../Assets";
import { Game } from "../../Game";
import { NetworkEvents, WebsocketClient } from "../../network/Client";
import { Numbers } from "../../util/Numbers";
import { Actor } from "../../scene/Actor";
import { ActorGroup } from "../../scene/ActorGroup";
import { Button, ButtonSize } from "../components/Button";
import { Checkbox } from "../components/Checkbox";
import { Label } from "../components/Label";
import { SlideBar } from "../components/SlideBar";

// Mirrors server/src/GameOptions.ts's GameOptionDefinition union - the server is the sole
// source of truth for which options exist, their labels, and their current values, so this
// dialog never hardcodes an option beyond how to render each type.
interface BooleanGameOptionData {
  key: string;
  label: string;
  type: "boolean";
  hidden?: boolean;
  value: boolean;
}

interface NumberGameOptionData {
  key: string;
  label: string;
  type: "number";
  hidden?: boolean;
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

interface ScrollRect {
  x: number;
  y: number;
  width: number;
  height: number;
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
  private static readonly SCROLLBAR_WIDTH = 12;
  private static readonly SCROLLBAR_MARGIN = 8;
  private static readonly MIN_THUMB_HEIGHT = 30;
  private static readonly TRACK_COLOR = "rgba(0, 0, 0, 0.25)";
  private static readonly THUMB_COLOR = "rgba(255, 255, 255, 0.6)";

  private optionActors: Actor[];
  private optionDefs: GameOptionData[] = [];
  private showAdvanced: boolean = false;
  private footerActors: Actor[] = [];
  private titleLabel: Label;
  private onClose: () => void;
  // Scrolls a whole row at a time: only rows that fully fit are created, so a row
  // past the window's edge is never drawn or clickable and nothing needs clipping.
  private firstVisibleRow = 0;
  private rowCount = 0;
  private isDraggingScrollbar = false;
  private dragStartMouseY = 0;
  private dragStartRow = 0;
  // "wheel" events carry no cursor position, so the last one seen gates wheel scrolling.
  private lastMouseX = 0;
  private lastMouseY = 0;
  // Bound once so the same reference reaches both addEventListener and removeEventListener.
  private readonly onWindowMouseUp = () => this.stopDraggingScrollbar();

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

    this.on("mousemove", (moveOptions: { x: number; y: number }) => {
      this.lastMouseX = moveOptions.x;
      this.lastMouseY = moveOptions.y;

      if (this.isDraggingScrollbar) {
        this.dragScrollbarTo(moveOptions.y);
      }
    });

    this.on("mousedown", (downOptions: { x: number; y: number; button: number }) => this.onMouseDown(downOptions));

    this.on("wheel", (wheelOptions: { deltaY: number }) => {
      if (!this.insideActor(this.lastMouseX, this.lastMouseY)) return;

      this.scrollToRow(this.firstVisibleRow + Math.sign(wheelOptions.deltaY));
    });
  }

  private static pointInRect(x: number, y: number, rect: ScrollRect): boolean {
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
  }

  public onDestroyed(): void {
    super.onDestroyed();
    NetworkEvents.removeCallbacksByParentObject(this);
    this.stopDraggingScrollbar();
  }

  public draw(canvasContext: CanvasRenderingContext2D) {
    super.draw(canvasContext);

    const track = this.getScrollTrackBounds();
    const thumb = this.getScrollThumbBounds();
    if (!track || !thumb) return;

    Game.getInstance().drawRect({ ...track, color: GameOptionsGroup.TRACK_COLOR, fill: true, canvasContext });
    Game.getInstance().drawRect({ ...thumb, color: GameOptionsGroup.THUMB_COLOR, fill: true, canvasContext });
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
          this.firstVisibleRow = 0;
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
            this.firstVisibleRow = 0;
            this.renderPage();
          }
        }),
        backButton
      );
    }

    this.footerActors.forEach((actor) => this.addActor(actor));
    this.renderOptions();
  }

  private renderOptions() {
    for (const actor of this.optionActors) {
      this.removeActor(actor);
    }
    this.optionActors = [];

    // Grouped by type (all checkboxes, then all sliders, ...) regardless of the order the
    // server lists them in, so the two control kinds never interleave row to row.
    const visibleDefs = this.optionDefs.filter((def) => !!def.hidden === this.showAdvanced);
    const orderedDefs = [
      ...visibleDefs.filter((def) => def.type === "boolean"),
      ...visibleDefs.filter((def) => def.type === "number")
    ];

    this.rowCount = orderedDefs.length;
    this.firstVisibleRow = Numbers.clamp(this.firstVisibleRow, 0, this.getMaxFirstRow());

    const visibleRows = orderedDefs.slice(this.firstVisibleRow, this.firstVisibleRow + this.getVisibleRowCount());
    visibleRows.forEach((optionDef, index) => {
      const rowY = this.y + GameOptionsGroup.ROWS_START_Y + index * GameOptionsGroup.ROW_HEIGHT;

      if (optionDef.type === "boolean") {
        this.renderBooleanRow(optionDef, rowY);
      } else {
        this.renderNumberRow(optionDef, rowY);
      }
    });
  }

  private getVisibleRowCount(): number {
    const rowsAreaHeight = this.height - GameOptionsGroup.ROWS_START_Y - GameOptionsGroup.FOOTER_HEIGHT;
    return Math.max(1, Math.floor(rowsAreaHeight / GameOptionsGroup.ROW_HEIGHT));
  }

  private getMaxFirstRow(): number {
    return Math.max(0, this.rowCount - this.getVisibleRowCount());
  }

  private scrollToRow(row: number) {
    const clamped = Numbers.clamp(Math.round(row), 0, this.getMaxFirstRow());
    if (clamped === this.firstVisibleRow) return;

    this.firstVisibleRow = clamped;
    this.renderOptions();
  }

  // undefined when every row fits, so callers can treat it as "is there a scrollbar at all".
  private getScrollTrackBounds(): ScrollRect | undefined {
    if (this.getMaxFirstRow() <= 0) return undefined;

    return {
      x: this.x + this.width - GameOptionsGroup.SCROLLBAR_WIDTH - GameOptionsGroup.SCROLLBAR_MARGIN,
      y: this.y + GameOptionsGroup.ROWS_START_Y,
      width: GameOptionsGroup.SCROLLBAR_WIDTH,
      height: this.getVisibleRowCount() * GameOptionsGroup.ROW_HEIGHT
    };
  }

  private getScrollThumbBounds(): ScrollRect | undefined {
    const track = this.getScrollTrackBounds();
    if (!track) return undefined;

    const thumbHeight = Math.max(
      GameOptionsGroup.MIN_THUMB_HEIGHT,
      track.height * (this.getVisibleRowCount() / this.rowCount)
    );
    const thumbY = track.y + (this.firstVisibleRow / this.getMaxFirstRow()) * (track.height - thumbHeight);

    return { x: track.x, y: thumbY, width: track.width, height: thumbHeight };
  }

  private onMouseDown(downOptions: { x: number; y: number; button: number }) {
    if (downOptions.button !== 0) return;

    const track = this.getScrollTrackBounds();
    const thumb = this.getScrollThumbBounds();
    if (!track || !thumb) return;

    if (GameOptionsGroup.pointInRect(downOptions.x, downOptions.y, thumb)) {
      this.isDraggingScrollbar = true;
      this.dragStartMouseY = downOptions.y;
      this.dragStartRow = this.firstVisibleRow;
      // A raw mouseup is never relayed to nested actors, so listen on window for the drag's end.
      window.addEventListener("mouseup", this.onWindowMouseUp);
      return;
    }

    if (!GameOptionsGroup.pointInRect(downOptions.x, downOptions.y, track)) return;

    // Clicked the empty track above/below the thumb - page toward the click.
    const direction = downOptions.y < thumb.y ? -1 : 1;
    this.scrollToRow(this.firstVisibleRow + direction * this.getVisibleRowCount());
  }

  private dragScrollbarTo(mouseY: number) {
    const track = this.getScrollTrackBounds();
    const thumb = this.getScrollThumbBounds();
    if (!track || !thumb) return;

    const draggableRange = track.height - thumb.height;
    if (draggableRange <= 0) return;

    const deltaRows = ((mouseY - this.dragStartMouseY) / draggableRange) * this.getMaxFirstRow();
    this.scrollToRow(this.dragStartRow + deltaRows);
  }

  private stopDraggingScrollbar() {
    if (!this.isDraggingScrollbar) return;

    this.isDraggingScrollbar = false;
    window.removeEventListener("mouseup", this.onWindowMouseUp);
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
