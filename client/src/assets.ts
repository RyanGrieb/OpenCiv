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
  ARCHER = "0,0",
  BUILDER = "1,0",
  CAMEL_ARCHER = "2,0",
  CARAVAN = "3,0",
  CATAPULT = "5,0",
  COMPOSITE_BOWMAN = "7,0",
  CROSSBOWMAN = "8,0",
  HORSEMAN = "10,0",
  ROMAN_LEGION = "11,0",
  OCEAN = "16,6",
  GRASS = "3,6",
  GRASS_HILL = "4,6",
  MOUNTAIN = "14,6",
  DESERT = "10,5",
  DESERT_HILL = "11,5",
  PLAINS = "1,7",
  PLAINS_HILL = "2,7",
  TUNDRA = "15,7",
  TUNDRA_HILL = "16,7",
  SNOW = "3,8",
  SNOW_HILL = "4,8",
  STAR = "0,3",
}

export const assetList = [
  require("../assets/images/ui_button.png"),
  require("../assets/images/ui_button_hovered.png"),
  require("../assets/images/spritesheet.png"),
  require("../assets/images/font.png"),
  require("../assets/images/logo.png"),
];
