import * as THREE from "three";

/**
 * A canvas that images are packed into, row by row, for the GPU to draw them all from one texture.
 * It grows taller (twice as tall each time) when it runs out of room, up to `maxSize`.
 */
export class AtlasCanvas {
  // Clear pixels around each image, so sampling at its edge never picks up its neighbor's.
  public static readonly PADDING = 2;

  public texture: THREE.CanvasTexture;
  public context: CanvasRenderingContext2D;
  private readonly startHeight: number;
  private readonly maxSize: number;
  private shelfX = 0;
  private shelfY = 0;
  private shelfHeight = 0;

  constructor(width: number, height: number, maxSize: number) {
    this.startHeight = height;
    this.maxSize = maxSize;
    this.setCanvas(AtlasCanvas.createCanvas(width, height));
  }

  private static createCanvas(width: number, height: number) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  public getSize(): [number, number] {
    return [this.context.canvas.width, this.context.canvas.height];
  }

  /** Empties it, for packing everything again - back at the height it started at, if it grew. */
  public clear() {
    const [width, height] = this.getSize();
    if (height > this.startHeight) {
      this.texture.dispose();
      this.setCanvas(AtlasCanvas.createCanvas(width, this.startHeight));
    } else {
      this.context.setTransform(1, 0, 0, 1, 0, 0);
      this.context.clearRect(0, 0, width, height);
    }
    this.shelfX = 0;
    this.shelfY = 0;
    this.shelfHeight = 0;
  }

  /** Room for an image this big (padding around it included): its top left corner, or undefined if it won't fit. */
  public place(width: number, height: number): [number, number] | undefined {
    const padded = [Math.ceil(width) + 2 * AtlasCanvas.PADDING, Math.ceil(height) + 2 * AtlasCanvas.PADDING];
    const [canvasWidth] = this.getSize();
    if (padded[0] > canvasWidth) return undefined;

    if (this.shelfX + padded[0] > canvasWidth) {
      this.shelfY += this.shelfHeight;
      this.shelfX = 0;
      this.shelfHeight = 0;
    }
    while (this.shelfY + padded[1] > this.getSize()[1]) {
      if (!this.grow()) return undefined;
    }

    const corner: [number, number] = [this.shelfX + AtlasCanvas.PADDING, this.shelfY + AtlasCanvas.PADDING];
    this.shelfX += padded[0];
    this.shelfHeight = Math.max(this.shelfHeight, padded[1]);
    return corner;
  }

  /** Hands what was drawn to the texture. */
  public upload() {
    this.texture.needsUpdate = true;
  }

  public dispose() {
    this.texture.dispose();
  }

  // Twice as tall, keeping what's packed so far - false if that's past the largest it may be.
  private grow(): boolean {
    const [width, height] = this.getSize();
    if (height * 2 > this.maxSize) return false;

    const canvas = AtlasCanvas.createCanvas(width, height * 2);
    canvas.getContext("2d").drawImage(this.context.canvas, 0, 0);
    this.texture.dispose();
    this.setCanvas(canvas);
    return true;
  }

  private setCanvas(canvas: HTMLCanvasElement) {
    this.context = canvas.getContext("2d");
    this.context.imageSmoothingEnabled = false;
    this.texture = new THREE.CanvasTexture(canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.flipY = false;
    this.texture.generateMipmaps = false;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
  }
}
