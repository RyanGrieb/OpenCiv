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
}

class Row {
  public rectangle: Rectangle;
  public textHeight: number;
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  private text: string;
  private actorIcon: Actor; //TODO: Make this a list
  // TODO: Support image
  constructor(options: RowOptions) {
    this.rectangle = new Rectangle(options);
    this.text = options.text;
    this.x = options.x;
    this.y = options.y;
    this.width = options.width;
    this.height = options.height;
  }

  public setText(text: string) {
    this.text = undefined;
    Game.measureText(text, "12px sans").then(([width, height]) => {
      //TODO: Update width and height values for text
      this.text = text;
      this.textHeight = height;
    });
  }

  public getText() {
    return this.text;
  }

  public getActorIcon() {
    return this.actorIcon;
  }

  //TODO: Intend for this to be an array
  public addActorIcon(actorIcon: Actor) {
    this.actorIcon = actorIcon;
  }
}

export interface ListBoxOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  rowHeight?: number;
}

export class ListBox extends Actor {
  private rowHeight: number;
  private rows: Row[];

  constructor(options: ListBoxOptions) {
    super(options);

    this.rowHeight = options.rowHeight ?? 32;
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
        })
      );
      index += 1;
    }
    //TODO: Initialize rows here
  }

  public draw() {
    Game.drawRect({
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      color: "white",
    });

    this.rows.forEach((row) => {
      Game.drawRect(row.rectangle);

      if (row.getText()) {
        //TODO: Only draw text if row is visible.
        Game.drawText({
          text: row.getText(),
          x: row.x + 2,
          y: row.y + this.rowHeight / 2 + row.textHeight / 2,
          color: "black",
          font: "12px sans",
        });
      }

      if (row.getActorIcon()) {
        Game.drawImageFromActor(row.getActorIcon());
      }
    });
  }

  public clearRowText() {
    for (const row of this.rows) {
      row.setText("");
      row.addActorIcon(undefined);
    }
  }

  public getRows(): Row[] {
    return this.rows;
  }
}
