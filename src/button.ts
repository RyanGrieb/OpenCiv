import * as ex from "excalibur";
import { Resources, spriteFont } from "./resources";

class Button extends ex.Actor {
  private text;

  private defaultSprite: ex.Sprite;
  private hoveredSprite: ex.Sprite;
  private clickFunction: Function;

  constructor(
    title: string,
    x: number,
    y: number,
    w: number,
    h: number,
    clickFunction: Function
  ) {
    super({ x: x, y: y, width: w, height: h });

    this.clickFunction = clickFunction;

    let spriteWidth = this.width;
    let spriteHeight = this.height;

    this.defaultSprite = new ex.Sprite({
      image: Resources.button,
      destSize: {
        width: spriteWidth,
        height: spriteHeight,
      },
    });

    this.hoveredSprite = new ex.Sprite({
      image: Resources.buttonHovered,
      destSize: {
        width: spriteWidth,
        height: spriteHeight,
      },
    });

    //TODO: Load my custom font
    this.text = new ex.Text({
      text: title,
      color: ex.Color.White,
      font: new ex.Font({
        family: "sans-serif",
        size: 24,
        unit: ex.FontUnit.Px,
        baseAlign: ex.BaseAlign.Top,
      }),
    });
  }

  public onInitialize() {
    this.graphics.add("idle", this.defaultSprite);
    this.graphics.add("hover", this.hoveredSprite);

    this.graphics.show("idle");
    this.graphics.show(this.text, {
      offset: ex.vec(0, 2),
    });

    this.on("pointerup", (event) => {
      //console.log("Button click", event);
      this.clickFunction();
    });

    this.on("pointerenter", (event) => {
      this.graphics.show("hover");
      this.graphics.show(this.text, {
        offset: ex.vec(0, 2),
      });
    });

    this.on("pointerleave", (event) => {
      this.graphics.show("idle");
      this.graphics.show(this.text, {
        offset: ex.vec(0, 2),
      });
    });
  }
}

export { Button };
