import { Actor } from "../scene/Actor";
import { Game } from "../Game";

export interface LabelOptions {
  text: string;
  x?: number;
  y?: number;
  z?: number;
  font?: string;
  fontColor?: string;
  lineWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  cameraApplies?: boolean;
  transparency?: number;
  onClick?: Function;
}

export class Label extends Actor {
  private text: string;
  private font: string;
  private fontColor: string;
  private lineWidth: number;
  private shadowColor: string;
  private shadowBlur: number;
  private onClick: Function;

  constructor(options: LabelOptions) {
    super({
      x: options.x,
      y: options.y,
      z: options.z,
      cameraApplies: options.cameraApplies || false,
      width: 0,
      height: 0,
      transparency: options.transparency,
    });

    this.text = options.text;
    this.font = options.font;
    this.fontColor = options.fontColor;
    this.lineWidth = options.lineWidth ?? 0;
    this.shadowColor = options.shadowColor ?? this.color;
    this.shadowBlur = options.shadowBlur ?? 0;
    this.onClick = options.onClick;

    if (this.onClick) {
      this.on("clicked", () => {
        this.onClick();
      });
    }
  }

  public draw(canvasContext: CanvasRenderingContext2D) {
    Game.drawText(
      {
        text: this.text,
        x: this.x,
        y: this.y,
        height: this.height,
        color: this.fontColor,
        font: this.font,
        shadowColor: this.shadowColor,
        shadowBlur: this.shadowBlur,
        lineWidth: this.lineWidth,
        applyCamera: this.cameraApplies,
        transparency: this.transparency,
      },
      canvasContext
    );
  }

  /**
   * Updates the width and height of the label to conform to whatever the text is
   */
  public async conformSize() {
    const [textWidth, textHeight] = await Game.measureText(
      this.text,
      this.font
    );
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
