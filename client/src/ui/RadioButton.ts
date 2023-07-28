import { GameImage, SpriteRegion } from "../Assets";
import { Game } from "../Game";
import { Actor } from "../scene/Actor";

export interface RadioButtonOptions {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  getOtherRadioButtons: () => RadioButton[];
  selected?: boolean;
}

export class RadioButton extends Actor {
  private selected: boolean;
  private getOtherRadioButtons: () => RadioButton[];

  constructor(options: RadioButtonOptions) {
    super({
      image: Game.getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.RADIO_BUTTON_UNSELECTED,
      x: options.x,
      y: options.y,
      z: options.z,
      width: options.width,
      height: options.height,
      cameraApplies: false,
    });

    this.selected = options.selected ?? false;
    this.getOtherRadioButtons = options.getOtherRadioButtons;
    console.log(this.getOtherRadioButtons());

    if (this.selected) {
      this.spriteRegion = SpriteRegion.RADIO_BUTTON_SELECTED;
    }

    this.on("mousemove", () => {
      if (this.mouseInside) {
        Game.setCursor("pointer");
      }
    });

    this.on("mouse_enter", () => {
      Game.setCursor("pointer");
    });

    this.on("mouse_exit", () => {
      Game.setCursor("default");
    });

    this.on("clicked", () => {
      console.log("RADIO CLICKED");
      this.select(true);
    });
  }

  public select(value: boolean) {
    this.selected = value;

    if (this.selected) {
      this.spriteRegion = SpriteRegion.RADIO_BUTTON_SELECTED;

      console.log(this);
      // Unselect other radio buttons
      for (const radioButton of this.getOtherRadioButtons()) {
        if (radioButton === this) {
          continue;
        }

        radioButton.select(false);
      }
    } else {
      this.spriteRegion = SpriteRegion.RADIO_BUTTON_UNSELECTED;
    }
  }
}
