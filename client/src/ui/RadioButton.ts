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
}

export class RadioButton extends Actor {
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
  }
}
