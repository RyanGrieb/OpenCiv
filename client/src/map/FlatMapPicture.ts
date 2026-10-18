import { Game } from "../Game";
import { Actor } from "../scene/Actor";
import { SceneObject } from "../scene/SceneObject";

// One of the picture's canvases, over a square of the world, and whether a chunk on it changed since it was drawn.
interface Page {
  context: CanvasRenderingContext2D;
  dirty: boolean;
}

/**
 * The map's chunks as the flat map shows them - terrain, what lies on the ground, what stands on it -
 * painted together onto a few big canvases (pages), each over a square of the world, so that a frame
 * draws one picture per page in view rather than every chunk of every layer: a few draws instead of
 * hundreds, more so zoomed out. Pixel for pixel what drawing the chunks would show, as nothing else
 * is drawn between them (they lie under the fog of war, z 1, and all else). A page is painted again
 * from its chunks, in their order, only once one of them comes, goes or changes, and only once it's
 * in view. The chunks stay in the scene, for the globe, which draws them itself.
 */
export class FlatMapPicture extends Actor {
  // A page's side, in world pixels.
  private static readonly PAGE = 512;
  // How far each page reaches into its neighbors, painted the same as them there: where a page's edge
  // falls between screen pixels it's smoothed, and would let the background show through between pages.
  private static readonly OVERLAP = 1;
  private static readonly covered = new WeakSet<SceneObject>();

  private readonly chunks = new Set<Actor>();
  private readonly pages = new Map<string, Page>();
  private sorted: Actor[] | undefined;

  constructor() {
    super({ x: 0, y: 0, z: 0, width: 0, height: 0 });
  }

  /** Whether a scene object is drawn on the flat map as part of a picture, rather than by itself. */
  public static covers(object: SceneObject) {
    return FlatMapPicture.covered.has(object);
  }

  private static keyOf(column: number, row: number) {
    return `${column},${row}`;
  }

  /** Paints a chunk into the picture, in its z order with the others. */
  public addChunk(chunk: Actor) {
    this.chunks.add(chunk);
    FlatMapPicture.covered.add(chunk);
    this.sorted = undefined;
    this.markUnder(chunk);
  }

  /** Takes a chunk out of the picture. */
  public removeChunk(chunk: Actor | undefined) {
    if (!chunk || !this.chunks.delete(chunk)) return;

    FlatMapPicture.covered.delete(chunk);
    this.sorted = undefined;
    this.markUnder(chunk);
  }

  public draw(canvasContext: CanvasRenderingContext2D) {
    const game = Game.getInstance();
    const camera = game.getCurrentScene().getCamera();
    // The globe paints the chunks onto itself.
    if (camera.rendersWorldOffscreen() || !game.isWorldContext(canvasContext) || this.chunks.size === 0) return;

    const view = camera.getWorldView();
    const scale = view.zoom * view.pixelRatio;
    const offsetX = game.getWorldDrawOffsetX();
    // The part of the world in view, in this copy of it across a wrapped map's seam (which the camera's
    // transform shifts it to).
    const left = -view.x / view.zoom - offsetX;
    const top = -view.y / view.zoom;
    const right = left + canvasContext.canvas.width / scale;
    const bottom = top + canvasContext.canvas.height / scale;

    const page = FlatMapPicture.PAGE;
    canvasContext.save();
    game.applyCameraTransform(canvasContext);
    for (let row = Math.max(0, Math.floor(top / page)); row * page < bottom; row++) {
      for (let column = Math.max(0, Math.floor(left / page)); column * page < right; column++) {
        const drawn = this.pages.get(FlatMapPicture.keyOf(column, row));
        if (!drawn) continue;

        if (drawn.dirty) this.paint(drawn, column, row);
        const overlap = FlatMapPicture.OVERLAP;
        canvasContext.drawImage(drawn.context.canvas, column * page - overlap, row * page - overlap);
      }
    }
    canvasContext.restore();
  }

  // Marks the pages a chunk lies over to be painted again, making any that don't exist yet.
  private markUnder(chunk: Actor) {
    const page = FlatMapPicture.PAGE;
    const overlap = FlatMapPicture.OVERLAP;
    const [x, y] = [chunk.getX() - overlap, chunk.getY() - overlap];
    const [right, bottom] = [chunk.getX() + chunk.getWidth() + overlap, chunk.getY() + chunk.getHeight() + overlap];
    for (let row = Math.max(0, Math.floor(y / page)); row * page < bottom; row++) {
      for (let column = Math.max(0, Math.floor(x / page)); column * page < right; column++) {
        const key = FlatMapPicture.keyOf(column, row);
        const existing = this.pages.get(key);
        if (existing) {
          existing.dirty = true;
          continue;
        }

        const canvas = document.createElement("canvas");
        canvas.width = page + overlap * 2;
        canvas.height = page + overlap * 2;
        this.pages.set(key, { context: canvas.getContext("2d"), dirty: true });
      }
    }
  }

  // Paints a page from scratch: every chunk over it, in the order the scene would draw them.
  private paint(page: Page, column: number, row: number) {
    this.sorted ??= [...this.chunks].sort((a, b) => a.getZIndex() - b.getZIndex());
    const overlap = FlatMapPicture.OVERLAP;
    const side = FlatMapPicture.PAGE + overlap * 2;
    const [pageX, pageY] = [column * FlatMapPicture.PAGE - overlap, row * FlatMapPicture.PAGE - overlap];
    const context = page.context;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, side, side);
    context.imageSmoothingEnabled = false;
    context.setTransform(1, 0, 0, 1, -pageX, -pageY);
    for (const chunk of this.sorted) {
      const [x, y, width, height] = [chunk.getX(), chunk.getY(), chunk.getWidth(), chunk.getHeight()];
      if (x >= pageX + side || y >= pageY + side || x + width <= pageX || y + height <= pageY) continue;

      context.globalAlpha = chunk.getTransparency();
      context.drawImage(chunk.getImage(), x, y, width, height);
    }
    context.globalAlpha = 1;
    page.dirty = false;
  }
}
