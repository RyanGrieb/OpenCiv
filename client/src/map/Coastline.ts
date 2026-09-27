import { Actor } from "../scene/Actor";
import { HexPixels } from "./HexPixels";
import { Tile } from "./Tile";

// A color in RGB 0-255.
type Rgb = [number, number, number];

/**
 * Softens the hard hex border where land meets water. A land tile gets a sandy shore along each
 * side that faces water, fading into its own terrain; a water tile gets a line of foam along each
 * side that faces land, with lighter shallows fading out behind it. Only the look: the tiles'
 * types and yields are untouched.
 *
 * The overlay is drawn pixel by pixel from each pixel's distance to the tile's coastal sides, with
 * the band widths wobbled by noise in world coordinates, so a shore runs on smoothly from one tile
 * into the next instead of repeating per tile. Hard pixels with a few alpha steps, no antialiasing,
 * to sit with the rest of the pixel art.
 */
export class Coastline {
  // World pixels between the noise's lattice points: how quickly a shore's width wanders.
  private static readonly NOISE_SCALE = 5;

  private static readonly WET_SAND: Rgb = [194, 170, 110];
  private static readonly SAND: Rgb = [228, 208, 142];
  // Snow and tundra don't get beaches: an icy rim, and a gravel one.
  private static readonly SHORE_COLORS: Record<string, [Rgb, Rgb]> = {
    snow: [
      [186, 206, 218],
      [222, 234, 240]
    ],
    snow_hill: [
      [186, 206, 218],
      [222, 234, 240]
    ],
    tundra: [
      [118, 112, 96],
      [152, 146, 128]
    ],
    tundra_hill: [
      [118, 112, 96],
      [152, 146, 128]
    ]
  };
  private static readonly FOAM: Rgb = [236, 244, 250];
  private static readonly SHALLOWS: Rgb = [124, 184, 222];

  private static readonly images = new Map<string, HTMLImageElement>();
  private static canvas: HTMLCanvasElement;

  /**
   * The shore drawn over a tile at (x, y) on a chunk's canvas, or none if no known neighbor across
   * any of its sides is the other of land and water. Built from the real map tile, whose neighbors
   * are linked, rather than a chunk's render-only copy of it.
   */
  public static async createActors(tile: Tile, x: number, y: number): Promise<Actor[]> {
    const sides = Coastline.getCoastalSides(tile);
    if (sides.length === 0) return [];

    return [
      new Actor({
        image: await Coastline.getImage(tile, sides),
        x,
        y,
        width: Tile.WIDTH,
        height: Tile.HEIGHT
      })
    ];
  }

  // Whether a newly discovered tile changes the shore drawn on this neighbor of it.
  public static affects(tile: Tile, neighbor: Tile): boolean {
    return tile.isWater() !== neighbor.isWater();
  }

  // The sides of a tile that face a known tile across the coast.
  private static getCoastalSides(tile: Tile): number[] {
    const sides: number[] = [];
    tile.getAdjacentTiles().forEach((neighbor, side) => {
      if (neighbor && Coastline.affects(tile, neighbor)) sides.push(side);
    });
    return sides;
  }

  // Cached per tile and set of sides: a chunk is rebuilt whenever anything in it changes, while a
  // shore only changes when a neighbor across it is discovered.
  private static async getImage(tile: Tile, sides: number[]): Promise<HTMLImageElement> {
    const key = `${tile.getGridX()},${tile.getGridY()}:${sides.join("")}:${tile.getTileTypes()[0]}`;
    const cached = Coastline.images.get(key);
    if (cached) return cached;

    const image = await Coastline.drawImage(tile, sides);
    Coastline.images.set(key, image);
    return image;
  }

  private static async drawImage(tile: Tile, sides: number[]): Promise<HTMLImageElement> {
    Coastline.canvas ??= document.createElement("canvas");
    const canvas = Coastline.canvas;
    canvas.width = Tile.WIDTH;
    canvas.height = Tile.HEIGHT;
    const context = canvas.getContext("2d");
    const pixels = context.createImageData(Tile.WIDTH, Tile.HEIGHT);

    for (let py = 0; py < Tile.HEIGHT; py++) {
      for (let px = 0; px < Tile.WIDTH; px++) {
        if (!HexPixels.insideHex(px, py)) continue;

        const distance = HexPixels.distanceToSides(px + 0.5, py + 0.5, sides);
        const worldX = tile.getX() + px;
        const worldY = tile.getY() + py;
        const noise = HexPixels.noise(worldX, worldY, Coastline.NOISE_SCALE);
        // Every other pixel in world space, so dithering lines up across tiles.
        const dither = (worldX + worldY) % 2 === 0;
        const [color, alpha] = tile.isWater()
          ? Coastline.waterPixel(distance, noise, dither)
          : Coastline.landPixel(tile.getTileTypes()[0], distance, noise, dither);
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

  // A land pixel `distance` from the water: wet sand at the waterline, then dry sand, then a
  // dithered fade into the terrain.
  private static landPixel(terrain: string, distance: number, noise: number, dither: boolean): [Rgb, number] {
    const [wet, dry] = Coastline.SHORE_COLORS[terrain] ?? [Coastline.WET_SAND, Coastline.SAND];
    const sandWidth = 2.5 + noise * 2.5;

    if (distance < 1.5) return [wet, 1];
    if (distance < sandWidth) return [dry, 1];
    if (distance < sandWidth + 1) return [dry, dither ? 0.85 : 0.55];
    if (distance < sandWidth + 2) return [dry, dither ? 0.35 : 0];
    return [dry, 0];
  }

  // A water pixel `distance` from the land: a foam line at the shore, a broken ripple of foam just
  // off it, and lighter shallows fading out into the open water.
  private static waterPixel(distance: number, noise: number, dither: boolean): [Rgb, number] {
    const foamWidth = 1.2 + noise * 1.3;
    const rippleAt = 3.5 + noise * 1.5;
    const shallowsWidth = 7 + noise * 3;

    if (distance < foamWidth) return [Coastline.FOAM, 0.9];
    if (distance < foamWidth + 1) return [Coastline.FOAM, 0.45];
    if (Math.abs(distance - rippleAt) < 0.5 && noise > 0.45) return [Coastline.FOAM, 0.35];
    if (distance >= shallowsWidth) return [Coastline.SHALLOWS, 0];

    // Stepped rather than smooth, so the fade reads as pixel-art bands.
    const fade = 1 - distance / shallowsWidth;
    const alpha = Math.ceil(fade * 4) * 0.08;
    return [Coastline.SHALLOWS, dither ? alpha : alpha * 0.6];
  }
}
