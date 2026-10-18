import * as THREE from "three";
import { Game } from "../Game";
import { FogOfWarLayer } from "../map/FogOfWarLayer";
import { GameMap, StandingSprite } from "../map/GameMap";
import { Actor } from "../scene/Actor";
import { ActorGroup } from "../scene/ActorGroup";
import { WorldView } from "../scene/Camera";
import { Line } from "../scene/Line";
import { SceneObject } from "../scene/SceneObject";
import { Standing } from "../scene/Standing";
import { Fingerprint } from "./Fingerprint";
import { GlobeProjection } from "./GlobeProjection";

// A rectangle of the world, in its pixels.
interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Something on the ground as it was at the last update: how it looked (its fingerprint), the part of
// the world it covers, and whether an image of it was still loading.
interface Placed extends Area {
  object: SceneObject;
  print: number;
  loading: boolean;
}

// One of the texture's patches: where it lies in the texture, in texels, and in the world.
interface Patch {
  left: number;
  top: number;
  texelsWide: number;
  texelsHigh: number;
  world: Area;
}

/**
 * The map's ground as the globe shows it: the whole world in one texture, a texel to each world pixel -
 * the terrain, the fog of war over it, and what's drawn over that (territory, the hovered tile). Only
 * on maps too big for that does a texel cover 2 or 4 world pixels, averaging them; never some other
 * share of one, which drops rows and columns of the art unevenly.
 *
 * The texture is cut into square patches, and only those under something that changed are drawn
 * again - on a canvas a patch big, then copied into the texture - so hovering another tile or taking
 * a step changes a few patches rather than the whole world, however big the map. A patch under an
 * image that's still loading waits for it a while, keeping what it showed. What stands up off the
 * ground - trees, units, labels - isn't in the texture: GlobeSprites draws those. Nor are lines -
 * borders, outlines, paths - which a texel to a world pixel would blur: GlobeLines draws those.
 */
export class GlobeGround {
  // A patch's side, in texels.
  private static readonly PATCH = 256;
  // The most texels the texture may have, about 210 MB of GPU memory with its mipmaps: enough for
  // every map size the game offers, and custom ones up to about twice the biggest across.
  private static readonly MAX_TEXELS = 40 * 1024 * 1024;
  // How many frames a patch waits for an image on it to load before it's drawn without it.
  private static readonly IMAGE_PATIENCE = 30;
  private static readonly NOWHERE: number[] = [];
  // For what could be drawn anywhere: an object that isn't an actor, whose size isn't known.
  private static readonly EVERYWHERE: Area = { x: -1e9, y: -1e9, width: 2e9, height: 2e9 };

  public readonly texture: THREE.DataTexture;
  /** The world view of the canvas patches are drawn on, at the patch being drawn: a pixel to a world pixel. */
  public readonly view: WorldView;
  private readonly projection: GlobeProjection;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scale: number;
  private readonly texelsWide: number;
  private readonly texelsHigh: number;
  private readonly columns: number;
  // The canvases a patch is drawn on: the first a pixel to each world pixel, each after it half the
  // size of the one before, down to a pixel to each texel. A halved patch is averaged by halving the
  // whole canvas, rather than by drawing the map's images smaller, which the browser doesn't always
  // average the same way.
  private readonly canvases: CanvasRenderingContext2D[];
  // The last of them, as a texture to copy from. It's never in a material, so the GPU never holds a
  // copy of it, and a copy reads the canvas as it is now.
  private readonly patchTexture: THREE.Texture;
  private readonly patchRegion = new THREE.Box2();
  private readonly patchPosition = new THREE.Vector2();
  private readonly dirty = new Set<number>();
  private readonly waited = new Map<number, number>();
  // How many patches have been copied into the texture, to tell when it holds still.
  private patchesCopied = 0;
  private placed = new Map<SceneObject, Placed>();
  private terrain: Placed[] = [];
  private overlay: Placed[] = [];
  private bareGround: StandingSprite[] = [];
  private bareGroundVersion = -1;

  constructor(projection: GlobeProjection, renderer: THREE.WebGLRenderer, anisotropy: number) {
    this.projection = projection;
    this.renderer = renderer;
    this.scale = GlobeGround.scaleFor(projection, renderer.capabilities.maxTextureSize);
    this.texelsWide = projection.worldWidth * this.scale;
    this.texelsHigh = Math.ceil(projection.worldHeight * this.scale);
    this.columns = Math.ceil(this.texelsWide / GlobeGround.PATCH);
    this.texture = GlobeGround.createTexture(this.texelsWide, this.texelsHigh, anisotropy);
    renderer.initTexture(this.texture);

    const halvings = Math.round(Math.log2(1 / this.scale));
    this.canvases = Array.from({ length: halvings + 1 }, (_, index) =>
      GlobeGround.createCanvas(GlobeGround.PATCH * 2 ** (halvings - index), index > 0)
    );
    this.view = { context: this.canvases[0], x: 0, y: 0, zoom: 1, pixelRatio: 1 };
    this.patchTexture = new THREE.Texture(this.canvases[halvings].canvas);
    this.redrawAll();
  }

  // A texel to each world pixel, or to 2, 4... if that's too big for the GPU, or for MAX_TEXELS.
  private static scaleFor(projection: GlobeProjection, maxTextureSize: number) {
    const { worldWidth, worldHeight } = projection;
    let scale = 1;
    while (
      worldWidth * scale > maxTextureSize ||
      worldHeight * scale > maxTextureSize ||
      worldWidth * worldHeight * scale * scale > GlobeGround.MAX_TEXELS
    ) {
      scale /= 2;
    }
    return scale;
  }

  // The texture, its GPU memory claimed but left empty until patches are copied in. Filtered without
  // dark fringes around what's partly see-through (territory over the terrain), and wrapping around
  // the globe east to west.
  private static createTexture(width: number, height: number, anisotropy: number) {
    const texture = new THREE.DataTexture(null, width, height);
    texture.source.dataReady = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.premultiplyAlpha = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = anisotropy;
    texture.needsUpdate = true;
    return texture;
  }

  // A square canvas, kept off the GPU: what's drawn on it - the map's images - is in memory, and it's
  // copied from there. Smoothed, it averages what's drawn on it at half size.
  private static createCanvas(side: number, smoothed: boolean) {
    const canvas = document.createElement("canvas");
    canvas.width = side;
    canvas.height = side;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.imageSmoothingEnabled = smoothed;
    return context;
  }

  // The part of the world an object covers: all of its actors, for a group.
  private static areaOf(object: SceneObject): Area {
    if (!(object instanceof Actor)) return GlobeGround.EVERYWHERE;

    const actors = object instanceof ActorGroup ? object.getActors() : [object];
    if (actors.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

    const left = Math.min(...actors.map((actor) => actor.getX()));
    const top = Math.min(...actors.map((actor) => actor.getY()));
    const right = Math.max(...actors.map((actor) => actor.getX() + actor.getWidth()));
    const bottom = Math.max(...actors.map((actor) => actor.getY() + actor.getHeight()));
    return { x: left, y: top, width: right - left, height: bottom - top };
  }

  private static isLoading(object: SceneObject) {
    if (!(object instanceof Actor)) return false;

    const actors = object instanceof ActorGroup ? [object, ...object.getActors()] : [object];
    return actors.some((actor) => (actor.getImage() as HTMLImageElement | undefined)?.complete === false);
  }

  /** World pixels to a texel. */
  public getScale() {
    return this.scale;
  }

  /** How many patches have been copied into the texture so far: it changed when this did. */
  public getPatchesCopied() {
    return this.patchesCopied;
  }

  /** The texture's size, in texels. */
  public getSize(): [number, number] {
    return [this.texelsWide, this.texelsHigh];
  }

  /**
   * Brings the texture up to date with the scene's camera-space objects - those of them that lie on
   * the ground - drawing them through `useView` so the game's drawing code finds the patch's canvas
   * as the one the map is being drawn into.
   */
  public update(objects: SceneObject[], useView: (view: WorldView) => void) {
    const map = GameMap.getInstance();
    const fog = map.getFogOfWar();
    this.placeObjects(objects, map, fog);
    this.placeBareGround(map);
    for (const area of fog?.takeRepaintedAreas() ?? []) {
      this.markArea(area);
    }
    this.drawPatches(fog, useView);
  }

  /** Has every patch drawn again on the next update, as after the GPU loses what it held. */
  public redrawAll() {
    const patches = this.columns * Math.ceil(this.texelsHigh / GlobeGround.PATCH);
    for (let index = 0; index < patches; index++) {
      this.dirty.add(index);
    }
  }

  public dispose() {
    this.texture.dispose();
  }

  // Notes what's on the ground now, in the order it's drawn, marking where anything changed, came or went.
  private placeObjects(objects: SceneObject[], map: GameMap, fog: FogOfWarLayer | undefined) {
    const placed = new Map<SceneObject, Placed>();
    const place = (object: SceneObject): Placed => {
      const print = new Fingerprint().addObject(object).value();
      const before = this.placed.get(object);
      const now =
        before?.print === print
          ? before
          : { object, print, loading: GlobeGround.isLoading(object), ...GlobeGround.areaOf(object) };
      if (now !== before) {
        if (before) this.markArea(before);
        this.markArea(now);
      }
      placed.set(object, now);
      return now;
    };

    this.terrain = objects.filter((object) => map.getLayerOf(object) === "terrain").map(place);
    this.overlay = objects
      .filter(
        (object) => object !== fog && !map.getLayerOf(object) && !Standing.get(object) && !(object instanceof Line)
      )
      .map(place);
    for (const [object, before] of this.placed) {
      if (!placed.has(object)) this.markArea(before);
    }
    this.placed = placed;
  }

  // Notes the bare ground painted over mountains' peaks and hills' mounds, marking patches that came or went.
  private placeBareGround(map: GameMap) {
    if (map.getStandingVersion() === this.bareGroundVersion) return;

    this.bareGroundVersion = map.getStandingVersion();
    const bareGround = map.getBareGround();
    const now = new Set(bareGround);
    const before = new Set(this.bareGround);
    const gone = this.bareGround.filter((patch) => !now.has(patch));
    const come = bareGround.filter((patch) => !before.has(patch));
    for (const patch of [...gone, ...come]) {
      const { width, height } = patch.image as HTMLCanvasElement;
      this.markArea({ x: patch.x, y: patch.y, width, height });
    }
    this.bareGround = bareGround;
  }

  // Marks the patches over a part of the world (a texel more all round, for the edges of what's drawn
  // there) to be drawn again, wrapping around east to west.
  private markArea(area: Area) {
    if (area.width <= 0 || area.height <= 0) return;

    const patch = GlobeGround.PATCH;
    const top = Math.max(0, Math.floor(area.y * this.scale) - 1);
    const bottom = Math.min(this.texelsHigh, Math.ceil((area.y + area.height) * this.scale) + 1);
    let left = Math.floor(area.x * this.scale) - 1;
    let right = Math.ceil((area.x + area.width) * this.scale) + 1;
    if (right - left >= this.texelsWide) [left, right] = [0, this.texelsWide];

    for (let row = Math.floor(top / patch); row * patch < bottom; row++) {
      for (let texelX = left; texelX < right; ) {
        const wrapped = ((texelX % this.texelsWide) + this.texelsWide) % this.texelsWide;
        const column = Math.floor(wrapped / patch);
        this.dirty.add(row * this.columns + column);
        texelX += Math.min((column + 1) * patch, this.texelsWide) - wrapped;
      }
    }
  }

  // Draws the marked patches into the texture, but for those waiting on an image, then has the GPU
  // work out the texture's smaller copies (its mipmaps) again, once.
  private drawPatches(fog: FogOfWarLayer | undefined, useView: (view: WorldView) => void) {
    const ready = [...this.dirty]
      .map((index) => ({ index, patch: this.patchAt(index) }))
      .filter(({ index, patch }) => !this.waitsForImages(index, patch));
    ready.forEach(({ index, patch }, order) => {
      this.dirty.delete(index);
      this.waited.delete(index);
      this.drawPatch(patch, fog, useView);
      this.patchRegion.min.set(0, 0);
      this.patchRegion.max.set(patch.texelsWide, patch.texelsHigh);
      this.patchPosition.set(patch.left, patch.top);
      // A copy into the texture remakes all its mipmaps when the texture asks for them, so only the last does.
      this.texture.generateMipmaps = order === ready.length - 1;
      this.renderer.copyTextureToTexture(this.patchTexture, this.texture, this.patchRegion, this.patchPosition);
      this.patchesCopied++;
    });
    this.texture.generateMipmaps = true;
    this.view.x = 0;
    this.view.y = 0;
  }

  private patchAt(index: number): Patch {
    const patch = GlobeGround.PATCH;
    const left = (index % this.columns) * patch;
    const top = Math.floor(index / this.columns) * patch;
    const texelsWide = Math.min(patch, this.texelsWide - left);
    const texelsHigh = Math.min(patch, this.texelsHigh - top);
    const world = {
      x: left / this.scale,
      y: top / this.scale,
      width: texelsWide / this.scale,
      height: texelsHigh / this.scale
    };
    return { left, top, texelsWide, texelsHigh, world };
  }

  // Whether a patch should wait another frame for an image on it to load.
  private waitsForImages(index: number, patch: Patch) {
    const loading = [this.terrain, this.overlay].some((placed) =>
      placed.some((each) => each.loading && this.copiesOver(each, patch.world).length > 0)
    );
    if (!loading) return false;

    const waited = (this.waited.get(index) ?? 0) + 1;
    this.waited.set(index, waited);
    return waited <= GlobeGround.IMAGE_PATIENCE;
  }

  // The patch's ground, from the bottom up: the terrain, the bare ground over what stands up off it,
  // the fog, then territory and the like - then halved down to the texture's size.
  private drawPatch(patch: Patch, fog: FogOfWarLayer | undefined, useView: (view: WorldView) => void) {
    const context = this.view.context;
    const { x, y, width, height } = patch.world;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    this.view.x = -x;
    this.view.y = -y;
    useView(this.view);

    this.drawPlaced(this.terrain, patch);
    context.setTransform(1, 0, 0, 1, -x, -y);
    for (const bare of this.bareGround) {
      const { width, height } = bare.image as HTMLCanvasElement;
      for (const offsetX of this.copiesOver({ x: bare.x, y: bare.y, width, height }, patch.world)) {
        context.drawImage(bare.image, bare.x + offsetX, bare.y);
      }
    }
    fog?.drawArea(context, x, y, width, height);
    context.setTransform(1, 0, 0, 1, 0, 0);
    this.drawPlaced(this.overlay, patch);

    for (let index = 1; index < this.canvases.length; index++) {
      const halved = this.canvases[index];
      halved.clearRect(0, 0, halved.canvas.width, halved.canvas.height);
      halved.drawImage(this.canvases[index - 1].canvas, 0, 0, halved.canvas.width, halved.canvas.height);
    }
  }

  // Draws each object over the patch, once for each copy of it over it.
  private drawPlaced(placed: Placed[], patch: Patch) {
    const game = Game.getInstance();
    for (const each of placed) {
      for (const offsetX of this.copiesOver(each, patch.world)) {
        game.setWorldDrawOffsetX(offsetX);
        each.object.draw(this.view.context);
      }
    }
    game.setWorldDrawOffsetX(0);
  }

  // Of an area where it is and a world's width to either side - as the map repeats where it wraps
  // around the globe - the shifts of those over a part of the world.
  private copiesOver(area: Area, over: Area): number[] {
    if (area.y >= over.y + over.height || area.y + area.height <= over.y) return GlobeGround.NOWHERE;

    const worldWidth = this.projection.worldWidth;
    return [-worldWidth, 0, worldWidth].filter(
      (offsetX) => area.x + offsetX < over.x + over.width && area.x + area.width + offsetX > over.x
    );
  }
}
