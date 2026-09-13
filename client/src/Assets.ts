

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
  //Units
  UNIT_WARRIOR = "0,1",
  UNIT_SCOUT = "15,0",
  UNIT_ARCHER = "0,0",
  UNIT_BUILDER = "1,0",
  UNIT_CAMEL_ARCHER = "2,0",
  UNIT_CARAVAN = "3,0",
  UNIT_CATAPULT = "5,0",
  UNIT_COMPOSITE_BOWMAN = "7,0",
  UNIT_CROSSBOWMAN = "8,0",
  UNIT_HORSEMAN = "10,0",
  UNIT_ROMAN_LEGION = "11,0",
  UNIT_SETTLER = "16,0",
  //Tiles
  TILE_BLANK = "9,8",
  TILE_SHALLOW_OCEAN = "16,6",
  TILE_OCEAN = "5,8",
  TILE_FRESHWATER = "7,7",
  TILE_GRASS = "3,6",
  TILE_GRASS_HILL = "4,6",
  TILE_MOUNTAIN = "14,6",
  TILE_DESERT = "10,5",
  TILE_DESERT_HILL = "11,5",
  TILE_PLAINS = "1,7",
  TILE_PLAINS_HILL = "2,7",
  TILE_TUNDRA = "15,7",
  TILE_TUNDRA_HILL = "16,7",
  TILE_SNOW = "3,8",
  TILE_SNOW_HILL = "4,8",
  TILE_JUNGLE = "10,6",
  TILE_FOREST = "17,5",
  TILE_FLOODPLAINS = "16,5",
  TILE_CATTLE = "1,5",
  TILE_SHEEP = "8,7",
  TILE_FISH = "14,5",
  TILE_CRAB = "8,5",
  TILE_WHALES = "1,8",
  TILE_TURTLES = "18,7",
  TILE_HORSES = "6,6",
  TILE_COPPER = "4,5",
  TILE_GOLD = "1,6",
  TILE_IRON = "8,6",
  TILE_COTTON = "6,5",
  TILE_CITRUS = "17,6",
  TILE_OLIVES = "14,7",
  TILE_STONE = "13,7",
  TILE_CITY = "8,8",
  TILE_HOVERED = "6,8",
  //Icons
  ICON_STAR = "0,3",
  ICON_UNKNOWN = "2,11",
  ICON_ROME = "13,11",
  ICON_MONGOLIA = "2,12",
  ICON_MAMLUKS = "5,12",
  ICON_AMERICA = "7,14",
  ICON_GERMANY = "18,12",
  ICON_ENGLAND = "3,13",
  ICON_CUBA = "5,13",
  ICON_CANADA = "3,14",
  ICON_PRODUCTION = "16,11",
  ICON_FOOD = "0,13",
  ICON_MORALE = "1,12",
  ICON_POPULATION = "17,13",
  ICON_SCIENCE = "12,11",
  ICON_CULTURE = "10,12",
  ICON_GOLD = "17,12",
  ICON_FAITH = "2,13",
  ICON_TRADE = "5,14",
  ICON_DEFENSE = "10,14",
  ICON_SETTLE = "11,11",
  //Buildings
  BUILDING_PALACE = "9,17",
  BUILDING_MONUMENT = "14,16",
  //Misc
  UNIT_SELECTION_TILE = "7,8",
  DEBUG1 = "3,11",
  DEBUG2 = "14,13",
  DEBUG3 = "17,13",
  UI_STATUSBAR = "4,3",
  RADIO_BUTTON_UNSELECTED = "8,14",
  RADIO_BUTTON_SELECTED = "9,14",
  UNIT_SELECTION_CIRCLE = "1,3",
}

// SpriteRegion is keyed by fixed member names, but several call sites look one up
// by a dynamic string (e.g. a unit/tile/icon name from server data). This centralizes
// that one inherently-dynamic lookup instead of scattering implicit-any casts.
export function resolveSpriteRegion(key: string): SpriteRegion {
  return (SpriteRegion as unknown as Record<string, SpriteRegion>)[key];
}


// assets.ts
export const assetList = [
  new URL("../assets/images/ui_button.svg", import.meta.url).href,
  new URL("../assets/images/ui_button_hovered.svg", import.meta.url).href,
  new URL("../assets/images/ui_button.svg", import.meta.url).href,
  new URL("../assets/images/ui_button_hovered.svg", import.meta.url).href,
  new URL("../assets/images/spritesheet.png", import.meta.url).href,
  new URL("../assets/images/river.png", import.meta.url).href,
  new URL("../assets/images/ui_popup_box.svg", import.meta.url).href,
  new URL("../assets/images/debug.png", import.meta.url).href,
  new URL("../assets/images/font.png", import.meta.url).href,
  new URL("../assets/images/logo.png", import.meta.url).href
];