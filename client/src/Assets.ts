

//TODO: Have different objects/functions for sounds,spritesheets,images.
//TODO: Preload all images into textures
//TODO: Handle spritesheet into textures
//TODO: Preload all sounds

export const spritehseetSize = 20; //20x20

export enum GameImage {
  BUTTON,
  BUTTON_HOVERED,
  ICON_BUTTON,
  ICON_BUTTON_HOVERED,
  SPRITESHEET,
  RIVER,
  POPUP_BOX,
  DEBUG
}

export enum SpriteRegion {
  WARRIOR = "0,1",
  ARCHER = "0,0",
  BUILDER = "1,0",
  CAMEL_ARCHER = "2,0",
  CARAVAN = "3,0",
  CATAPULT = "5,0",
  COMPOSITE_BOWMAN = "7,0",
  CROSSBOWMAN = "8,0",
  HORSEMAN = "10,0",
  ROMAN_LEGION = "11,0",
  SETTLER = "16,0",
  BLANK_TILE = "9,8",
  SHALLOW_OCEAN = "16,6",
  OCEAN = "5,8",
  FRESHWATER = "7,7",
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
  JUNGLE = "10,6",
  FOREST = "17,5",
  FLOODPLAINS = "16,5",
  CATTLE = "1,5",
  SHEEP = "8,7",
  FISH = "14,5",
  CRAB = "8,5",
  WHALES = "1,8",
  TURTLES = "18,7",
  HORSES = "6,6",
  COPPER = "4,5",
  GOLD = "1,6",
  IRON = "8,6",
  COTTON = "6,5",
  CITRUS = "17,6",
  OLIVES = "14,7",
  STONE = "13,7",
  CITY = "8,8",
  STAR = "0,3",
  HOVERED_TILE = "6,8",
  UNIT_SELECTION_TILE = "7,8",
  DEBUG1 = "3,11",
  DEBUG2 = "14,13",
  DEBUG3 = "17,13",
  UI_STATUSBAR = "4,3",
  RADIO_BUTTON_UNSELECTED = "8,14",
  RADIO_BUTTON_SELECTED = "9,14",
  UNIT_SELECTION_CIRCLE = "1,3",
  UNKNOWN_ICON = "2,11",
  ROME_ICON = "13,11",
  MONGOLIA_ICON = "2,12",
  MAMLUKS_ICON = "5,12",
  AMERICA_ICON = "7,14",
  GERMANY_ICON = "18,12",
  ENGLAND_ICON = "3,13",
  CUBA_ICON = "5,13",
  CANADA_ICON = "3,14",
  PRODUCTION_ICON = "16,11",
  FOOD_ICON = "0,13",
  MORALE_ICON = "1,12",
  POPULATION_ICON = "17,13",
  SCIENCE_ICON = "12,11",
  CULTURE_ICON = "10,12",
  GOLD_ICON = "17,12",
  FAITH_ICON = "2,13",
  TRADE_ICON = "5,14",
  SETTLE_ICON = "11,11",
  BUILDING_PALACE = "5,18"
}


// assets.ts
export const assetList = [
  new URL("../assets/images/ui_button.png", import.meta.url).href,
  new URL("../assets/images/ui_button_hovered.png", import.meta.url).href,
  new URL("../assets/images/ui_icon_button.png", import.meta.url).href,
  new URL("../assets/images/ui_icon_button_hovered.png", import.meta.url).href,
  new URL("../assets/images/spritesheet.png", import.meta.url).href,
  new URL("../assets/images/river.png", import.meta.url).href,
  new URL("../assets/images/ui_popup_box.png", import.meta.url).href,
  new URL("../assets/images/debug.png", import.meta.url).href,
  new URL("../assets/images/font.png", import.meta.url).href,
  new URL("../assets/images/logo.png", import.meta.url).href
];