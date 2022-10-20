//TODO: Have different objects/functions for sounds,spritesheets,images.
//TODO: Preload all images into textures
//TODO: Handle spritesheet into textures
//TODO: Preload all sounds

export const spritehseetSize = 20; //20x20


export enum Textures {
  BUTTON,
  BUTTON_HOVERED,
  SPRITESHEET,
}

export enum Sprites {
  ARCHER,
  BUILDER,
  CAMEL_ARCHER,
}

export const assetList = [
  require("../assets/images/ui_button.png"),
  require("../assets/images/ui_button_hovered.png"),
  require("../assets/images/spritesheet.png"),
  require("../assets/images/font.png"),
  require("../assets/images/logo.png"),
];
