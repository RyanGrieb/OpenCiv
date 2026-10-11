import { Actor } from "../scene/Actor";
import { HexPixels } from "./HexPixels";
import { Tile } from "./Tile";

// A color in RGB 0-255.
type Rgb = [number, number, number];

/**
 * Draws the rivers along a tile's sides as a stream of lake water, with the light rim and glints of
 * the lake sprites, gently winding either side of each hex side.
 *
 * Both tiles along a river draw their half of it, pixel by pixel, from each pixel's distance to the
 * river's middle line. That line passes through the hex corners and bends away from the side by noise
 * in world coordinates, measured from the same side of the river whichever tile asks, so the two
 * halves meet exactly and one side's stream runs straight on into the next with a rounded bend at
 * each corner. Hard pixels with a few alpha steps, no antialiasing, to sit with the rest of the pixel
 * art.
 */
export class River {
  // How far the middle of the stream wanders from the hex side, in pixels.
  private static readonly MEANDER = 1.5;
  // World pixels between the noise's lattice points: how quickly the stream winds and changes width.
  private static readonly NOISE_SCALE = 7;
  // Keep the meander, the width and the glints from wandering in step with each other or the shores.
  private static readonly MEANDER_SEED = 4211;
  private static readonly WIDTH_SEED = 9067;
  private static readonly GLINT_SEED = 2753;

  // The lake sprites' own water, a lighter tone of it for the stream's middle, their glints, and the
  // shallows Coastline rims a lake with.
  private static readonly WATER: Rgb = [69, 121, 149];
  private static readonly MIDDLE: Rgb = [85, 155, 202];
  private static readonly GLINT: Rgb = [114, 208, 246];
  private static readonly RIM: Rgb = [124, 184, 222];

  private static readonly images = new Map<string, HTMLImageElement>();
  private static canvas: HTMLCanvasElement;

  /**
   * The rivers drawn over a tile at (x, y) on a chunk's canvas, or none if it has no river. Built
   * from the real map tile, whose position is in world pixels, rather than a chunk's render-only copy
   * of it.
   */
  public static async createActors(tile: Tile, x: number, y: number): Promise<Actor[]> {
    const sides = tile.getNumberedRiverSides();
    if (sides.length === 0) return [];

    return [
      new Actor({
        image: await River.getImage(tile, sides),
        x,
        y,
        width: Tile.WIDTH,
        height: Tile.HEIGHT
      })
    ];
  }

  // Cached per tile and set of sides: a chunk is rebuilt whenever anything in it changes, while a
  // tile's rivers never do.
  private static async getImage(tile: Tile, sides: number[]): Promise<HTMLImageElement> {
    const key = `${tile.getGridX()},${tile.getGridY()}:${sides.join("")}`;
    const cached = River.images.get(key);
    if (cached) return cached;

    const image = await River.drawImage(tile, sides);
    River.images.set(key, image);
    return image;
  }

  private static async drawImage(tile: Tile, sides: number[]): Promise<HTMLImageElement> {
    River.canvas ??= document.createElement("canvas");
    const canvas = River.canvas;
    canvas.width = Tile.WIDTH;
    canvas.height = Tile.HEIGHT;
    const context = canvas.getContext("2d");
    const pixels = context.createImageData(Tile.WIDTH, Tile.HEIGHT);

    for (let py = 0; py < Tile.HEIGHT; py++) {
      for (let px = 0; px < Tile.WIDTH; px++) {
        if (!HexPixels.insideHex(px, py)) continue;

        const worldX = tile.getX() + px + 0.5;
        const worldY = tile.getY() + py + 0.5;
        const distance = Math.min(
          ...sides.map((side) => River.distanceToStream(tile.getX(), tile.getY(), side, worldX, worldY))
        );
        const [color, alpha] = River.streamPixel(distance, worldX, worldY);
        if (alpha <= 0) continue;

        const index = (py * Tile.WIDTH + px) * 4;
        pixels.data.set([...color, Math.round(alpha * 255)], index);
      }
    }

    context.putImageData(pixels, 0, 0);
    const image = new Image(Tile.WIDTH, Tile.HEIGHT);
    image.src = canvas.toDataURL();
    await new Promise((resolve) => (image.onload = resolve));
    return image;
  }

  /**
   * How far a world point is from the middle of the stream along one side of the tile at
   * (tileX, tileY). The side's corners are taken in a fixed order (leftmost, then topmost, first) so
   * the tile on either side of it measures across from the same bank and finds the same middle line.
   * The meander fades out toward the corners, so the streams along neighboring sides meet there.
   */
  private static distanceToStream(tileX: number, tileY: number, side: number, x: number, y: number): number {
    let [x1, y1] = HexPixels.CORNERS[side];
    let [x2, y2] = HexPixels.CORNERS[(side + 1) % 6];
    if (x2 < x1 || (x2 === x1 && y2 < y1)) [x1, y1, x2, y2] = [x2, y2, x1, y1];
    x1 += tileX;
    y1 += tileY;
    x2 += tileX;
    y2 += tileY;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    const along = ((x - x1) * dx + (y - y1) * dy) / (length * length);
    if (along <= 0) return Math.hypot(x - x1, y - y1);
    if (along >= 1) return Math.hypot(x - x2, y - y2);

    const across = ((x - x1) * dy - (y - y1) * dx) / length;
    const taper = Math.min(1, 4 * Math.min(along, 1 - along));
    const meander = (HexPixels.noise(x, y, River.NOISE_SCALE, River.MEANDER_SEED) * 2 - 1) * River.MEANDER;
    return Math.abs(across - meander * taper);
  }

  // A pixel `distance` from the middle of the stream: lighter water with the odd glint down the
  // middle, lake water either side, and a see-through light rim at the banks.
  private static streamPixel(distance: number, x: number, y: number): [Rgb, number] {
    const halfWidth = 1.6 + HexPixels.noise(x, y, River.NOISE_SCALE, River.WIDTH_SEED) * 0.8;

    if (distance < 0.8) {
      const glint = HexPixels.noise(x, y, 3, River.GLINT_SEED) > 0.62;
      return [glint ? River.GLINT : River.MIDDLE, 1];
    }
    if (distance < halfWidth) return [River.WATER, 1];
    if (distance < halfWidth + 1) return [River.RIM, 0.75];
    if (distance < halfWidth + 1.6) return [River.RIM, 0.3];
    return [River.RIM, 0];
  }
}
