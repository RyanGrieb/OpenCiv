import { GameImage, SpriteRegion } from "../../Assets";
import { Game } from "../../Game";
import { Actor } from "../../scene/Actor";

export interface CheckboxOptions {
  x: number;
  y: number;
  z?: number;
  width: number;
  height: number;
  checked?: boolean;
  onToggled?: (checked: boolean) => void;
}

// Same checked/unchecked visuals as RadioButton, but toggles independently rather than
// as part of a mutually-exclusive group - use this for standalone boolean options.
export class Checkbox extends Actor {
  private checked: boolean;
  private onToggledCallback?: (checked: boolean) => void;

  constructor(options: CheckboxOptions) {
    super({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: options.checked ? SpriteRegion.RADIO_BUTTON_SELECTED : SpriteRegion.RADIO_BUTTON_UNSELECTED,
      x: options.x,
      y: options.y,
      z: options.z,
      width: options.width,
      height: options.height,
      cameraApplies: false
    });

    this.checked = options.checked ?? false;
    this.onToggledCallback = options.onToggled;

    this.on("mousemove", () => {
      if (this.mouseInside) {
        Game.getInstance().setCursor("pointer");
      }
    });

    this.on("mouse_enter", () => {
      Game.getInstance().setCursor("pointer");
    });

    this.on("mouse_exit", () => {
      Game.getInstance().setCursor("default");
    });

    this.on("clicked", () => {
      this.setChecked(!this.checked);
      this.onToggledCallback?.(this.checked);
    });
  }

  public setChecked(value: boolean) {
    this.checked = value;
    this.spriteRegion = this.checked ? SpriteRegion.RADIO_BUTTON_SELECTED : SpriteRegion.RADIO_BUTTON_UNSELECTED;
  }

  public isChecked() {
    return this.checked;
  }
}
