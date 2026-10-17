import { Actor } from "../scene/Actor";
import { HexPixels } from "./HexPixels";
import { Tile } from "./Tile";

// A color in RGB 0-255.
type Rgb = [number, number, number];

// How a river along a side ends at one of the side's corners: running on along another side, flowing
// into water, or springing from the land there.
type RiverEnd = "joined" | "mouth" | "source";

/**
 * Draws the rivers along a tile's sides as a stream of lake water, gently winding either side of each
 * hex side and fading into the land at its banks.
 *
 * Both tiles along a river draw their half of it, pixel by pixel, from each pixel's distance to the
 * river's middle line. That line passes through the hex corners and bends away from the side by noise
 * in world coordinates, measured from the same side of the river whichever tile asks, so the two
 * halves meet exactly and one side's stream runs straight on into the next with a rounded bend at
 * each corner. A river narrows to a point where it springs from the land, and widens where it meets
 * a lake or the sea, running on into the water tile and fading out there. Hard pixels with a few
 * alpha steps, no antialiasing, to sit with the rest of the pixel art.
 */
export class River {
  // How far the middle of the stream wanders from the hex side, in pixels.
  private static readonly MEANDER = 1.5;
  // World pixels between the noise's lattice points: how quickly the stream winds and changes width.
  private static readonly NOISE_SCALE = 7;
  // Keep the meander, the width and the ripples from wandering in step with each other or the shores.
  private static readonly MEANDER_SEED = 4211;
  private static readonly WIDTH_SEED = 9067;
  private static readonly RIPPLE_SEED = 2753;
  // World pixels between the ripples' lattice points, and how far they shade the water either way.
  private static readonly RIPPLE_SCALE = 4;
  private static readonly RIPPLE_STRENGTH = 0.25;
  // How far back from its source a river reaches its full width, in pixels.
  private static readonly SOURCE_LENGTH = 14;
  // How much wider a river is where it meets water, and from how far back it starts to widen.
  private static readonly MOUTH_WIDENING = 0.7;
  private static readonly MOUTH_LENGTH = 8;
  // How far a river runs on into the water it flows into before it has faded out, in pixels.
  private static readonly OUTFLOW_LENGTH = 8;
  // How far into the water the river spreads out past its mouth's width, washing over the foam.
  private static readonly OUTFLOW_SPREAD = 5;

  // The lake sprites' own water at the banks, shading smoothly into their lighter mid tone down the
  // stream's middle.
  private static readonly WATER: Rgb = [69, 121, 149];
  private static readonly MIDDLE: Rgb = [78, 138, 168];

  private static readonly images = new Map<string, HTMLCanvasElement>();

  /**
   * The rivers drawn over a tile at (x, y) on a chunk's canvas: those along its sides, or on water,
   * the ends of those flowing into it. None if there are neither. Built from the real map tile, whose
   * neighbors are linked and whose position is in world pixels, rather than a chunk's render-only copy
   * of it.
   */
  public static async createActors(tile: Tile, x: number, y: number): Promise<Actor[]> {
    const key = River.getKey(tile);
    if (!key) return [];

    return [
      new Actor({
        image: River.getImage(tile, key),
        x,
        y,
        width: Tile.WIDTH,
        height: Tile.HEIGHT
      })
    ];
  }

  /**
   * Whether a newly discovered tile changes the rivers drawn on this neighbor of it: how the
   * neighbor's rivers end at a corner depends on the third tile there, and a water tile draws the ends
   * of the rivers flowing into it.
   */
  public static affects(tile: Tile, neighbor: Tile): boolean {
    return neighbor.hasRiver() || (neighbor.isWater() && tile.hasRiver());
  }

  // What a tile's river image depends on, or undefined if it has none to draw.
  private static getKey(tile: Tile): string | undefined {
    let drawn: string;
    if (tile.isWater()) {
      drawn = River.getOutflowCorners(tile).join("");
    } else {
      drawn = tile
        .getNumberedRiverSides()
        .map((side) => `${side}${River.getEnd(tile, side, side)}-${River.getEnd(tile, side, (side + 1) % 6)}`)
        .join(",");
    }
    if (!drawn) return undefined;
    return `${tile.getGridX()},${tile.getGridY()}:${drawn}`;
  }

  // Cached per tile and what its rivers depend on: a chunk is rebuilt whenever anything in it
  // changes, while a tile's rivers only change when a neighbor is discovered.
  private static getImage(tile: Tile, key: string): HTMLCanvasElement {
    const cached = River.images.get(key);
    if (cached) return cached;

    const image = River.drawImage(tile);
    River.images.set(key, image);
    return image;
  }

  private static drawImage(tile: Tile): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = Tile.WIDTH;
    canvas.height = Tile.HEIGHT;
    const context = canvas.getContext("2d");
    const pixels = context.createImageData(Tile.WIDTH, Tile.HEIGHT);

    const sides = tile.isWater() ? [] : tile.getNumberedRiverSides();
    const ends = sides.map((side) => [River.getEnd(tile, side, side), River.getEnd(tile, side, (side + 1) % 6)]);
    const outflowCorners = tile.isWater() ? River.getOutflowCorners(tile) : [];

    for (let py = 0; py < Tile.HEIGHT; py++) {
      for (let px = 0; px < Tile.WIDTH; px++) {
        if (!HexPixels.insideHex(px, py)) continue;

        const x = tile.getX() + px + 0.5;
        const y = tile.getY() + py + 0.5;
        const [distance, fade] = tile.isWater()
          ? River.outflowDistance(tile, outflowCorners, x, y)
          : [Math.min(...sides.map((side, i) => River.streamDistance(tile, side, ends[i], x, y))), 1];
        // Every other pixel in world space, so the dithered banks line up across tiles.
        const dither = (Math.floor(x) + Math.floor(y)) % 2 === 0;
        const [color, alpha] = River.streamPixel(distance, x, y, dither);
        if (alpha * fade <= 0) continue;

        const index = (py * Tile.WIDTH + px) * 4;
        pixels.data.set([...color, Math.round(alpha * fade * 255)], index);
      }
    }

    context.putImageData(pixels, 0, 0);
    return canvas;
  }

  /**
   * How the river along a land tile's side ends at one of that side's corners, judged from the third
   * tile meeting there, so the tile across the river judges it the same way. Taken as running on when
   * that tile isn't known yet.
   */
  private static getEnd(tile: Tile, side: number, corner: number): RiverEnd {
    const across = tile.getAdjacentTiles()[side];
    const otherSide = corner === side ? (side + 5) % 6 : corner;
    const third = tile.getAdjacentTiles()[otherSide];
    if (!across || !third) return "joined";
    if (third.isWater()) return "mouth";

    const thirdToAcross = third.getAdjacentTiles().indexOf(across);
    const runsOn = tile.getRiverSides()[otherSide] || third.getRiverSides()[thirdToAcross];
    return runsOn ? "joined" : "source";
  }

  // The corners of a water tile where a river between the two land tiles meeting there flows in.
  private static getOutflowCorners(tile: Tile): number[] {
    const corners: number[] = [];
    for (let corner = 0; corner < 6; corner++) {
      const before = tile.getAdjacentTiles()[(corner + 5) % 6];
      const after = tile.getAdjacentTiles()[corner];
      if (!before || !after || before.isWater() || after.isWater()) continue;
      if (before.getRiverSides()[before.getAdjacentTiles().indexOf(after)]) corners.push(corner);
    }
    return corners;
  }

  /**
   * How far a world point is from the middle of the stream along one side of a land tile, in pixels
   * of a stream of the usual width: scaled down where the stream narrows or widens near its ends. The side's corners are taken in a fixed order (leftmost, then topmost,
   * first) so the tile on either side of it measures across from the same bank and finds the same
   * middle line. The meander fades out toward the corners, so the streams along neighboring sides meet
   * there.
   */
  private static streamDistance(tile: Tile, side: number, ends: RiverEnd[], x: number, y: number): number {
    let [x1, y1] = HexPixels.CORNERS[side];
    let [x2, y2] = HexPixels.CORNERS[(side + 1) % 6];
    let [end1, end2] = ends;
    if (x2 < x1 || (x2 === x1 && y2 < y1)) [x1, y1, x2, y2, end1, end2] = [x2, y2, x1, y1, end2, end1];
    x1 += tile.getX();
    y1 += tile.getY();
    x2 += tile.getX();
    y2 += tile.getY();

    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    const along = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (length * length)));
    const width = River.endWidth(end1, along * length) * River.endWidth(end2, (1 - along) * length);

    if (along <= 0 || along >= 1) return Math.hypot(x - (x1 + along * dx), y - (y1 + along * dy)) / width;

    const across = ((x - x1) * dy - (y - y1) * dx) / length;
    const taper = Math.min(1, 4 * Math.min(along, 1 - along));
    const meander = (HexPixels.noise(x, y, River.NOISE_SCALE, River.MEANDER_SEED) * 2 - 1) * River.MEANDER;
    return Math.abs(across - meander * taper) / width;
  }

  // How wide the stream is `distance` pixels from one end of its side, relative to its usual width.
  private static endWidth(end: RiverEnd, distance: number): number {
    if (end === "source") return Math.max(0.05, Math.sqrt(Math.min(1, distance / River.SOURCE_LENGTH)));
    if (end === "mouth") return 1 + River.MOUTH_WIDENING * Math.max(0, 1 - distance / River.MOUTH_LENGTH);
    return 1;
  }

  /**
   * On a water tile, how far a world point is from the middle of the nearest river running on into it
   * from one of the given corners, scaled like streamDistance(), and how much of the river is left
   * there as it fades into the water. A river runs on straight from the corner toward the tile's
   * middle, the way it came.
   */
  private static outflowDistance(tile: Tile, corners: number[], x: number, y: number): [number, number] {
    let nearest: [number, number] = [Infinity, 0];
    for (const corner of corners) {
      const [cornerX, cornerY] = HexPixels.CORNERS[corner];
      const startX = tile.getX() + cornerX;
      const startY = tile.getY() + cornerY;
      const towardX = Tile.WIDTH / 2 - cornerX;
      const towardY = Tile.HEIGHT / 2 - cornerY;
      const length = Math.hypot(towardX, towardY);

      const along = ((x - startX) * towardX + (y - startY) * towardY) / length;
      const across = Math.abs((x - startX) * towardY - (y - startY) * towardX) / length;
      const fade = 1 - Math.max(0, along) / River.OUTFLOW_LENGTH;
      if (fade <= 0) continue;

      // Wider still right at the corner, so it washes out the foam where the shore meets it.
      const width = 1 + River.MOUTH_WIDENING + Math.max(0, 1 - along / River.OUTFLOW_SPREAD);
      const distance = Math.hypot(across, Math.min(0, along)) / width;
      if (distance < nearest[0]) nearest = [distance, Math.ceil(fade * 4) / 4];
    }
    return nearest;
  }

  // A pixel `distance` from the middle of the stream, as streamDistance() measures it: water that
  // shades smoothly from a lighter middle out to the banks, gently rippled, then dithered banks fading
  // into the land.
  private static streamPixel(distance: number, x: number, y: number, dither: boolean): [Rgb, number] {
    const halfWidth = 1.6 + HexPixels.noise(x, y, River.NOISE_SCALE, River.WIDTH_SEED) * 0.8;

    if (distance < halfWidth) {
      const ripple = (HexPixels.noise(x, y, River.RIPPLE_SCALE, River.RIPPLE_SEED) * 2 - 1) * River.RIPPLE_STRENGTH;
      const shade = Math.max(0, Math.min(1, 1 - distance / halfWidth + ripple));
      return [River.mix(River.WATER, River.MIDDLE, shade), 1];
    }
    if (distance < halfWidth + 0.8) return [River.WATER, dither ? 0.6 : 0.4];
    if (distance < halfWidth + 1.6) return [River.WATER, dither ? 0.2 : 0];
    return [River.WATER, 0];
  }

  private static mix(from: Rgb, to: Rgb, amount: number): Rgb {
    return from.map((channel, i) => Math.round(channel + (to[i] - channel) * amount)) as Rgb;
  }
}
