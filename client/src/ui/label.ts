import { Actor } from "../scene/actor";
import { Game } from "../game";

export interface LabelOptions {
  text: string;
  x?: number;
  y?: number;
  font?: string;
  fontColor?: string;
}

export class Label extends Actor {
  private text: string;
  private font: string;
  private fontColor: string;

  constructor(options: LabelOptions) {
    super({
      x: options.x,
      y: options.y,
      width: 0,
      height: 0,
    });

    this.text = options.text;
    this.font = options.font;
    this.fontColor = options.fontColor;
  }

  public draw() {
    Game.drawText({
      text: this.text,
      x: this.x,
      y: this.y,
      color: this.fontColor,
      font: this.font,
      shadowColor: "black",
      shadowBlur: 20,
      lineWidth: 4,
    });
  }

  /**
   * Updates the width and height of the label to conform to whatever the text is
   */
  public async conformWidth() {
    const [textWidth, textHeight] = await Game.measureText(this.text, this.font);
    this.width = textWidth;
    this.height = textHeight;
  }
}
