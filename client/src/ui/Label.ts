import { Actor } from "../scene/Actor";
import { Game } from "../Game";

export interface LabelOptions {
  text: string;
  x?: number;
  y?: number;
  font?: string;
  fontColor?: string;
  lineWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
}

export class Label extends Actor {
  private text: string;
  private font: string;
  private fontColor: string;
  private lineWidth: number;
  private shadowColor: string;
  private shadowBlur: number;

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
    this.lineWidth = options.lineWidth ?? 0;
    this.shadowColor = options.shadowColor ?? this.color;
    this.shadowBlur = options.shadowBlur ?? 0;
  }

  public draw() {
    Game.drawText({
      text: this.text,
      x: this.x,
      y: this.y,
      color: this.fontColor,
      font: this.font,
      shadowColor: this.shadowColor,
      shadowBlur: this.shadowBlur,
      lineWidth: this.lineWidth,
    });
  }

  /**
   * Updates the width and height of the label to conform to whatever the text is
   */
  public async conformSize() {
    const [textWidth, textHeight] = await Game.measureText(this.text, this.font);
    this.width = textWidth;
    this.height = textHeight;
  }

  public setText(text: string) {
    this.text = text;
  }

  public getText(): string {
    return this.text;
  }
}
