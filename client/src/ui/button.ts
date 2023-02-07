import { Actor } from "../scene/actor";
import { Game } from "../game";
import { Textures } from "../assets";

//FIXME: Redundant argument options code?

export interface ButtonOptions {
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  onClicked: Function;
}

export class Button extends Actor {
  private title: string;
  private callbackFunction: Function;

  constructor(options: ButtonOptions) {
    super({
      texture: Textures.BUTTON,
      x: options.x,
      y: options.y,
      width: options.width,
      height: options.height,
    });

    this.callbackFunction = options.onClicked;

    this.on("mouse_enter", () => {
      //console.log("Mouse entered button actor");
      this.setTexture(Textures.BUTTON_HOVERED);
    });

    this.on("mouse_exit", () => {
      //console.log("Mouse exited button actor");
      this.setTexture(Textures.BUTTON);
    });

    this.on("mouse_click_up", () => {
      this.callbackFunction();
    });

    this.title = options.title;
  }

  public onCreated() {
    this.addText(this.title);
  }
}
