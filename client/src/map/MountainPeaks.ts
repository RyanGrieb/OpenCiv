import { GameImage, resolveSpriteRegion } from "../Assets";
import { Game } from "../Game";
import { SpriteAtlas } from "../SpriteAtlas";
import { PixelGroups } from "../util/PixelGroups";
import { HexPixels } from "./HexPixels";
import { Tile } from "./Tile";

export interface MountainParts {
  /** The peaks alone, transparent around them. */
  peaks: HTMLCanvasElement;
  /** Bare ground covering where the peaks are painted on the hex, transparent everywhere else. */
  ground: HTMLCanvasElement;
}

/**
 * A mountain sprite split in two for the globe, where its peaks stand up off the ground (see
 * GameMap.getStandingSprites()). The ground is whatever reaches the hex's edge in the colors most
 * common along it; the peaks are the rest. The patch of ground that replaces them is speckled with
 * the ground's own colors, so it reads as more of the same rock.
 */
export class MountainPeaks {
  // How far a channel may stray from one of the edge's common colors and still count as ground.
  private static readonly GROUND_TOLERANCE = 10;
  // The edge's most common colors, enough of them to make up this share of its pixels.
  private static readonly EDGE_COLOR_SHARE = 0.8;
  // Smaller bits of "peak" than this are specks in the ground's texture, and stay painted on it.
  private static readonly MIN_PEAK_PIXELS = 4;

  private static readonly parts = new Map<string, MountainParts>();

  /** The parts of a mountain's sprite, by its variant's tile type ("mountain", "mountain_2", ...). */
  public static split(tileType: string): MountainParts {
    const cached = MountainPeaks.parts.get(tileType);
    if (cached) return cached;

    const pixels = MountainPeaks.readSprite(tileType);
    const ground = MountainPeaks.findGround(pixels);
    const peak = new Uint8Array(ground.length);
    for (let index = 0; index < peak.length; index++) {
      peak[index] = pixels.data[index * 4 + 3] > 0 && !ground[index] ? 1 : 0;
    }
    MountainPeaks.dropSpecks(peak);

    const parts = {
      peaks: MountainPeaks.paintPeaks(pixels, peak),
      ground: MountainPeaks.paintGround(pixels, ground, peak)
    };
    MountainPeaks.parts.set(tileType, parts);
    return parts;
  }

  private static readSprite(tileType: string): ImageData {
    const canvas = MountainPeaks.createTileCanvas();
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const region = SpriteAtlas.getInstance().getRegion(resolveSpriteRegion(`TILE_${tileType.toUpperCase()}`));
    const spritesheet = Game.getInstance().getImage(GameImage.SPRITESHEET);
    context.drawImage(spritesheet, region.x, region.y, region.w, region.h, 0, 0, Tile.WIDTH, Tile.HEIGHT);
    return context.getImageData(0, 0, Tile.WIDTH, Tile.HEIGHT);
  }

  // Per pixel, 1 where it's ground: flooded in from the hex's edge through ground-colored pixels.
  private static findGround(pixels: ImageData): Uint8Array {
    const size = Tile.WIDTH;
    const edge: number[] = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (MountainPeaks.onHexEdge(x, y)) edge.push(x + y * size);
      }
    }

    const colors = MountainPeaks.commonColors(pixels, edge);
    const ground = new Uint8Array(size * size);
    const queue = edge.filter((index) => MountainPeaks.isGroundColor(pixels, index, colors));
    queue.forEach((index) => (ground[index] = 1));

    while (queue.length > 0) {
      const index = queue.pop();
      const x = index % size;
      const y = Math.floor(index / size);
      for (const [nx, ny] of [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1]
      ]) {
        const next = nx + ny * size;
        if (!HexPixels.insideHex(nx, ny) || ground[next]) continue;
        if (!MountainPeaks.isGroundColor(pixels, next, colors)) continue;
        ground[next] = 1;
        queue.push(next);
      }
    }
    return ground;
  }

  private static onHexEdge(x: number, y: number): boolean {
    if (!HexPixels.insideHex(x, y)) return false;
    return (
      !HexPixels.insideHex(x + 1, y) ||
      !HexPixels.insideHex(x - 1, y) ||
      !HexPixels.insideHex(x, y + 1) ||
      !HexPixels.insideHex(x, y - 1)
    );
  }

  // The most common colors among some pixels, as many as make up EDGE_COLOR_SHARE of them.
  private static commonColors(pixels: ImageData, indices: number[]): number[][] {
    const counts = new Map<number, number>();
    for (const index of indices) {
      const key = MountainPeaks.colorKey(pixels, index);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const colors: number[][] = [];
    let covered = 0;
    for (const [key, count] of [...counts].sort((a, b) => b[1] - a[1])) {
      colors.push([key >> 16, (key >> 8) & 255, key & 255]);
      covered += count;
      if (covered >= indices.length * MountainPeaks.EDGE_COLOR_SHARE) break;
    }
    return colors;
  }

  private static isGroundColor(pixels: ImageData, index: number, colors: number[][]): boolean {
    const data = pixels.data;
    if (data[index * 4 + 3] === 0) return false;

    const tolerance = MountainPeaks.GROUND_TOLERANCE;
    return colors.some(
      ([r, g, b]) =>
        Math.abs(data[index * 4] - r) <= tolerance &&
        Math.abs(data[index * 4 + 1] - g) <= tolerance &&
        Math.abs(data[index * 4 + 2] - b) <= tolerance
    );
  }

  private static colorKey(pixels: ImageData, index: number): number {
    const data = pixels.data;
    return (data[index * 4] << 16) | (data[index * 4 + 1] << 8) | data[index * 4 + 2];
  }

  // Clears the peak pixels in groups (touching on any side or corner) too small to be a peak.
  private static dropSpecks(peak: Uint8Array) {
    for (const group of PixelGroups.find(peak, Tile.WIDTH, Tile.HEIGHT)) {
      if (group.length < MountainPeaks.MIN_PEAK_PIXELS) group.forEach((index) => (peak[index] = 0));
    }
  }

  private static paintPeaks(pixels: ImageData, peak: Uint8Array): HTMLCanvasElement {
    const canvas = MountainPeaks.createTileCanvas();
    const context = canvas.getContext("2d");
    const image = context.createImageData(Tile.WIDTH, Tile.HEIGHT);
    for (let index = 0; index < peak.length; index++) {
      if (!peak[index]) continue;
      image.data.set(pixels.data.subarray(index * 4, index * 4 + 4), index * 4);
    }
    context.putImageData(image, 0, 0);
    return canvas;
  }

  // The hex's part of the peaks, each pixel one of the ground's colors, picked by a hash of where it is.
  private static paintGround(pixels: ImageData, ground: Uint8Array, peak: Uint8Array): HTMLCanvasElement {
    const groundPixels: number[] = [];
    ground.forEach((isGround, index) => isGround && groundPixels.push(index));

    const canvas = MountainPeaks.createTileCanvas();
    const context = canvas.getContext("2d");
    const image = context.createImageData(Tile.WIDTH, Tile.HEIGHT);
    for (let index = 0; index < peak.length; index++) {
      const x = index % Tile.WIDTH;
      const y = Math.floor(index / Tile.WIDTH);
      if (!peak[index] || !HexPixels.insideHex(x, y) || groundPixels.length === 0) continue;

      const source = groundPixels[MountainPeaks.hash(x, y) % groundPixels.length];
      image.data.set(pixels.data.subarray(source * 4, source * 4 + 4), index * 4);
    }
    context.putImageData(image, 0, 0);
    return canvas;
  }

  private static createTileCanvas(): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = Tile.WIDTH;
    canvas.height = Tile.HEIGHT;
    return canvas;
  }

  private static hash(x: number, y: number): number {
    let hash = Math.imul(x, 374761393) + Math.imul(y, 668265263);
    hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
    return (hash ^ (hash >>> 16)) >>> 0;
  }
}
