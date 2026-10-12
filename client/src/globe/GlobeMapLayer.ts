import * as THREE from "three";
import { WorldView } from "../scene/Camera";

/**
 * A canvas the game draws part of its map into each frame, at some scale, for the globe to use as a
 * texture (see GlobeView). It's the shape of the screen, and it covers the world pixels from
 * `origin` on, `scale` canvas pixels to each.
 */
export class GlobeMapLayer {
  // The canvas's scale snaps down to a quarter of a doubling, so panning at one zoom keeps drawing
  // the map at the same scale; and it never draws it at more than this many times its size.
  private static readonly SCALE_STEPS_PER_DOUBLING = 4;
  private static readonly MAX_SCALE = 8;

  public readonly view: WorldView = { context: undefined, x: 0, y: 0, zoom: 1, pixelRatio: 1 };
  /** The world point at the canvas's top left corner. */
  public readonly origin = new THREE.Vector2();
  public scale = 1;
  public texture: THREE.CanvasTexture;
  private canvas: HTMLCanvasElement;

  public getWidth() {
    return this.canvas?.width ?? 0;
  }

  public getHeight() {
    return this.canvas?.height ?? 0;
  }

  public setSize(width: number, height: number) {
    if (this.canvas?.width === width && this.canvas.height === height) return;

    this.texture?.dispose();
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    const context = this.canvas.getContext("2d");
    context.imageSmoothingEnabled = false;
    this.view.context = context;

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.flipY = false;
    this.texture.generateMipmaps = false;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
  }

  /**
   * The scale the canvas would draw a part of the map at: as many canvas pixels to a world pixel as
   * `wanted` (the most screen pixels one covers), or fewer if that won't fit.
   */
  public scaleFor(width: number, height: number, wanted: number) {
    const fitted = Math.min(wanted, this.getWidth() / width, this.getHeight() / height, GlobeMapLayer.MAX_SCALE);
    const steps = GlobeMapLayer.SCALE_STEPS_PER_DOUBLING;
    return 2 ** (Math.floor(Math.log2(fitted) * steps) / steps);
  }

  /**
   * Centers the canvas on a world point at `scale`, starting it on a whole canvas pixel so panning
   * draws the map the same, and clears it for this frame's drawing.
   */
  public cover(middleX: number, middleY: number, scale: number) {
    const left = middleX - this.getWidth() / scale / 2;
    const top = middleY - this.getHeight() / scale / 2;
    this.scale = scale;
    this.origin.set(Math.floor(left * scale) / scale, Math.floor(top * scale) / scale);
    this.view.x = -this.origin.x * scale;
    this.view.y = -this.origin.y * scale;
    this.view.zoom = scale;

    const context = this.view.context;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /** Hands what was drawn this frame to the texture. */
  public upload() {
    this.texture.needsUpdate = true;
  }

  public dispose() {
    this.texture?.dispose();
  }
}
