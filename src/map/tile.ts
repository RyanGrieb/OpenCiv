// DO NOT MAKE THIS AN ACTOR,
// WE ARE ONLY GOING TO USE GRAPHICS GROUPS

// Note this tile contains multiple tiles,
// e.g. tundra forest tile w/ copper on it

enum TileLevel {
  LOWEST,
  LOW,
  MIDDLE,
  HIGH,
  HIGHEST,
}

enum TileType {
  GRASS = TileLevel.HIGH,
}

class Tile {}

export { Tile, TileType };
