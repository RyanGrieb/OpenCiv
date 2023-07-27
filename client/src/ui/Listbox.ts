import { Game } from "../Game";
import { Actor } from "../scene/Actor";
import { Vector } from "../util/Vector";
import { Rectangle, RectangleOptions } from "./Rectangle";

interface RowOptions extends RectangleOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  text?: string;
  font?: string;
  fontColor?: string;
  textX?: number;
  textY?: number;
}

class Row {
  public rectangle: Rectangle;
  private textHeight: number;
  private textWidth: number;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private text: string;
  private actorIcons: Actor[];
  private textX: number;
  private textY: number;
  private font: string;
  private fontColor: string;

  // TODO: Support image
  constructor(options: RowOptions) {
    this.actorIcons = [];
    this.rectangle = new Rectangle(options);
    this.text = options.text;
    this.x = options.x;
    this.y = options.y;
    this.width = options.width;
    this.height = options.height;
    this.font = options.font ?? "12px sans";
    this.fontColor = options.fontColor ?? "black";
    this.textX = options.textX ?? this.x;
    this.textY = options.textY ?? this.y;
  }

  public async setText(text: string) {
    this.text = undefined;
    await Game.measureText(text, this.font).then(([width, height]) => {
      //TODO: Update width and height values for text
      this.text = text;
      this.textHeight = height;
      this.textWidth = width;
    });
  }

  public getWidth() {
    return this.width;
  }

  public getX() {
    return this.x;
  }

  public getY() {
    return this.y;
  }

  public getHeight() {
    return this.height;
  }

  public setTextPosition(x: number, y: number) {
    this.textX = x;
    this.textY = y;
  }

  public getText() {
    return this.text;
  }

  public getActorIcons() {
    return this.actorIcons;
  }

  public clearActorIcons() {
    this.actorIcons = [];
  }

  public addActorIcon(actor: Actor) {
    this.actorIcons.push(actor);
  }

  public getTextX() {
    return this.textX;
  }

  public getTextY() {
    return this.textY;
  }

  public clearText() {
    this.text = undefined;
    //this.textHeight = undefined;
  }

  public getFont() {
    return this.font;
  }

  public getFontColor() {
    return this.fontColor;
  }

  public getTextHeight() {
    return this.textHeight;
  }

  public getTextWidth() {
    return this.textWidth;
  }
}

export interface ListBoxOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  rowHeight?: number;
  textFont: string;
  fontColor: string;
}

export class ListBox extends Actor {
  private rowHeight: number;
  private rows: Row[];
  private textFont: string;
  private fontColor: string;

  constructor(options: ListBoxOptions) {
    super(options);

    this.rowHeight = options.rowHeight ?? 32;
    this.textFont = options.textFont;
    this.fontColor = options.fontColor;
    this.rows = [];
  }

  public addCategory(name: string) {
    // Add row with category name & hide/view option button on left side.

    const row = new Row({
      x: this.getNextRowPosition().x,
      y: this.getNextRowPosition().y,
      width: this.width,
      height: 25, //FIXME: Should be dependent on text height
      color: this.rows.length % 2 == 0 ? "#9e9e9e" : " #bbbbbb",
      font: this.textFont,
      fontColor: this.fontColor,
      text: name,
    });

    row.setText(name).then(() => {
      row.setTextPosition(
        row.getTextX() + row.getWidth() / 2 - row.getTextWidth() / 2,
        row.getTextY() + row.getHeight() / 2 - row.getTextHeight() / 2
      );
    });

    this.rows.push(row);
  }

  public addRow(options: {
    category?: string;
    text: string;
    actorIcons?: Actor[];
    rowHeight?: number;
    color?: string;
    textX?: number;
    textY?: number;
    centerTextY?: boolean;
  }) {
    const row = new Row({
      x: this.getNextRowPosition().x,
      y: this.getNextRowPosition().y,
      text: options.text,
      width: this.width,
      height: options.rowHeight ?? this.rowHeight,
      color:
        options.color ?? this.rows.length % 2 == 0 ? "#9e9e9e" : " #bbbbbb",
      font: this.textFont,
      fontColor: this.fontColor,
      textX: options.textX,
      textY: options.textY,
    });

    for (const actionIcon of options.actorIcons ?? []) {
      row.addActorIcon(actionIcon);
    }

    if (options.centerTextY) {
      row.setText(options.text).then(() => {
        row.setTextPosition(
          row.getTextX(),
          row.getTextY() + row.getHeight() / 2 - row.getTextHeight() / 2
        );
      });
    }

    this.rows.push(row);

    return row;
  }

  public getNextRowPosition(): Vector {
    let nextY = this.y;
    for (const row of this.rows) {
      nextY += row.getHeight();
    }

    return new Vector(this.x, nextY);
  }

  public draw(canvasContext: CanvasRenderingContext2D) {
    Game.drawRect({
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      color: "black",
      fill: true,
      canvasContext: canvasContext,
    });

    this.rows.forEach((row) => {
      Game.drawRect({
        x: row.getX(),
        y: row.getY(),
        width: row.getWidth(),
        height: row.getHeight(),
        color: row.rectangle.color,
        fill: true,
        canvasContext: canvasContext,
      });

      if (row.getText()) {
        //TODO: Only draw text if row is visible.
        Game.drawText(
          {
            text: row.getText(),
            x: row.getTextX(),
            y: row.getTextY(),
            color: row.getFontColor(),
            font: row.getFont(),
          },
          canvasContext
        );
      }

      for (const actorIcon of row.getActorIcons()) {
        actorIcon.draw(canvasContext);
      }
    });
  }

  public clearRows() {
    for (const row of this.rows) {
      row.clearText();
      row.clearActorIcons();
    }

    this.rows = [];
  }

  public getRows(): Row[] {
    return this.rows;
  }
}
