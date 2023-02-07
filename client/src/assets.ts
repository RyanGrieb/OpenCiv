//TODO: Have different objects/functions for sounds,spritesheets,images.
//TODO: Preload all images into textures
//TODO: Handle spritesheet into textures
//TODO: Preload all sounds

export const spritehseetSize = 20; //20x20


export enum GameImage {
  BUTTON,
  BUTTON_HOVERED,
  SPRITESHEET,
}

export enum SpriteRegion {
  ARCHER="0,0",
  BUILDER="1,0",
  CAMEL_ARCHER = "2,0",
  OCEAN = "16,6"
}

export const assetList = [
  require("../assets/images/ui_button.png"),
  require("../assets/images/ui_button_hovered.png"),
  require("../assets/images/spritesheet.png"),
  require("../assets/images/font.png"),
  require("../assets/images/logo.png"),
];
