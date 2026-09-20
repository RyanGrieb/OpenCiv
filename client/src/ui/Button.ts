import { Actor } from "../scene/Actor";
import { Game } from "../Game";
import { GameImage, SpriteRegion } from "../Assets";
import { ActorGroup } from "../scene/ActorGroup";

//FIXME: Redundant argument options code?

export interface ButtonSizeDefinition {
  width: number;
  height: number;
}

// Standard button sizes used across the UI. Prefer these over literal width/height
// so buttons stay visually consistent between scenes, and reference e.g.
// `ButtonSize.LARGE.width` directly when a call site needs the raw dimension.
export const ButtonSize = {
  XLARGE: { width: 320, height: 60 }, // Primary actions with an icon and a long label (lobby menu)
  LARGE: { width: 260, height: 60 }, // Primary actions on their own screen (Play, Next Turn)
  MEDIUM: { width: 180, height: 50 }, // Secondary actions (Back, Close, Select)
  SMALL: { width: 150, height: 40 }, // Compact in-context controls (Next Turn, production toggle)
  ICON_LARGE: { width: 64, height: 64 }, // Prominent icon-only buttons (civ portraits, radio avatars, unit actions)
  ICON_SMALL: { width: 32, height: 32 } // Inline icon-only controls (queue reorder/cancel arrows)
} as const satisfies Record<string, ButtonSizeDefinition>;

export interface ButtonOptions {
  text?: string;
  icon?: SpriteRegion;
  iconOnly?: boolean;
  // Where the icon sits relative to the text when both are present. Ignored when iconOnly. Defaults to "left".
  iconPosition?: "left" | "right";
  // Pins the icon to this absolute x instead of centering the icon+text group by the
  // button's own text width - lets a column of buttons with differing text lengths
  // keep their icons aligned with each other. Ignored when iconOnly.
  iconX?: number;
  iconWidth?: number;
  iconHeight?: number;
  buttonImage?: GameImage;
  buttonHoveredImage?: GameImage;
  x: number;
  y: number;
  z?: number;
  // Preferred: pick a standard size, e.g. `size: ButtonSize.LARGE`. width/height still work
  // directly and win over `size` when both are given.
  size?: ButtonSizeDefinition;
  width?: number;
  height?: number;
  font?: string;
  fontColor?: string;
  onClicked: Function;
  onMouseEnter?: Function;
  onMouseExit?: Function;
  disableHoverWhen?: () => boolean;
}

export class Button extends ActorGroup {
  private static readonly ICON_TEXT_SPACING = 8;
  private static readonly ICON_TEXT_SIZE = 32;

  private buttonImage: GameImage;
  private buttonHoveredImage: GameImage;
  private text: string;
  private icon: SpriteRegion;
  private iconPosition: "left" | "right";
  private iconX?: number;
  private callbackFunction: Function;
  private mouseEnterCallbackFunction: Function;
  private mouseExitCallbackFunction: Function;
  private font: string;
  private fontColor: string;
  private textWidth: number;
  private textHeight: number;
  private buttonActor: Actor;
  private iconActor: Actor;
  private iconOnly: boolean;
  private disableHoverWhen?: () => boolean;

  constructor(options: ButtonOptions) {
    const width = options.width ?? options.size?.width;
    const height = options.height ?? options.size?.height;

    if (width === undefined || height === undefined) {
      throw new Error("Button requires either a `size` or explicit `width`/`height`.");
    }

    super({
      x: options.x,
      y: options.y,
      z: options.z,
      width,
      height,
      cameraApplies: false
    });

    this.icon = options.icon;
    this.iconPosition = options.iconPosition ?? "left";
    this.iconX = options.iconX;
    this.textWidth = -1;
    this.textHeight = -1;
    this.callbackFunction = options.onClicked;
    this.mouseEnterCallbackFunction = options.onMouseEnter || function () { };
    this.mouseExitCallbackFunction = options.onMouseExit || function () { };
    this.font = options.font ?? "24px serif";
    this.fontColor = options.fontColor ?? "black";
    this.buttonImage = options.buttonImage || GameImage.BUTTON;
    this.buttonHoveredImage = options.buttonHoveredImage || GameImage.BUTTON_HOVERED;
    this.iconOnly = options.iconOnly || false;
    this.disableHoverWhen = options.disableHoverWhen;

    if (!this.iconOnly) {
      this.buttonActor = new Actor({
        image: Game.getInstance().getImage(this.buttonImage),
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        nineSlice: true,
        cornerSize: 8
      });
      this.addActor(this.buttonActor);
    }

    if (this.icon) {
      const iconWidth = options.iconWidth || (this.iconOnly ? this.width : Button.ICON_TEXT_SIZE);
      const iconHeight = options.iconHeight || (this.iconOnly ? this.height : Button.ICON_TEXT_SIZE);
      this.iconActor = new Actor({
        image: Game.getInstance().getImage(GameImage.SPRITESHEET),
        spriteRegion: this.icon,
        x: this.x + this.width / 2 - iconWidth / 2,
        y: this.y + this.height / 2 - iconHeight / 2,
        width: iconWidth,
        height: iconHeight
      });
      this.addActor(this.iconActor);
    }

    this.on("mousemove", (options) => {
      if (this.mouseInside) {
        if (this.disableHoverWhen && this.disableHoverWhen()) {
          return;
        }

        Game.getInstance().setCursor("pointer");
      }
    });

    this.on("mouse_enter", () => {
      if (this.disableHoverWhen && this.disableHoverWhen()) {
        return;
      }

      if (!this.iconOnly) {
        this.buttonActor.setImage(this.buttonHoveredImage);
      }

      Game.getInstance().setCursor("pointer");
      this.mouseEnterCallbackFunction();
    });

    this.on("mouse_exit", () => {
      if (!this.iconOnly) {
        this.buttonActor.setImage(this.buttonImage);
      }

      Game.getInstance().setCursor("default");
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
      const { width: textWidth, height: textHeight } = Game.getInstance().measureText(this.text, this.font);
      this.textWidth = textWidth;
      this.textHeight = textHeight;
      return; // Don't render text before we know the height & width of the text
    }

    let textX = this.x + this.width / 2 - this.textWidth / 2;
    const textY = this.y + this.height / 2 - this.textHeight / 2;

    if (this.icon && this.text && !this.iconOnly && this.iconActor) {
      const iconWidth = this.iconActor.getWidth();
      const iconY = this.y + this.height / 2 - this.iconActor.getHeight() / 2;

      if (this.iconX !== undefined) {
        // Icon is pinned; the text stays centered in the button.
        this.iconActor.setPosition(this.iconX, iconY);
      } else {
        const groupWidth = iconWidth + Button.ICON_TEXT_SPACING + this.textWidth;
        const groupX = this.x + this.width / 2 - groupWidth / 2;

        if (this.iconPosition === "left") {
          this.iconActor.setPosition(groupX, iconY);
          textX = groupX + iconWidth + Button.ICON_TEXT_SPACING;
        } else {
          textX = groupX;
          this.iconActor.setPosition(groupX + this.textWidth + Button.ICON_TEXT_SPACING, iconY);
        }
      }
    }

    if (this.text) {
      Game.getInstance().drawText(
        {
          text: this.text,
          x: textX,
          y: textY,
          color: this.fontColor,
          font: this.font
        },
        canvasContext
      );
    }
  }

  public onDestroyed(): void {
    super.onDestroyed();
    if (this.mouseInside) {
      Game.getInstance().setCursor("default");
    }
  }

  public setText(text: string) {
    this.text = text;
  }
}
