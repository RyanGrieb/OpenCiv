import { Actor } from "../scene/Actor";
import { Game } from "../Game";
import { GameImage } from "../Assets";

//FIXME: Redundant argument options code?

export interface ButtonOptions {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  font?: string;
  fontColor?: string;
  onClicked: Function;
}

export class Button extends Actor {
  private text: string;
  private callbackFunction: Function;
  private font: string;
  private fontColor: string;
  private textWidth: number;
  private textHeight: number;

  constructor(options: ButtonOptions) {
    super({
      image: Game.getImage(GameImage.BUTTON),
      x: options.x,
      y: options.y,
      width: options.width,
      height: options.height,
    });

    this.textWidth = -1;
    this.textHeight = -1;
    this.callbackFunction = options.onClicked;
    this.font = options.font ?? "24px serif";
    this.fontColor = options.fontColor ?? "black";

    this.on("mouse_enter", () => {
      this.setImage(GameImage.BUTTON_HOVERED);
    });

    this.on("mouse_exit", () => {
      this.setImage(GameImage.BUTTON);
    });

    this.on("clicked", () => {
      this.callbackFunction();
    });

    this.text = options.text;
  }

  public draw(canvasContext: CanvasRenderingContext2D) {
    super.draw(canvasContext); //FIXME: Don't draw until we know textWidth & height.

    if (this.textWidth == -1 && this.textHeight == -1) {
      Game.measureText(this.text, this.font).then(([textWidth, textHeight]) => {
        this.textWidth = textWidth;
        this.textHeight = textHeight;
      });
      return; // Don't render text before we know the height & width of the text
    }

    //TODO: Allow user to change where the text is drawn...
    if (this.text) {
      Game.drawText({
        text: this.text,
        x: this.x + this.width / 2 - this.textWidth / 2,
        y: this.y + this.height / 2 + this.textHeight / 2,
        color: this.fontColor,
        font: this.font,
      });
    }
  }
}
