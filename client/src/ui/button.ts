import { Actor } from "../scene/actor";
import { Game } from "../game";
import { GameImage } from "../assets";

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

  constructor(options: ButtonOptions) {
    super({
      image: Game.getImage(GameImage.BUTTON),
      x: options.x,
      y: options.y,
      width: options.width,
      height: options.height,
    });

    this.callbackFunction = options.onClicked;
    this.font = options.font ?? "24px serif";
    this.fontColor = options.fontColor ?? "black";

    this.on("mouse_enter", () => {
      //console.log("Mouse entered button actor");
      this.setImage(GameImage.BUTTON_HOVERED);
    });

    this.on("mouse_exit", () => {
      //console.log("Mouse exited button actor");
      this.setImage(GameImage.BUTTON);
    });

    this.on("mouse_click_up", () => {
      this.callbackFunction();
    });

    this.text = options.text;
  }

  public draw() {
    super.draw();

    //TODO: Allow user to change where the text is drawn...
    if (this.text) {
      Game.measureText(this.text, this.font).then(([textWidth, textHeight]) => {
        Game.drawText({
          text: this.text,
          x: this.x + this.width / 2 - textWidth / 2,
          y: this.y + this.height / 2 + textHeight / 2,
          color: this.fontColor,
          font: this.font,
        });
      });
    }
  }
}
