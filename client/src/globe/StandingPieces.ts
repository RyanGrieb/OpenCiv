import { PixelGroups } from "../util/PixelGroups";
import { AtlasCanvas } from "./AtlasCanvas";

/** One of the things painted on a standing sprite, cut out of it. All in pixels. */
export interface StandingPiece {
  /** Where it is in the atlas. */
  atlasX: number;
  atlasY: number;
  width: number;
  height: number;
  /** Where its top left corner is in its sprite. */
  left: number;
  top: number;
  /**
   * Where its pixels stop with nothing under them, above its bottom row: in strips of the columns
   * that stop on the same row, each [its first column, the column after its last, how far that row
   * is above its bottom row].
   */
  bottoms: [number, number, number][];
}

/**
 * Standing sprites (see GameMap.getStandingSprites()) cut into the separate things painted on them -
 * each tree of a forest, each peak of a mountain - so that on the globe each stands up from its own
 * foot, rather than a whole tile's worth standing up as one flat card. The pieces are packed into one
 * atlas for the GPU; each sprite is cut once, however many tiles show it.
 */
export class StandingPieces {
  // Pixels at least this opaque are part of a piece - the rest are dropped where it stands up.
  private static readonly OPAQUE = 128;

  public readonly atlas: AtlasCanvas;
  private readonly pieces = new WeakMap<CanvasImageSource, StandingPiece[]>();
  private readonly scratch: CanvasRenderingContext2D;
  private changed = false;

  constructor(maxSize: number) {
    this.atlas = new AtlasCanvas(1024, 256, maxSize);
    this.scratch = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  }

  // A piece's pixels' bottoms off its bottom row (see StandingPiece.bottoms), from where it's solid.
  private static findBottoms(solid: Uint8Array, width: number, height: number): [number, number, number][] {
    const bottoms: [number, number, number][] = [];
    for (let y = 0; y < height - 1; y++) {
      let from = -1;
      for (let x = 0; x <= width; x++) {
        const stops = x < width && solid[x + y * width] && !solid[x + (y + 1) * width];
        if (stops && from < 0) from = x;
        if (stops || from < 0) continue;

        bottoms.push([from, x, height - 1 - y]);
        from = -1;
      }
    }
    return bottoms;
  }

  /**
   * A sprite's pieces, cutting it first if it hasn't been. Undefined while an image is still loading.
   * One of something resting on the ground all over (see StandingSprite.grounded) is cut into what
   * touches on a side, so that a hill's mound behind another, touching it only at a corner, stands on
   * its own foot behind it rather than on top of it.
   */
  public piecesOf(image: CanvasImageSource, grounded = false): StandingPiece[] | undefined {
    const cached = this.pieces.get(image);
    if (cached) return cached;

    const width = (image as HTMLImageElement).naturalWidth || (image as HTMLCanvasElement).width;
    const height = (image as HTMLImageElement).naturalHeight || (image as HTMLCanvasElement).height;
    if (!width || !height) return undefined;

    const pieces = this.cut(image, width, height, grounded);
    this.pieces.set(image, pieces);
    this.changed = true;
    return pieces;
  }

  /** Hands newly cut pieces to the atlas's texture. */
  public upload() {
    if (!this.changed) return;
    this.atlas.upload();
    this.changed = false;
  }

  public dispose() {
    this.atlas.dispose();
  }

  private cut(image: CanvasImageSource, width: number, height: number, grounded: boolean): StandingPiece[] {
    const canvas = this.scratch.canvas;
    canvas.width = width;
    canvas.height = height;
    this.scratch.drawImage(image, 0, 0);
    const pixels = this.scratch.getImageData(0, 0, width, height);

    const opaque = new Uint8Array(width * height);
    for (let index = 0; index < opaque.length; index++) {
      opaque[index] = pixels.data[index * 4 + 3] >= StandingPieces.OPAQUE ? 1 : 0;
    }

    const pieces: StandingPiece[] = [];
    for (const group of PixelGroups.find(opaque, width, height, !grounded)) {
      const piece = this.pack(pixels, group);
      if (piece) pieces.push(piece);
    }
    return pieces;
  }

  // Copies a group of the sprite's pixels into the atlas, alone, as a piece.
  private pack(pixels: ImageData, group: number[]): StandingPiece | undefined {
    const xs = group.map((index) => index % pixels.width);
    const ys = group.map((index) => Math.floor(index / pixels.width));
    const left = Math.min(...xs);
    const top = Math.min(...ys);
    const width = Math.max(...xs) - left + 1;
    const height = Math.max(...ys) - top + 1;

    const corner = this.atlas.place(width, height);
    if (!corner) return undefined;

    const piece = this.atlas.context.createImageData(width, height);
    const solid = new Uint8Array(width * height);
    for (const index of group) {
      const x = (index % pixels.width) - left;
      const y = Math.floor(index / pixels.width) - top;
      piece.data.set(pixels.data.subarray(index * 4, index * 4 + 4), (x + y * width) * 4);
      solid[x + y * width] = 1;
    }
    this.atlas.context.putImageData(piece, corner[0], corner[1]);
    const bottoms = StandingPieces.findBottoms(solid, width, height);
    return { atlasX: corner[0], atlasY: corner[1], width, height, left, top, bottoms };
  }
}
