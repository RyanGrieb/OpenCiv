import { Game } from "../game";
import { Actor } from "../scene/actor";
import { Rectangle, RectangleOptions } from "./rectangle";

interface RowOptions extends RectangleOptions {
  color: string;
}

class Row extends Rectangle {
  public color: string;
  // TODO: Support image
  constructor(options: RowOptions) {
    super(options);

    this.color = options.color;
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
          color: index % 2 == 0 ? "#e9e9e9" : " #bbbbbb",
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
      Game.drawRect(row);
    });
  }
}
