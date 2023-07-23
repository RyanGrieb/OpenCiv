import { Game } from "../Game";
import { Actor } from "../scene/Actor";
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
  public textHeight: number;
  public x: number;
  public y: number;
  public width: number;
  public height: number;
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
    });
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

    let index = 0;
    const maxY = this.y + this.height - this.rowHeight; // Last y value that can fit inside our height.
    for (let y = this.y; y < this.y + this.height; y += this.rowHeight) {
      let rowHeight = this.rowHeight;
      if (y > maxY) {
        rowHeight -= y - maxY; //Constrain rowHeight to fit last row into the actor
        //TODO: Scrollbar here.
      }
      this.rows.push(
        new Row({
          x: this.x,
          y: y,
          width: this.width,
          height: rowHeight,
          color: index % 2 == 0 ? "#9e9e9e" : " #bbbbbb",
          font: this.textFont,
          fontColor: this.fontColor,
        })
      );
      index += 1;
    }
    //TODO: Initialize rows here
  }

  public draw(canvasContext: CanvasRenderingContext2D) {
    Game.drawRect({
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      color: "white",
      fill: true,
      canvasContext: canvasContext,
    });

    this.rows.forEach((row) => {
      Game.drawRect({
        x: row.x,
        y: row.y,
        width: row.width,
        height: row.height,
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

  public clearRow() {
    for (const row of this.rows) {
      row.clearText();
      row.clearActorIcons();
    }
  }

  public getRows(): Row[] {
    return this.rows;
  }
}
