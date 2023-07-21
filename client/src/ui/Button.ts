import { Actor } from "../scene/Actor";
import { Game } from "../Game";
import { GameImage, SpriteRegion } from "../Assets";
import { ActorGroup } from "../scene/ActorGroup";

//FIXME: Redundant argument options code?

export interface ButtonOptions {
  text?: string;
  icon?: SpriteRegion;
  iconWidth?: number;
  iconHeight?: number;
  buttonImage?: GameImage;
  buttonHoveredImage?: GameImage;
  x: number;
  y: number;
  z?: number;
  width: number;
  height: number;
  font?: string;
  fontColor?: string;
  onClicked: Function;
  onMouseEnter?: Function;
  onMouseExit?: Function;
}

export class Button extends ActorGroup {
  private buttonImage: GameImage;
  private buttonHoveredImage: GameImage;
  private text: string;
  private icon: SpriteRegion;
  private callbackFunction: Function;
  private mouseEnterCallbackFunction: Function;
  private mouseExitCallbackFunction: Function;
  private font: string;
  private fontColor: string;
  private textWidth: number;
  private textHeight: number;
  private buttonActor: Actor;

  constructor(options: ButtonOptions) {
    super({
      x: options.x,
      y: options.y,
      z: options.z,
      width: options.width,
      height: options.height,
      cameraApplies: false,
    });

    this.icon = options.icon;
    this.textWidth = -1;
    this.textHeight = -1;
    this.callbackFunction = options.onClicked;
    this.mouseEnterCallbackFunction = options.onMouseEnter || function () {};
    this.mouseExitCallbackFunction = options.onMouseExit || function () {};
    this.font = options.font ?? "24px serif";
    this.fontColor = options.fontColor ?? "black";
    this.buttonImage = options.buttonImage || GameImage.BUTTON;
    this.buttonHoveredImage =
      options.buttonHoveredImage || GameImage.BUTTON_HOVERED;

    this.buttonActor = new Actor({
      image: Game.getImage(this.buttonImage),
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    });
    this.addActor(this.buttonActor);

    if (this.icon) {
      const iconWidth = options.iconWidth || this.width;
      const iconHeight = options.iconHeight || this.height;
      this.addActor(
        new Actor({
          image: Game.getImage(GameImage.SPRITESHEET),
          spriteRegion: this.icon,
          x: this.x + this.width / 2 - iconWidth / 2,
          y: this.y + this.height / 2 - iconHeight / 2,
          width: iconWidth,
          height: iconHeight,
        })
      );
    }

    this.on("mouse_enter", () => {
      this.buttonActor.setImage(this.buttonHoveredImage);
      this.mouseEnterCallbackFunction();
    });

    this.on("mouse_exit", () => {
      this.buttonActor.setImage(this.buttonImage);
      this.mouseExitCallbackFunction();
    });

    this.on("clicked", () => {
      this.callbackFunction();
    });

    this.text = options.text || "";
    this.icon = options.icon;
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
      Game.drawText(
        {
          text: this.text,
          x: this.x + this.width / 2 - this.textWidth / 2,
          y: this.y + this.height / 2 - this.textHeight / 2,
          color: this.fontColor,
          font: this.font,
        },
        canvasContext
      );
    }

    if (this.icon) {
      //Game.drawImageFromActor()
    }
  }
}
