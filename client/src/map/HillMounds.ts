import { Actor } from "../scene/Actor";
import { PixelGroups } from "../util/PixelGroups";
import { Tile } from "./Tile";

export interface HillParts {
  /** The mounds, with what lies over them on their tile painted on - transparent around them. */
  mounds: HTMLCanvasElement;
  /** The tile's bare terrain where the mounds are, transparent everywhere else. */
  ground: HTMLCanvasElement;
}

/**
 * A hill split in two for the globe, where its mounds stand up off the ground like the trees rather
 * than lying on it (see GameMap.getStandingSprites()). The mounds are what the hill's sprite paints
 * solid: the shadows at their feet are see-through, and stay on the ground with any stray specks.
 * What lies over the mounds on the flat map - a farm, a road, a mine - stands up painted on them, so
 * a road across a hill runs up over it. The terrain under the hill covers the mounds on the ground,
 * for where they lean away from it.
 */
export class HillMounds {
  // What the hill's sprite paints this opaque is a mound; its shadows are see-through.
  private static readonly SOLID = 255;
  // Smaller groups of solid pixels than this are specks, which lie on the ground.
  private static readonly MIN_MOUND_PIXELS = 8;

  private static readonly parts = new Map<string, HillParts>();

  /**
   * The parts of a hill drawn at (x, y) on a chunk's canvas, from what's drawn there: the hill's own
   * overlay first, then whatever lies over it, in order - and the terrain under it. Kept by `key`,
   * which has to tell apart everything drawn.
   */
  public static split(key: string, layers: Actor[], terrain: CanvasImageSource, x: number, y: number): HillParts {
    const cached = HillMounds.parts.get(key);
    if (cached) return cached;

    const mounds = HillMounds.findMounds(layers[0].getImage());
    const parts = {
      mounds: HillMounds.paintWhere(mounds, (context) => {
        context.translate(-x, -y);
        layers.forEach((layer) => layer.draw(context));
      }),
      ground: HillMounds.paintWhere(mounds, (context) => context.drawImage(terrain, 0, 0))
    };
    HillMounds.parts.set(key, parts);
    return parts;
  }

  // A tile-sized canvas painted solid where the hill's mounds are.
  private static findMounds(hill: CanvasImageSource): HTMLCanvasElement {
    const canvas = HillMounds.createTileCanvas();
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(hill, 0, 0);
    const pixels = context.getImageData(0, 0, Tile.WIDTH, Tile.HEIGHT);

    const solid = new Uint8Array(Tile.WIDTH * Tile.HEIGHT);
    for (let index = 0; index < solid.length; index++) {
      solid[index] = pixels.data[index * 4 + 3] === HillMounds.SOLID ? 1 : 0;
    }

    const mask = context.createImageData(Tile.WIDTH, Tile.HEIGHT);
    for (const group of PixelGroups.find(solid, Tile.WIDTH, Tile.HEIGHT)) {
      if (group.length < HillMounds.MIN_MOUND_PIXELS) continue;
      group.forEach((index) => (mask.data[index * 4 + 3] = 255));
    }
    context.putImageData(mask, 0, 0);
    return canvas;
  }

  // A tile-sized canvas with what `paint` draws on it, kept only where the mounds are.
  private static paintWhere(mounds: HTMLCanvasElement, paint: (context: CanvasRenderingContext2D) => void) {
    const canvas = HillMounds.createTileCanvas();
    const context = canvas.getContext("2d");
    paint(context);
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalCompositeOperation = "destination-in";
    context.drawImage(mounds, 0, 0);
    return canvas;
  }

  private static createTileCanvas(): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = Tile.WIDTH;
    canvas.height = Tile.HEIGHT;
    return canvas;
  }
}
