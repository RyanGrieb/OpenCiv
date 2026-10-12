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

  // The pixels touching one another, on a side or a corner, from a starting pixel: their indices.
  private static floodFrom(opaque: Uint8Array, width: number, height: number, start: number): number[] {
    const group = [start];
    opaque[start] = 0;
    for (let i = 0; i < group.length; i++) {
      const x = group[i] % width;
      const y = Math.floor(group[i] / width);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height || !opaque[nx + ny * width]) continue;
          opaque[nx + ny * width] = 0;
          group.push(nx + ny * width);
        }
      }
    }
    return group;
  }

  /** A sprite's pieces, cutting it first if it hasn't been. Empty while an image is still loading. */
  public piecesOf(image: CanvasImageSource): StandingPiece[] {
    const cached = this.pieces.get(image);
    if (cached) return cached;

    const width = (image as HTMLImageElement).naturalWidth || (image as HTMLCanvasElement).width;
    const height = (image as HTMLImageElement).naturalHeight || (image as HTMLCanvasElement).height;
    if (!width || !height) return [];

    const pieces = this.cut(image, width, height);
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

  private cut(image: CanvasImageSource, width: number, height: number): StandingPiece[] {
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
    for (let start = 0; start < opaque.length; start++) {
      if (!opaque[start]) continue;

      const piece = this.pack(pixels, StandingPieces.floodFrom(opaque, width, height, start));
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
    for (const index of group) {
      const x = (index % pixels.width) - left;
      const y = Math.floor(index / pixels.width) - top;
      piece.data.set(pixels.data.subarray(index * 4, index * 4 + 4), (x + y * width) * 4);
    }
    this.atlas.context.putImageData(piece, corner[0], corner[1]);
    return { atlasX: corner[0], atlasY: corner[1], width, height, left, top };
  }
}
