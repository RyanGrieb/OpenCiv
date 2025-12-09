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
  maxWidth?: number;
}

export class Label extends Actor {
  private text: string;
  private font: string;
  private fontColor: string;
  private lineWidth: number; // For drawing bold text
  private shadowColor: string;
  private shadowBlur: number;
  private onClickCallback: Function;
  private maxWidth: number;
  private wrappedText: string;
  private unwrappedWordHeight: number;
  private oldText: string; // When were waiting to conform label size.

  constructor(options: LabelOptions) {
    super({
      x: options.x,
      y: options.y,
      z: options.z,
      cameraApplies: options.cameraApplies || false,
      width: 0,
      height: 0,
      transparency: options.transparency
    });

    this.text = options.text;
    this.font = options.font ?? "24px sans-serif";
    this.fontColor = options.fontColor;
    this.lineWidth = options.lineWidth ?? 0;
    this.shadowColor = options.shadowColor ?? this.color;
    this.shadowBlur = options.shadowBlur ?? 0;
    this.maxWidth = options.maxWidth;

    if (options.onClick) {
      this.setOnClick(options.onClick);
    }
  }

  public setOnClick(onClickCallback: Function) {
    this.onClickCallback = onClickCallback;
    if (this.onClickCallback) {
      this.on("clicked", () => {
        this.onClickCallback();
      });

      // Change cursor to pointer when mouse is over label
      this.on("mousemove", () => {
        if (this.mouseInside) {
          if (!Game.getInstance().getCurrentScene().hasSystemMenuOpen()) {
            Game.getInstance().setCursor("pointer");
          }
        }
      });

      // Redundant:
      //this.on("mouse_enter", () => {
      //Game.getInstance().setCursor("pointer");
      //});

      this.on("mouse_exit", () => {
        Game.getInstance().setCursor("default");
      });
    }
  }

  public draw(canvasContext: CanvasRenderingContext2D) {
    let text = this.text;

    if (this.wrappedText) {
      text = this.wrappedText;
    }

    if (this.oldText) {
      text = this.oldText;
    }

    Game.getInstance().drawText(
      {
        text: text,
        x: this.x,
        y: this.y,
        height: this.wrappedText ? this.unwrappedWordHeight : this.height,
        color: this.fontColor,
        font: this.font,
        shadowColor: this.shadowColor,
        shadowBlur: this.shadowBlur,
        lineWidth: this.lineWidth,
        applyCamera: this.cameraApplies,
        transparency: this.transparency,
        maxWidth: this.maxWidth
      },
      canvasContext
    );
  }

  /**
   * Updates the width and height of the label to conform to whatever the text is
   */
  public async conformSize() {
    if (this.maxWidth) {
      const [wrappedText, wrappedHeight, unwrappedWordHeight] = await Game.getInstance().getWrappedText(
        this.text,
        this.font,
        this.maxWidth
      );
      this.wrappedText = wrappedText;
      this.width = this.maxWidth;
      this.height = wrappedHeight;
      this.unwrappedWordHeight = unwrappedWordHeight;
    } else {
      const { width: textWidth, height: textHeight } = Game.getInstance().measureText(this.text, this.font);
      this.width = textWidth;
      this.height = textHeight;
    }

    this.oldText = undefined;
  }

  public setText(text: string, waitForConformSize: boolean = false) {
    if (waitForConformSize) {
      this.oldText = this.text;
    }

    this.text = text;
  }

  public getText(): string {
    return this.text;
  }

  public getFont() {
    return this.font;
  }
}
