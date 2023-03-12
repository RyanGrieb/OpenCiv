import { Actor } from "../scene/Actor";
import { Game } from "../Game";

export interface TextBoxOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class TextBox extends Actor {
  private selected: boolean;
  private shouldBlink: boolean;
  private blinkInterval: NodeJS.Timer;
  private text: string;
  private textHeight: number;
  private blinkerX: number;

  constructor(options: TextBoxOptions) {
    super({
      x: options.x,
      y: options.y,
      width: options.width,
      height: options.height,
    });

    this.selected = false;
    this.shouldBlink = false;
    this.textHeight = -1;
    this.text = "";
    this.blinkerX = this.x + 5;

    this.on("mouse_enter", () => {
      document.getElementById("canvas").style.cursor = "text";
    });

    this.on("mouse_exit", () => {
      document.getElementById("canvas").style.cursor = "auto";
    });

    this.on("clicked", () => {
      if (this.selected) return;
      this.selected = true;
      this.shouldBlink = true;

      this.blinkInterval = setInterval(() => {
        this.shouldBlink = !this.shouldBlink;
      }, 500);
    });

    this.on("mouse_up", (options) => {
      if (!this.insideActor(options.x, options.y)) {
        this.selected = false;
        this.shouldBlink = false;
        clearInterval(this.blinkInterval);
      }
    });

    this.on("keydown", (options) => {
      if (!this.selected) return;
      if (options.key.charAt(0) === "F" && options.key.length > 1) {
        return;
      }

      if (options.key.startsWith("Arrow")) {
        return;
      }

      switch (options.key) {
        case "WakeUp":
        case "Enter":
        case "Escape":
        case "Shift":
        case "Alt":
        case "CapsLock":
        case "Home":
        case "End":
        case "Insert":
        case "Delete":
        case "PageDown":
        case "PageUp":
        case "OS":
        case "Tab":
          return;
        case "Backspace":
          this.setText(this.text.slice(0, -1));
          break;
        case "Control":
          //TODO: Handle Ctrl+A,V,C
          return;
        default:
          this.setText(this.getText() + options.key);
          break;
      }
      //FIXME: Handle special keys (Backspace, ect.)
    });
  }

  public onDestroyed() {
    clearInterval(this.blinkInterval);
  }

  public draw() {
    if (this.textHeight == -1) {
      Game.measureText("M", "24px sans-serif").then(([width, height]) => {
        this.textHeight = height;
      });
    }

    Game.drawRect({
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      color: "#FFFFFF",
    });

    if (this.shouldBlink) {
      Game.drawRect({
        x: this.blinkerX,
        y: this.y + 4,
        width: 2,
        height: this.height - 8,
        color: "black",
      });
    }

    Game.drawText({
      text: this.text,
      color: "black",
      x: this.x,
      y: this.y + this.height / 2 + this.textHeight / 2,
    });
  }

  public setSelected(selected: boolean) {
    if (selected && !this.selected) {
      this.selected = true;
      this.shouldBlink = true;

      this.blinkInterval = setInterval(() => {
        this.shouldBlink = !this.shouldBlink;
      }, 500);
    } else if (!selected && this.selected) {
      this.selected = false;
      this.shouldBlink = false;
      clearInterval(this.blinkInterval);
    }
  }

  public getText(): string {
    return this.text;
  }

  public setText(text: string) {
    this.text = text;
    Game.measureText(this.text, "24px sans-serif").then(([width, height]) => {
      //this.textHeight = height;
      this.blinkerX = this.x + 2 + width;
    });
  }
}
