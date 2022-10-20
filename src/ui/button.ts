import { Actor, ActorOptions } from "../scene/actor";
import { Game } from "../game";

//FIXME: Redundant argument options code?

export interface ButtonOptions {
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Button extends Actor {
  constructor(options: ButtonOptions) {
    super({
      image: Game.getImages()[0],
      x: options.x,
      y: options.y,
      width: options.width,
      height: options.height,
    });

    this.on("mouse_enter", () => {
      console.log("Mouse entered button actor");
      this.setImage(Game.getImages()[1]);
    });

    this.on("mouse_exit", () => {
        console.log("Mouse exited button actor");
        this.setImage(Game.getImages()[0])
    });
  }
}
