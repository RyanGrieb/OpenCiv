import { throws } from "assert";
import * as ex from "excalibur";
import { KeyEvent } from "excalibur/build/dist/Input/Keyboard";
import { Resources } from "resources";
import { text } from "stream/consumers";
import { spritesheet } from "../resources";

class TextBoxCursor extends ex.Actor {
  constructor(x: number, y: number, h: number) {
    super({ x: x, y: y, width: 1, height: h, color: ex.Color.Black });
  }
}

class Textbox extends ex.Actor {
  private previewLabel: ex.Label;
  private textLabel: ex.Label;
  private cursor: TextBoxCursor;
  private newText: string;

  constructor(previewText: string, x: number, y: number, w: number, h: number) {
    super({ x: x, y: y, width: w, height: h, color: ex.Color.White });

    this.newText = "";

    this.previewLabel = new ex.Label({
      text: previewText,
      color: ex.Color.Gray,
      font: new ex.Font({
        family: "sans-serif",
        size: 12,
        unit: ex.FontUnit.Px,
        baseAlign: ex.BaseAlign.Top,
      }),
    });
    this.previewLabel.pos = ex.vec(
      -this.width / 2 + this.previewLabel.width,
      -6
    );

    this.textLabel = new ex.Label({
      text: "",
      color: ex.Color.Black,
      font: new ex.Font({
        family: "sans-serif",
        size: 12,
        unit: ex.FontUnit.Px,
        baseAlign: ex.BaseAlign.Top,
      }),
    });

    this.textLabel.pos = ex.vec(-this.width / 2 + this.textLabel.width, -6);
  }

  public onInitialize() {
    this.addChild(this.previewLabel);
    this.addChild(this.textLabel);

    // Initialize cursor
    this.cursor = new TextBoxCursor(-this.width / 2 + 4, 0, this.height - 4);

    // Initalize timer to blink cursor
    const cursorTimer = new ex.Timer({
      fcn: () => {
        if (this.children.includes(this.cursor)) {
          //FIXME: Weird warning occurs stating it cannot kill actor, never added to scene.
          //this.removeChild(this.cursor);
        } else {
          //this.addChild(this.cursor);
        }
      },
      repeats: true,
      interval: 1000,
    });

    this.scene.add(cursorTimer);

    // Below is our input listeners

    this.on("pointerup", (event) => {
      if (cursorTimer.isRunning) {
        return;
      }

      this.addChild(this.cursor);
      cursorTimer.start();
    });

    this.on("pointerenter", (event) => {
      //TODO: Change mouse cursor
    });

    this.on("pointerleave", (event) => {
      //TODO: Restore mouse cursor to default
    });

    this.scene.engine.input.keyboard.on("press", (evt: KeyEvent) => {
      if (!cursorTimer.isRunning) {
        return;
      }

      this.removeChild(this.previewLabel);

      if (evt.value != undefined) {
        if (evt.value?.length < 2) {
          this.newText = this.textLabel.text + evt.value;
        }
      }

      switch (evt.value) {
        case "Backspace":
          this.newText = this.textLabel.text.slice(0, -1);
          break;

        //TODO: Support other key actions, such as CTRL+A, ect.
        default:
          break;
      }
    });
  }

  /**
   * Whats going to have to happen is we need to make a custom Text object.
   * The API is failing us with graphical errors.
   */

  public update(engine: ex.Engine, delta: number) {
    if (this.newText.length > 0) {
      console.log("Before: " + this.textLabel.getTextWidth());
      this.textLabel.text = this.newText;
      console.log("After: " + this.textLabel.getTextWidth());
      this.textLabel.pos = ex.vec(-this.width / 2 + this.textLabel.width, -6);
      this.cursor.pos.x = -this.width / 2 + this.textLabel.getTextWidth();
      this.newText = "";
      this.textLabel.update(engine, delta);
    }
  }
}

export { Textbox };
