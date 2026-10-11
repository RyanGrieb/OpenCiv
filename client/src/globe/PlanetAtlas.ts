import * as THREE from "three";
import { SpriteRegion } from "../Assets";
import { SpriteAtlas } from "../SpriteAtlas";

/**
 * The planets' own copy of the sprites they use, each in a padded cell, for a mipmapped WebGL
 * texture. The game's atlas packs sprites a pixel apart, so the smaller mipmap levels a zoomed-out
 * planet samples would mix neighboring sprites together; here every sprite's colors are smeared
 * outward into its padding, so a tile's edge stays its own color at any zoom.
 */
export class PlanetAtlas {
  private static readonly CELL = 64;
  private static readonly PADDING = 16;
  private static readonly SIZE = 1024;
  private static readonly SPRITE = 32;

  private static instance: PlanetAtlas;

  public readonly texture: THREE.CanvasTexture;
  private readonly cells = new Map<SpriteRegion, number>();
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = PlanetAtlas.SIZE;
    this.canvas.height = PlanetAtlas.SIZE;
    this.context = this.canvas.getContext("2d", { willReadFrequently: true });
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.flipY = false;
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.texture.anisotropy = 8;
  }

  public static getInstance(): PlanetAtlas {
    if (!PlanetAtlas.instance) PlanetAtlas.instance = new PlanetAtlas();
    return PlanetAtlas.instance;
  }

  // Gives every see-through pixel the average color of its filled neighbors, a ring at a time,
  // until the whole cell is filled. Solid sprites become opaque throughout; others keep their
  // transparency and only borrow the colors, so filtering doesn't darken their outlines.
  private static bleedColors(image: ImageData, solid: boolean) {
    const size = image.width;
    const data = image.data;
    const filled = new Uint8Array(size * size);
    for (let i = 0; i < size * size; i++) filled[i] = data[i * 4 + 3] > 127 ? 1 : 0;

    for (let pass = 0; pass < size; pass++) {
      const newlyFilled: number[] = [];
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const index = y * size + x;
          if (filled[index]) continue;
          let r = 0;
          let g = 0;
          let b = 0;
          let count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx < 0 || ny < 0 || nx >= size || ny >= size || !filled[ny * size + nx]) continue;
              const n = (ny * size + nx) * 4;
              r += data[n];
              g += data[n + 1];
              b += data[n + 2];
              count++;
            }
          }
          if (count === 0) continue;
          data[index * 4] = r / count;
          data[index * 4 + 1] = g / count;
          data[index * 4 + 2] = b / count;
          data[index * 4 + 3] = solid ? 255 : 0;
          newlyFilled.push(index);
        }
      }
      if (newlyFilled.length === 0) break;
      for (const index of newlyFilled) filled[index] = 1;
    }
  }

  /**
   * Where a sprite pixel (0-32 across the sprite) lands in the texture, as uv. Copies the sprite in
   * on first use; `solid` sprites (terrain) also fill their see-through corners with their edge colors.
   */
  public uv(region: SpriteRegion, px: number, py: number, solid: boolean): [number, number] {
    const cell = this.cellFor(region, solid);
    const perRow = PlanetAtlas.SIZE / PlanetAtlas.CELL;
    const x = (cell % perRow) * PlanetAtlas.CELL + PlanetAtlas.PADDING + px;
    const y = Math.floor(cell / perRow) * PlanetAtlas.CELL + PlanetAtlas.PADDING + py;
    return [x / PlanetAtlas.SIZE, y / PlanetAtlas.SIZE];
  }

  /** Call after the meshes using new sprites are built, so the texture picks them up. */
  public refresh() {
    this.texture.needsUpdate = true;
  }

  private cellFor(region: SpriteRegion, solid: boolean): number {
    const existing = this.cells.get(region);
    if (existing !== undefined) return existing;

    const cell = this.cells.size;
    this.cells.set(region, cell);
    const perRow = PlanetAtlas.SIZE / PlanetAtlas.CELL;
    const cellX = (cell % perRow) * PlanetAtlas.CELL;
    const cellY = Math.floor(cell / perRow) * PlanetAtlas.CELL;

    const source = SpriteAtlas.getInstance().getRegion(region);
    if (source) {
      this.context.drawImage(
        SpriteAtlas.getInstance().getImage(),
        source.x,
        source.y,
        source.w,
        source.h,
        cellX + PlanetAtlas.PADDING,
        cellY + PlanetAtlas.PADDING,
        PlanetAtlas.SPRITE,
        PlanetAtlas.SPRITE
      );
    }
    const image = this.context.getImageData(cellX, cellY, PlanetAtlas.CELL, PlanetAtlas.CELL);
    PlanetAtlas.bleedColors(image, solid);
    this.context.putImageData(image, cellX, cellY);
    return cell;
  }
}
