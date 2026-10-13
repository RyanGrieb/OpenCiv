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
 * foot, rather than a whole tile's worth standing up as one flat card. Things painted apart are cut
 * apart; things painted touching (a dense forest's trees) are told apart by their opacity (see
 * MARKED). The pieces are packed into one atlas for the GPU; each sprite is cut once, however many
 * tiles show it.
 */
export class StandingPieces {
  // Pixels at least this opaque are part of a piece - the rest are dropped where it stands up.
  private static readonly OPAQUE = 128;
  // Pixels at least this opaque, but not fully, mark the things painted touching one another as
  // separate: each thing's pixels share an opacity of its own (255, 254, 253 or 252, say, so that
  // things touching differ), which doesn't show, and only pixels of the same opacity make up a piece.
  // Fainter pixels go with the fully opaque ones.
  private static readonly MARKED = 250;
  // Fewer pixels than this, cut off on their own by their marks, go with what they touch - see
  // foldSpecks().
  private static readonly SPECK = 4;

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

  // Hands each group of fewer than SPECK pixels to the group it touches most, if it touches one: a stray
  // pixel or two of one mark among another's - where one thing is painted over another - stands with
  // them, rather than up from a foot of its own.
  private static foldSpecks(groups: number[][], width: number, height: number): number[][] {
    const groupAt = new Int32Array(width * height).fill(-1);
    groups.forEach((group, number) => group.forEach((index) => (groupAt[index] = number)));
    groups.forEach((group, number) => {
      if (group.length >= StandingPieces.SPECK) return;

      const touching = new Map<number, number>();
      for (const other of group.flatMap((index) => PixelGroups.around(index, width, height).map((at) => groupAt[at]))) {
        if (other >= 0 && other !== number) touching.set(other, (touching.get(other) ?? 0) + 1);
      }
      if (!touching.size) return;

      const [into] = [...touching].reduce((most, each) => (each[1] > most[1] ? each : most));
      groups[into].push(...group);
      group.forEach((index) => (groupAt[index] = into));
      groups[number] = [];
    });
    return groups.filter((group) => group.length > 0);
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

    // Each pixel's mark (see MARKED), or 0 where it's too faint to stand.
    const marks = new Uint8Array(width * height);
    for (let index = 0; index < marks.length; index++) {
      const alpha = pixels.data[index * 4 + 3];
      marks[index] = alpha < StandingPieces.OPAQUE ? 0 : alpha >= StandingPieces.MARKED ? alpha : 255;
    }

    const groups: number[][] = [];
    for (const mark of new Set(marks)) {
      if (mark === 0) continue;
      const mask = marks.map((each) => (each === mark ? 1 : 0));
      groups.push(...PixelGroups.find(mask, width, height, !grounded));
    }
    // In the order of their first pixels, as though found all together.
    groups.sort((a, b) => a[0] - b[0]);

    const pieces: StandingPiece[] = [];
    for (const group of StandingPieces.foldSpecks(groups, width, height)) {
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
