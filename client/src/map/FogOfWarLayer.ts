import { Game } from "../Game";
import { Actor } from "../scene/Actor";

/**
 * Fog of war drawn as one soft overlay over the whole map, instead of a hard-edged hex tint per
 * tile. Only the look: which tiles are unexplored, remembered or in sight is still the server's
 * call (see PlayerVisibility there) - GameMap just reports each tile's state here.
 *
 * The overlay is a low-resolution mask, one cell per few world pixels, where each cell takes the
 * state of the tile it falls in. The mask is blurred so the states bleed into each other across
 * tile edges, then stretched over the map with image smoothing on. Unexplored cells are painted
 * the canvas's own background color, so the fade also hides the jagged hex outline of the known map.
 *
 * Changes only redo the part of the mask around the tiles that changed, the next time it's drawn,
 * so a reveal costs about the same on any map size and a burst of them costs one rebuild.
 */
export class FogOfWarLayer extends Actor {
  public static readonly UNEXPLORED = 0;
  public static readonly FOGGED = 1;
  public static readonly VISIBLE = 2;

  // Grid spacing of tiles on the map, in world pixels (see GameMap.ingestChunkTiles()).
  private static readonly TILE_STRIDE_X = 32;
  private static readonly TILE_STRIDE_Y = 25;
  private static readonly TILE_CENTER_OFFSET = 16;
  private static readonly WORLD_PIXELS_PER_CELL = 4;
  // Repeated box blur passes approximate a gaussian, about 5 world pixels wide either way.
  private static readonly BLUR_RADIUS = 1;
  private static readonly BLUR_PASSES = 2;
  // Unexplored spreads this many cells over its known neighbors before blurring, so the fade is
  // already fully opaque by the known map's hex outline - nothing but background lies past it, so
  // any see-through fog there would leave the jagged outline showing through.
  private static readonly UNEXPLORED_SPREAD = 2;
  private static readonly BLUR_REACH =
    FogOfWarLayer.BLUR_RADIUS * FogOfWarLayer.BLUR_PASSES + FogOfWarLayer.UNEXPLORED_SPREAD;
  // RGB 0-255 plus alpha 0-1. Fogged matches the old per-tile tint; unexplored is the canvas's "gray".
  private static readonly FOGGED_COLOR = [20, 20, 20, 0.55];
  private static readonly UNEXPLORED_COLOR = [128, 128, 128, 1];

  private readonly gridWidth: number;
  private readonly gridHeight: number;
  private readonly wrapped: boolean;
  private readonly cellsWide: number;
  private readonly cellsHigh: number;
  // Per tile, indexed gridX + gridY * gridWidth: one of UNEXPLORED / FOGGED / VISIBLE.
  private readonly tileStates: Uint8Array;
  // Per mask cell: index into tileStates of the tile it sits in. Geometry never changes, so worked out once.
  private readonly cellTiles: Int32Array;
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly pixels: ImageData;
  // Tile-grid bounds of everything changed since the last rebuild, or null when up to date.
  private dirty: { minX: number; minY: number; maxX: number; maxY: number } | null = null;

  constructor(gridWidth: number, gridHeight: number, wrapped: boolean) {
    const worldWidth = gridWidth * FogOfWarLayer.TILE_STRIDE_X + (wrapped ? 0 : FogOfWarLayer.TILE_CENTER_OFFSET);
    const worldHeight = gridHeight * FogOfWarLayer.TILE_STRIDE_Y + 7;
    const cellsWide = Math.ceil(worldWidth / FogOfWarLayer.WORLD_PIXELS_PER_CELL);
    const cellsHigh = Math.ceil(worldHeight / FogOfWarLayer.WORLD_PIXELS_PER_CELL);

    // Above terrain, resources and improvements (the map chunks, z 0), below units and cities (z 2).
    super({
      x: 0,
      y: 0,
      z: 1,
      width: cellsWide * FogOfWarLayer.WORLD_PIXELS_PER_CELL,
      height: cellsHigh * FogOfWarLayer.WORLD_PIXELS_PER_CELL
    });

    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.wrapped = wrapped;
    this.cellsWide = cellsWide;
    this.cellsHigh = cellsHigh;
    this.tileStates = new Uint8Array(gridWidth * gridHeight);
    this.cellTiles = this.mapCellsToTiles();

    this.canvas = document.createElement("canvas");
    this.canvas.width = cellsWide;
    this.canvas.height = cellsHigh;
    this.context = this.canvas.getContext("2d");
    this.pixels = this.context.createImageData(cellsWide, cellsHigh);

    this.markDirty(0, 0);
    this.markDirty(gridWidth - 1, gridHeight - 1);
  }

  /**
   * One box blur pass along one axis, in place: `lines` runs of `length` values each, `step` apart
   * within a run and `lineStep` apart between runs. Values past either end repeat the end value.
   */
  private static boxBlur(values: Float32Array, length: number, lines: number, step: number, lineStep: number) {
    const radius = FogOfWarLayer.BLUR_RADIUS;
    const span = radius * 2 + 1;
    const line = new Float32Array(length);

    for (let lineIndex = 0; lineIndex < lines; lineIndex++) {
      const start = lineIndex * lineStep;
      for (let i = 0; i < length; i++) line[i] = values[start + i * step];

      let sum = line[0] * (radius + 1);
      for (let i = 1; i <= radius; i++) sum += line[Math.min(i, length - 1)];

      for (let i = 0; i < length; i++) {
        values[start + i * step] = sum / span;
        sum += line[Math.min(i + radius + 1, length - 1)] - line[Math.max(i - radius, 0)];
      }
    }
  }

  // Grows the 1s in `values` by UNEXPLORED_SPREAD along one axis, in place - laid out as in boxBlur().
  private static spread(values: Float32Array, length: number, lines: number, step: number, lineStep: number) {
    const radius = FogOfWarLayer.UNEXPLORED_SPREAD;
    const line = new Float32Array(length);

    for (let lineIndex = 0; lineIndex < lines; lineIndex++) {
      const start = lineIndex * lineStep;
      for (let i = 0; i < length; i++) line[i] = values[start + i * step];

      for (let i = 0; i < length; i++) {
        let highest = 0;
        for (let j = Math.max(0, i - radius); j <= Math.min(length - 1, i + radius); j++) {
          highest = Math.max(highest, line[j]);
        }
        values[start + i * step] = highest;
      }
    }
  }

  public setTileState(gridX: number, gridY: number, state: number) {
    const index = gridX + gridY * this.gridWidth;
    if (this.tileStates[index] === state) return;

    this.tileStates[index] = state;
    this.markDirty(gridX, gridY);
  }

  public getTileState(gridX: number, gridY: number): number {
    return this.tileStates[gridX + gridY * this.gridWidth];
  }

  /** The overlay's color at a world position, as RGBA 0-255 - what the fade looks like there. */
  public getPixelAt(worldX: number, worldY: number): number[] {
    if (this.dirty) this.rebuild();

    const cellX = this.wrapCellX(Math.floor(worldX / FogOfWarLayer.WORLD_PIXELS_PER_CELL));
    const cellY = Math.min(Math.max(Math.floor(worldY / FogOfWarLayer.WORLD_PIXELS_PER_CELL), 0), this.cellsHigh - 1);
    const index = (cellX + cellY * this.cellsWide) * 4;
    return Array.from(this.pixels.data.slice(index, index + 4));
  }

  public draw(canvasContext: CanvasRenderingContext2D) {
    const game = Game.getInstance();
    if (canvasContext !== game.getCanvasContext()) return;

    if (this.dirty) this.rebuild();

    canvasContext.save();
    game.applyCameraTransform(canvasContext);
    // The mask is a handful of pixels per tile - smoothing is what turns it into a gradient.
    canvasContext.imageSmoothingEnabled = true;
    canvasContext.imageSmoothingQuality = "high";
    canvasContext.drawImage(this.canvas, this.x, this.y, this.width, this.height);
    canvasContext.restore();
  }

  private markDirty(gridX: number, gridY: number) {
    if (!this.dirty) {
      this.dirty = { minX: gridX, minY: gridY, maxX: gridX, maxY: gridY };
      return;
    }

    this.dirty.minX = Math.min(this.dirty.minX, gridX);
    this.dirty.minY = Math.min(this.dirty.minY, gridY);
    this.dirty.maxX = Math.max(this.dirty.maxX, gridX);
    this.dirty.maxY = Math.max(this.dirty.maxY, gridY);
  }

  // For every mask cell, the tile whose center is nearest - which, on this grid, is the hex it's in.
  private mapCellsToTiles(): Int32Array {
    const cellTiles = new Int32Array(this.cellsWide * this.cellsHigh);

    for (let cellY = 0; cellY < this.cellsHigh; cellY++) {
      const worldY = (cellY + 0.5) * FogOfWarLayer.WORLD_PIXELS_PER_CELL;
      const nearestRow = Math.round((worldY - FogOfWarLayer.TILE_CENTER_OFFSET) / FogOfWarLayer.TILE_STRIDE_Y);

      for (let cellX = 0; cellX < this.cellsWide; cellX++) {
        const worldX = (cellX + 0.5) * FogOfWarLayer.WORLD_PIXELS_PER_CELL;
        cellTiles[cellX + cellY * this.cellsWide] = this.nearestTileIndex(worldX, worldY, nearestRow);
      }
    }

    return cellTiles;
  }

  // Checks the nearest tile in the nearest row and the rows either side of it.
  private nearestTileIndex(worldX: number, worldY: number, nearestRow: number): number {
    let bestIndex = 0;
    let bestDistance = Infinity;

    for (let row = nearestRow - 1; row <= nearestRow + 1; row++) {
      const gridY = Math.min(Math.max(row, 0), this.gridHeight - 1);
      const rowOffset = gridY % 2 !== 0 ? FogOfWarLayer.TILE_STRIDE_X / 2 : 0;
      const column = Math.round((worldX - FogOfWarLayer.TILE_CENTER_OFFSET - rowOffset) / FogOfWarLayer.TILE_STRIDE_X);

      const centerX = column * FogOfWarLayer.TILE_STRIDE_X + rowOffset + FogOfWarLayer.TILE_CENTER_OFFSET;
      const centerY = gridY * FogOfWarLayer.TILE_STRIDE_Y + FogOfWarLayer.TILE_CENTER_OFFSET;
      const distance = (worldX - centerX) ** 2 + (worldY - centerY) ** 2;
      if (distance >= bestDistance) continue;

      bestDistance = distance;
      bestIndex = this.wrapColumn(column) + gridY * this.gridWidth;
    }

    return bestIndex;
  }

  private wrapColumn(column: number): number {
    if (this.wrapped) return ((column % this.gridWidth) + this.gridWidth) % this.gridWidth;
    return Math.min(Math.max(column, 0), this.gridWidth - 1);
  }

  private wrapCellX(cellX: number): number {
    if (this.wrapped) return ((cellX % this.cellsWide) + this.cellsWide) % this.cellsWide;
    return Math.min(Math.max(cellX, 0), this.cellsWide - 1);
  }

  /**
   * Redoes the dirty part of the mask. The blur reads BLUR_REACH cells past whatever it writes, so
   * it works on a region that much bigger than the cells being written, and throws the margin away.
   */
  private rebuild() {
    const { minX, minY, maxX, maxY } = this.dirty;
    this.dirty = null;

    // Tile bounds to cell bounds, padded by a tile since the hexes overhang their grid cell.
    const cellsPerTileX = FogOfWarLayer.TILE_STRIDE_X / FogOfWarLayer.WORLD_PIXELS_PER_CELL;
    const cellsPerTileY = FogOfWarLayer.TILE_STRIDE_Y / FogOfWarLayer.WORLD_PIXELS_PER_CELL;
    const reach = FogOfWarLayer.BLUR_REACH;
    let writeLeft = Math.floor((minX - 1) * cellsPerTileX) - reach;
    let writeRight = Math.ceil((maxX + 2) * cellsPerTileX) + reach;
    const writeTop = Math.max(0, Math.floor((minY - 1) * cellsPerTileY) - reach);
    const writeBottom = Math.min(this.cellsHigh, Math.ceil((maxY + 2) * cellsPerTileY) + reach);

    // Past a whole map's width the region would wrap onto itself.
    if (!this.wrapped || writeRight - writeLeft >= this.cellsWide) {
      writeLeft = Math.max(0, writeLeft);
      writeRight = Math.min(this.cellsWide, writeRight);
    }

    const readLeft = writeLeft - reach;
    const readTop = writeTop - reach;
    const width = writeRight - writeLeft + 2 * reach;
    const height = writeBottom - writeTop + 2 * reach;

    // How much of each cell is fogged and how much unexplored, blurred.
    const fogged = new Float32Array(width * height);
    const unexplored = new Float32Array(width * height);
    for (let y = 0; y < height; y++) {
      const cellY = Math.min(Math.max(readTop + y, 0), this.cellsHigh - 1);
      for (let x = 0; x < width; x++) {
        const state = this.tileStates[this.cellTiles[this.wrapCellX(readLeft + x) + cellY * this.cellsWide]];
        fogged[x + y * width] = state === FogOfWarLayer.FOGGED ? 1 : 0;
        unexplored[x + y * width] = state === FogOfWarLayer.UNEXPLORED ? 1 : 0;
      }
    }

    FogOfWarLayer.spread(unexplored, width, height, 1, width);
    FogOfWarLayer.spread(unexplored, height, width, width, 1);

    for (const channel of [fogged, unexplored]) {
      for (let pass = 0; pass < FogOfWarLayer.BLUR_PASSES; pass++) {
        FogOfWarLayer.boxBlur(channel, width, height, 1, width);
        FogOfWarLayer.boxBlur(channel, height, width, width, 1);
      }
    }

    this.writePixels(fogged, unexplored, width, writeLeft, writeRight, writeTop, writeBottom);

    // The written columns may run off either edge of a wrapped map; put the whole band back then.
    const inBounds = writeLeft >= 0 && writeRight <= this.cellsWide;
    const putLeft = inBounds ? writeLeft : 0;
    const putWidth = inBounds ? writeRight - writeLeft : this.cellsWide;
    this.context.putImageData(this.pixels, 0, 0, putLeft, writeTop, putWidth, writeBottom - writeTop);
  }

  // Mixes the blurred fogged/unexplored amounts into colors (premultiplied, then back out for ImageData).
  private writePixels(
    fogged: Float32Array,
    unexplored: Float32Array,
    width: number,
    writeLeft: number,
    writeRight: number,
    writeTop: number,
    writeBottom: number
  ) {
    const reach = FogOfWarLayer.BLUR_REACH;
    const [fogR, fogG, fogB, fogA] = FogOfWarLayer.FOGGED_COLOR;
    const [unR, unG, unB, unA] = FogOfWarLayer.UNEXPLORED_COLOR;
    const data = this.pixels.data;

    for (let cellY = writeTop; cellY < writeBottom; cellY++) {
      const y = cellY - writeTop + reach;
      for (let cellX = writeLeft; cellX < writeRight; cellX++) {
        const source = cellX - writeLeft + reach + y * width;
        // Unexplored laid over fogged, where the spread has one overlapping the other.
        const unexploredAlpha = unexplored[source] * unA;
        const fogAlpha = fogged[source] * fogA * (1 - unexploredAlpha);
        const alpha = fogAlpha + unexploredAlpha;
        const target = (this.wrapCellX(cellX) + cellY * this.cellsWide) * 4;

        if (alpha <= 0) {
          data[target + 3] = 0;
          continue;
        }

        data[target] = (fogR * fogAlpha + unR * unexploredAlpha) / alpha;
        data[target + 1] = (fogG * fogAlpha + unG * unexploredAlpha) / alpha;
        data[target + 2] = (fogB * fogAlpha + unB * unexploredAlpha) / alpha;
        data[target + 3] = alpha * 255;
      }
    }
  }
}
