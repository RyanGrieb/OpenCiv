import { GameImage, SpriteRegion } from "../Assets";
import { Game } from "../Game";
import { Actor } from "../scene/Actor";
import { Tile } from "./Tile";

// Draws a road tile with old_java's road sprites. Each sprite joins the tile's center to two of its
// sides, keyed here by those sides in adjacent-tile order (side i faces getAdjacentTiles()[i], the
// numbering rivers use): 0 top-left, 1 top-right, 2 right, 3 bottom-right, 4 bottom-left, 5 left.
export class Road {
  private static readonly SPRITES_BY_SIDES: Record<string, SpriteRegion> = {
    "0,1": SpriteRegion.ROAD_VERTICAL_CORNERTOP,
    "0,2": SpriteRegion.ROAD_HORIZONTAL_TOPLEFT,
    "0,3": SpriteRegion.ROAD_VERTICAL_LEFT,
    "0,4": SpriteRegion.ROAD_VERTICAL_CORNERLEFT,
    "0,5": SpriteRegion.ROAD_HORIZONTAL_CORNERTOPLEFT,
    "1,2": SpriteRegion.ROAD_HORIZONTAL_CORNERTOPRIGHT,
    "1,3": SpriteRegion.ROAD_VERTICAL_CORNERRIGHT,
    "1,4": SpriteRegion.ROAD_VERTICAL_RIGHT,
    "1,5": SpriteRegion.ROAD_HORIZONTAL_TOPRIGHT,
    "2,3": SpriteRegion.ROAD_HORIZONTAL_CORNERBOTTOMRIGHT,
    "2,4": SpriteRegion.ROAD_HORIZONTAL_BOTTOMLEFT,
    "2,5": SpriteRegion.ROAD_HORIZONTAL,
    "3,4": SpriteRegion.ROAD_VERTICAL_CORNERBOTTOM,
    "3,5": SpriteRegion.ROAD_HORIZONTAL_BOTTOMRIGHT,
    "4,5": SpriteRegion.ROAD_HORIZONTAL_CORNERBOTTOMLEFT
  };

  // The road actors for a tile drawn at (x, y). Roads run toward every adjacent road or city: one
  // neighbor gets a straight road through the tile toward it (as on old_java), several get a sprite
  // per consecutive pair, and a road with no neighbors lies horizontally.
  public static createActors(tile: Tile, x: number, y: number): Actor[] {
    if (!tile.getTileTypes().includes("road")) return [];

    return Road.getSidePairs(tile).map(
      ([from, to]) =>
        new Actor({
          image: Game.getInstance().getImage(GameImage.SPRITESHEET),
          spriteRegion: Road.SPRITES_BY_SIDES[`${from},${to}`],
          x,
          y,
          width: Tile.WIDTH,
          height: Tile.HEIGHT
        })
    );
  }

  private static getSidePairs(tile: Tile): [number, number][] {
    const sides: number[] = [];
    tile.getAdjacentTiles().forEach((neighbor, side) => {
      if (neighbor?.hasRoad()) sides.push(side);
    });

    if (sides.length === 0) return [[2, 5]];
    if (sides.length === 1) return [Road.sortedPair(sides[0], (sides[0] + 3) % 6)];

    return sides.slice(1).map((side, index) => Road.sortedPair(sides[index], side));
  }

  private static sortedPair(a: number, b: number): [number, number] {
    return a < b ? [a, b] : [b, a];
  }
}
