import * as THREE from "three";
import { Game } from "../Game";
import { GameMap } from "../map/GameMap";
import { WorldView } from "../scene/Camera";
import { Line } from "../scene/Line";
import { SceneObject } from "../scene/SceneObject";
import { Standing } from "../scene/Standing";
import { Fingerprint } from "./Fingerprint";
import { GlobeProjection } from "./GlobeProjection";

// One of GlobeGround's canvases, with the texture the globe samples it through.
class GroundLayer {
  public readonly view: WorldView;
  public readonly texture: THREE.CanvasTexture;
  private readonly canvas: HTMLCanvasElement;
  private drawn: number | undefined;

  constructor(width: number, height: number, scale: number, anisotropy: number) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    const context = this.canvas.getContext("2d");
    context.imageSmoothingEnabled = false;
    this.view = { context, x: 0, y: 0, zoom: scale, pixelRatio: 1 };

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.flipY = false;
    // Filtered without dark fringes around what's partly see-through (borders over the terrain).
    this.texture.premultiplyAlpha = true;
    this.texture.wrapS = THREE.RepeatWrapping;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.anisotropy = anisotropy;
  }

  /** Whether what it would draw now, by its fingerprint, isn't what it shows - so it needs drawing. */
  public isStale(fingerprint: number) {
    return fingerprint !== this.drawn;
  }

  /** Clears the canvas for drawing what has this fingerprint, which the texture then gets. */
  public redraw(fingerprint: number, draw: () => void) {
    const context = this.view.context;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    draw();
    this.texture.needsUpdate = true;
    this.drawn = fingerprint;
  }

  public dispose() {
    this.texture.dispose();
  }
}

/**
 * The map's ground as the globe shows it: the whole world on two canvases, a canvas pixel to each
 * world pixel (fewer if that won't fit in a texture) - the terrain with the fog of war over it, and
 * what's drawn over that (territory, the hovered tile). Each is drawn again only when what's on it
 * changes, so most frames leave the GPU's copies of both alone. What stands up off the ground - trees,
 * units, labels - isn't on either: GlobeSprites draws those. Nor are lines - borders, outlines, paths -
 * which a pixel to a world pixel would blur: GlobeLines draws those.
 */
export class GlobeGround {
  public readonly terrain: GroundLayer;
  public readonly overlay: GroundLayer;
  private readonly projection: GlobeProjection;
  private readonly scale: number;

  constructor(projection: GlobeProjection, maxTextureSize: number, anisotropy: number) {
    this.projection = projection;
    this.scale = Math.min(1, maxTextureSize / projection.worldWidth, maxTextureSize / projection.worldHeight);
    const width = Math.round(projection.worldWidth * this.scale);
    const height = Math.ceil(projection.worldHeight * this.scale);
    this.terrain = new GroundLayer(width, height, this.scale, anisotropy);
    this.overlay = new GroundLayer(width, height, this.scale, anisotropy);
  }

  /** Canvas pixels to a world pixel. */
  public getScale() {
    return this.scale;
  }

  /** The size of either canvas, in its pixels. */
  public getSize(): [number, number] {
    const canvas = this.terrain.view.context.canvas;
    return [canvas.width, canvas.height];
  }

  /**
   * Brings both canvases up to date with the scene's camera-space objects - those of them that lie
   * on the ground - drawing each through `useView` so the game's drawing code finds it as the canvas
   * the map is being drawn into.
   */
  public update(objects: SceneObject[], useView: (view: WorldView) => void) {
    const map = GameMap.getInstance();
    const fog = map.getFogOfWar();
    const terrain = objects.filter((object) => map.getLayerOf(object) === "terrain");
    const overlay = objects.filter(
      (object) => object !== fog && !map.getLayerOf(object) && !Standing.get(object) && !(object instanceof Line)
    );

    const terrainPrint = new Fingerprint().add(map.getStandingVersion()).add(fog?.getVersion() ?? -1);
    terrain.forEach((object) => terrainPrint.addObject(object));
    if (this.terrain.isStale(terrainPrint.value())) {
      this.terrain.redraw(terrainPrint.value(), () => {
        useView(this.terrain.view);
        this.drawAcrossSeam(terrain);
        this.paintBareGround();
        if (fog) this.drawAcrossSeam([fog]);
      });
    }

    const overlayPrint = new Fingerprint();
    overlay.forEach((object) => overlayPrint.addObject(object));
    if (this.overlay.isStale(overlayPrint.value())) {
      this.overlay.redraw(overlayPrint.value(), () => {
        useView(this.overlay.view);
        this.drawAcrossSeam(overlay);
      });
    }
  }

  public dispose() {
    this.terrain.dispose();
    this.overlay.dispose();
  }

  // Draws objects once where they are and once a world-width to either side, so whatever crosses the
  // map's east or west edge shows at the other edge too, where the canvas wraps around the globe.
  private drawAcrossSeam(objects: SceneObject[]) {
    const game = Game.getInstance();
    const context = game.getCurrentScene().getCamera().getWorldView().context;
    const worldWidth = this.projection.worldWidth;
    for (const object of objects) {
      for (const offsetX of [-worldWidth, 0, worldWidth]) {
        game.setWorldDrawOffsetX(offsetX);
        object.draw(context);
      }
    }
    game.setWorldDrawOffsetX(0);
  }

  // Covers mountains' painted peaks and hills' mounds with bare ground, as they stand up off it on the globe.
  private paintBareGround() {
    const context = this.terrain.view.context;
    const worldWidth = this.projection.worldWidth;
    context.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    for (const patch of GameMap.getInstance().getBareGround()) {
      for (const offsetX of [-worldWidth, 0, worldWidth]) {
        context.drawImage(patch.image, patch.x + offsetX, patch.y);
      }
    }
    context.setTransform(1, 0, 0, 1, 0, 0);
  }
}
