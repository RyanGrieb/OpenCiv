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
  // per consecutive pair, and a road with no neighbors lies horizontally. A railroad tile lays rails
  // the same way toward neighboring railroads and cities, over road where a plain road meets it.
  public static createActors(tile: Tile, x: number, y: number): Actor[] {
    if (!tile.getTileTypes().includes("road")) return [];

    const roadSides = Road.getSides(tile, (neighbor) => neighbor.hasRoad());
    if (!tile.getTileTypes().includes("railroad")) return Road.createSprites(Road.toPairs(roadSides), "ROAD", x, y);

    // Rails with no railroad to meet still follow the road.
    const railSides = Road.getSides(tile, (neighbor) => neighbor.hasRailroad());
    const roadOnly = roadSides.filter((side) => !railSides.includes(side));
    return [
      ...(roadOnly.length > 0 ? Road.createSprites(Road.toPairs(roadSides), "ROAD", x, y) : []),
      ...Road.createSprites(Road.toPairs(railSides.length > 0 ? railSides : roadSides), "RAILROAD", x, y)
    ];
  }

  private static createSprites(pairs: [number, number][], prefix: "ROAD" | "RAILROAD", x: number, y: number): Actor[] {
    return pairs.map(
      ([from, to]) =>
        new Actor({
          image: Game.getInstance().getImage(GameImage.SPRITESHEET),
          spriteRegion: Road.getSprite(Road.SPRITES_BY_SIDES[`${from},${to}`], prefix),
          x,
          y,
          width: Tile.WIDTH,
          height: Tile.HEIGHT
        })
    );
  }

  // The railroad sprites are named like the road ones (RAILROAD_HORIZONTAL for ROAD_HORIZONTAL).
  private static getSprite(road: SpriteRegion, prefix: "ROAD" | "RAILROAD"): SpriteRegion {
    if (prefix === "ROAD") return road;
    return SpriteRegion[`RAIL${SpriteRegion[road]}` as keyof typeof SpriteRegion];
  }

  // The sides facing a neighbor that passes the check.
  private static getSides(tile: Tile, connects: (neighbor: Tile) => boolean): number[] {
    const sides: number[] = [];
    tile.getAdjacentTiles().forEach((neighbor, side) => {
      if (neighbor && connects(neighbor)) sides.push(side);
    });
    return sides;
  }

  private static toPairs(sides: number[]): [number, number][] {
    if (sides.length === 0) return [[2, 5]];
    if (sides.length === 1) return [Road.sortedPair(sides[0], (sides[0] + 3) % 6)];

    return sides.slice(1).map((side, index) => Road.sortedPair(sides[index], side));
  }

  private static sortedPair(a: number, b: number): [number, number] {
    return a < b ? [a, b] : [b, a];
  }
}
