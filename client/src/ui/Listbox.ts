import { Actor } from "../scene/Actor";
import { ActorGroup } from "../scene/ActorGroup";
import { Vector } from "../util/Vector";
import { Label } from "./Label";
import { RectangleOptions } from "./Rectangle";

interface RowOptions extends RectangleOptions {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  color: string;
  text?: string;
  font?: string;
  fontColor?: string;
  textX?: number;
  textY?: number;
}

class Row extends ActorGroup {
  private label: Label;

  // TODO: Support image
  constructor(options: RowOptions) {
    super({
      x: options.x,
      y: options.y,
      z: options.z,
      width: options.width,
      height: options.height,
      cameraApplies: false
    });

    this.addActor(
      new Actor({
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        color: options.color
      })
    );

    const label = new Label({
      text: options.text,
      fontColor: options.fontColor,
      font: options.font,
      x: options.textX ?? this.x,
      y: options.textY ?? this.y
    });

    this.label = label;
    this.addActor(label);
  }

  public conformLabelSize(): Promise<void> {
    return this.label.conformSize();
  }

  public setLabelPosition(x: number, y: number) {
    this.label.setPosition(x, y);
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

  public getLabel() {
    return this.label;
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

export class ListBox extends ActorGroup {
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

    this.addActor(
      new Actor({
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        color: "black"
      })
    );
  }

  public addCategory(name: string) {
    // Add row with category name & hide/view option button on left side.

    const row = new Row({
      x: this.getNextRowPosition().x,
      y: this.getNextRowPosition().y,
      z: this.z,
      width: this.width,
      height: 25, //FIXME: Should be dependent on text height
      color: this.rows.length % 2 == 0 ? "#9e9e9e" : " #bbbbbb",
      font: this.textFont,
      fontColor: this.fontColor,
      text: name
    });

    row.conformLabelSize().then(() => {
      row.setLabelPosition(
        row.getLabel().getX() + row.getWidth() / 2 - row.getLabel().getWidth() / 2,
        row.getLabel().getY() + row.getHeight() / 2 - row.getLabel().getHeight() / 2
      );
    });

    this.rows.push(row);
    this.addActor(row);
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
      z: this.z,
      text: options.text,
      width: this.width,
      height: options.rowHeight ?? this.rowHeight,
      color: options.color ?? this.rows.length % 2 == 0 ? "#9e9e9e" : " #bbbbbb",
      font: this.textFont,
      fontColor: this.fontColor,
      textX: options.textX,
      textY: options.textY
    });

    for (const actionIcon of options.actorIcons ?? []) {
      row.addActor(actionIcon);
    }

    if (options.centerTextY) {
      row.getLabel().setText(options.text, true);
      row.conformLabelSize().then(() => {
        row.setLabelPosition(
          row.getLabel().getX(),
          row.getLabel().getY() + row.getHeight() / 2 - row.getLabel().getHeight() / 2
        );
      });
    }

    this.rows.push(row);
    this.addActor(row);

    return row;
  }

  public getNextRowPosition(): Vector {
    let nextY = this.y;
    for (const row of this.rows) {
      nextY += row.getHeight();
    }

    return new Vector(this.x, nextY);
  }

  public clearRows() {
    for (const row of this.rows) {
      this.removeActor(row);
    }

    this.rows = [];
  }

  public getRows(): Row[] {
    return this.rows;
  }
}
