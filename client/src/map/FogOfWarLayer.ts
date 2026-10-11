import { GameImage, SpriteRegion } from "../Assets";
import { Game } from "../Game";
import { Actor } from "../scene/Actor";
import { SpriteAtlas } from "../SpriteAtlas";

/**
 * Fog of war drawn as one soft overlay over the whole map, instead of a hard-edged hex tint per
 * tile. Only the look: which tiles are unexplored, remembered or in sight is still the server's
 * call (see PlayerVisibility there) - GameMap just reports each tile's state here.
 *
 * The overlay is a low-resolution mask, one cell per few world pixels, where each cell takes the
 * state of the tile it falls in. The mask is blurred so the states bleed into each other across
 * tile edges. Remembered tiles get a dark tint: the mask stretched over the map with image
 * smoothing on. Unexplored tiles are covered by clouds: the FOG_CLOUDS texture repeated over the
 * map at one texel per world pixel, its opacity taken from the blurred mask, so the clouds thin out
 * toward known tiles. Brighter cloud tops reach further out than the dim haze between them, which
 * makes the edge billow rather than fade evenly. The cloud cover is fully opaque by the known map's
 * hex outline, so its jagged edge never shows.
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
  // A mask cell that lies beyond the map's outermost tiles.
  private static readonly OFF_MAP = -1;
  // Repeated box blur passes approximate a gaussian, about 5 world pixels wide either way.
  private static readonly BLUR_RADIUS = 1;
  private static readonly BLUR_PASSES = 2;
  // Unexplored spreads this many cells over its known neighbors before blurring, so the clouds are
  // already opaque by the known map's hex outline - nothing but background lies past it, so any
  // see-through cloud there would leave the jagged outline showing through.
  private static readonly UNEXPLORED_SPREAD = 1;
  private static readonly BLUR_REACH =
    FogOfWarLayer.BLUR_RADIUS * FogOfWarLayer.BLUR_PASSES + FogOfWarLayer.UNEXPLORED_SPREAD;
  // RGB 0-255 plus alpha 0-1, matching the old per-tile tint.
  private static readonly FOGGED_COLOR = [20, 20, 20, 0.55];
  // How covered a pixel must be before a cloud top shows there, how much later the haze between the
  // tops shows, and how much more cover each takes to go opaque. Tops + lag + fade stays at most 1,
  // so a fully covered pixel is opaque whatever the texel.
  private static readonly CLOUD_TOPS_FROM = 0.35;
  private static readonly CLOUD_HAZE_LAG = 0.25;
  private static readonly CLOUD_FADE = 0.25;
  // Cloud opacity snaps to this many steps, so the fade reads as pixel art rather than a gradient.
  private static readonly CLOUD_ALPHA_STEPS = 4;

  // The cloud texture's pixels, and per texel how early it shows as the cover thins out (0-1).
  private static cloudTexture: ImageData;
  private static cloudReach: Float32Array;

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
  // The cloud cover, one pixel per world pixel.
  private readonly cloudCanvas: HTMLCanvasElement;
  private readonly cloudContext: CanvasRenderingContext2D;
  private readonly cloudPixels: ImageData;
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

    this.cloudCanvas = document.createElement("canvas");
    this.cloudCanvas.width = this.width;
    this.cloudCanvas.height = this.height;
    this.cloudContext = this.cloudCanvas.getContext("2d");
    this.cloudPixels = this.cloudContext.createImageData(this.width, this.height);

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

  // Reads FOG_CLOUDS out of the sprite atlas once. Bright texels (cloud tops) reach furthest.
  private static loadCloudTexture() {
    if (FogOfWarLayer.cloudTexture) return;

    const region = SpriteAtlas.getInstance().getRegion(SpriteRegion.FOG_CLOUDS);
    const canvas = document.createElement("canvas");
    canvas.width = region.w;
    canvas.height = region.h;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const spritesheet = Game.getInstance().getImage(GameImage.SPRITESHEET);
    context.drawImage(spritesheet, region.x, region.y, region.w, region.h, 0, 0, region.w, region.h);
    const texture = context.getImageData(0, 0, region.w, region.h);

    const brightness = new Float32Array(region.w * region.h);
    for (let i = 0; i < brightness.length; i++) {
      brightness[i] = texture.data[i * 4] + texture.data[i * 4 + 1] + texture.data[i * 4 + 2];
    }
    const darkest = brightness.reduce((low, value) => Math.min(low, value), Infinity);
    const brightest = brightness.reduce((high, value) => Math.max(high, value), 0);

    FogOfWarLayer.cloudTexture = texture;
    FogOfWarLayer.cloudReach = brightness.map((value) => (value - darkest) / Math.max(1, brightest - darkest));
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

  /** The overlay's color at a world position, as RGBA 0-255: the clouds laid over the remembered-tile tint. */
  public getPixelAt(worldX: number, worldY: number): number[] {
    if (this.dirty) this.rebuild();

    const cellX = this.wrapCellX(Math.floor(worldX / FogOfWarLayer.WORLD_PIXELS_PER_CELL));
    const cellY = Math.min(Math.max(Math.floor(worldY / FogOfWarLayer.WORLD_PIXELS_PER_CELL), 0), this.cellsHigh - 1);
    const tintIndex = (cellX + cellY * this.cellsWide) * 4;
    const tint = this.pixels.data.slice(tintIndex, tintIndex + 4);

    const pixelX = this.wrapPixelX(Math.floor(worldX));
    const pixelY = Math.min(Math.max(Math.floor(worldY), 0), this.height - 1);
    const cloudIndex = (pixelX + pixelY * this.width) * 4;
    const cloud = this.cloudPixels.data.slice(cloudIndex, cloudIndex + 4);

    const cloudAlpha = cloud[3] / 255;
    const tintAlpha = (tint[3] / 255) * (1 - cloudAlpha);
    const alpha = cloudAlpha + tintAlpha;
    if (alpha <= 0) return [0, 0, 0, 0];

    const mix = (channel: number) => (cloud[channel] * cloudAlpha + tint[channel] * tintAlpha) / alpha;
    return [mix(0), mix(1), mix(2), alpha * 255];
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
    // The clouds are pixel art at the map's own scale, so they stay crisp like the tiles under them.
    canvasContext.imageSmoothingEnabled = false;
    canvasContext.drawImage(this.cloudCanvas, this.x, this.y, this.width, this.height);
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

  // For every mask cell, the tile whose center is nearest - which, on this grid, is the hex it's in -
  // or OFF_MAP where that would be a tile past the map's edge.
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

  // Checks the nearest tile in the nearest row and the rows either side of it. Rows and (on a map
  // that doesn't wrap) columns past the edge count too, so the jagged strip beyond the outer tiles
  // comes out OFF_MAP rather than as part of them.
  private nearestTileIndex(worldX: number, worldY: number, nearestRow: number): number {
    let bestIndex = FogOfWarLayer.OFF_MAP;
    let bestDistance = Infinity;

    for (let gridY = nearestRow - 1; gridY <= nearestRow + 1; gridY++) {
      const rowOffset = Math.abs(gridY) % 2 !== 0 ? FogOfWarLayer.TILE_STRIDE_X / 2 : 0;
      const column = Math.round((worldX - FogOfWarLayer.TILE_CENTER_OFFSET - rowOffset) / FogOfWarLayer.TILE_STRIDE_X);

      const centerX = column * FogOfWarLayer.TILE_STRIDE_X + rowOffset + FogOfWarLayer.TILE_CENTER_OFFSET;
      const centerY = gridY * FogOfWarLayer.TILE_STRIDE_Y + FogOfWarLayer.TILE_CENTER_OFFSET;
      const distance = (worldX - centerX) ** 2 + (worldY - centerY) ** 2;
      if (distance >= bestDistance) continue;

      bestDistance = distance;
      bestIndex = this.isOnMap(column, gridY)
        ? this.wrapColumn(column) + gridY * this.gridWidth
        : FogOfWarLayer.OFF_MAP;
    }

    return bestIndex;
  }

  private isOnMap(column: number, gridY: number): boolean {
    if (gridY < 0 || gridY >= this.gridHeight) return false;
    return this.wrapped || (column >= 0 && column < this.gridWidth);
  }

  private wrapColumn(column: number): number {
    if (this.wrapped) return ((column % this.gridWidth) + this.gridWidth) % this.gridWidth;
    return Math.min(Math.max(column, 0), this.gridWidth - 1);
  }

  private wrapCellX(cellX: number): number {
    if (this.wrapped) return ((cellX % this.cellsWide) + this.cellsWide) % this.cellsWide;
    return Math.min(Math.max(cellX, 0), this.cellsWide - 1);
  }

  private wrapPixelX(pixelX: number): number {
    if (this.wrapped) return ((pixelX % this.width) + this.width) % this.width;
    return Math.min(Math.max(pixelX, 0), this.width - 1);
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
      for (let x = 0; x < width; x++) {
        const state = this.stateOfCell(readLeft + x, readTop + y);
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

    this.writePixels(fogged, width, writeLeft, writeRight, writeTop, writeBottom);
    this.writeClouds(unexplored, width, writeLeft, writeRight, writeTop, writeBottom);

    // The written columns may run off either edge of a wrapped map; put the whole band back then.
    const inBounds = writeLeft >= 0 && writeRight <= this.cellsWide;
    const putLeft = inBounds ? writeLeft : 0;
    const putWidth = inBounds ? writeRight - writeLeft : this.cellsWide;
    this.context.putImageData(this.pixels, 0, 0, putLeft, writeTop, putWidth, writeBottom - writeTop);

    const perCell = FogOfWarLayer.WORLD_PIXELS_PER_CELL;
    this.cloudContext.putImageData(
      this.cloudPixels,
      0,
      0,
      putLeft * perCell,
      writeTop * perCell,
      putWidth * perCell,
      (writeBottom - writeTop) * perCell
    );
  }

  // Past the map's edge reads as unexplored, so the outermost tiles fade out like any unexplored border.
  private stateOfCell(cellX: number, cellY: number): number {
    if (cellY < 0 || cellY >= this.cellsHigh) return FogOfWarLayer.UNEXPLORED;
    if (!this.wrapped && (cellX < 0 || cellX >= this.cellsWide)) return FogOfWarLayer.UNEXPLORED;

    const tileIndex = this.cellTiles[this.wrapCellX(cellX) + cellY * this.cellsWide];
    return tileIndex === FogOfWarLayer.OFF_MAP ? FogOfWarLayer.UNEXPLORED : this.tileStates[tileIndex];
  }

  // The remembered-tile tint from the blurred fogged amounts. The clouds cover it where they overlap.
  private writePixels(
    fogged: Float32Array,
    width: number,
    writeLeft: number,
    writeRight: number,
    writeTop: number,
    writeBottom: number
  ) {
    const reach = FogOfWarLayer.BLUR_REACH;
    const [fogR, fogG, fogB, fogA] = FogOfWarLayer.FOGGED_COLOR;
    const data = this.pixels.data;

    for (let cellY = writeTop; cellY < writeBottom; cellY++) {
      const y = cellY - writeTop + reach;
      for (let cellX = writeLeft; cellX < writeRight; cellX++) {
        const source = cellX - writeLeft + reach + y * width;
        const target = (this.wrapCellX(cellX) + cellY * this.cellsWide) * 4;
        data[target] = fogR;
        data[target + 1] = fogG;
        data[target + 2] = fogB;
        data[target + 3] = fogged[source] * fogA * 255;
      }
    }
  }

  /**
   * The cloud cover for the written cells, per world pixel. The blurred unexplored amount, sampled
   * between cell centers, sets how covered a pixel is. Cloud tops show from CLOUD_TOPS_FROM and the
   * haze between them only later, so every texel is opaque once the pixel is fully covered.
   */
  private writeClouds(
    unexplored: Float32Array,
    width: number,
    writeLeft: number,
    writeRight: number,
    writeTop: number,
    writeBottom: number
  ) {
    FogOfWarLayer.loadCloudTexture();
    const texture = FogOfWarLayer.cloudTexture;
    const reachOf = FogOfWarLayer.cloudReach;
    const perCell = FogOfWarLayer.WORLD_PIXELS_PER_CELL;
    const steps = FogOfWarLayer.CLOUD_ALPHA_STEPS;
    const margin = FogOfWarLayer.BLUR_REACH;
    const data = this.cloudPixels.data;

    for (let pixelY = writeTop * perCell; pixelY < writeBottom * perCell; pixelY++) {
      // Position in the blurred region's cells, measured from cell centers.
      const regionY = (pixelY + 0.5) / perCell - 0.5 - writeTop + margin;
      const top = Math.floor(regionY);
      const down = regionY - top;
      const textureRow = (pixelY % texture.height) * texture.width;

      for (let pixelX = writeLeft * perCell; pixelX < writeRight * perCell; pixelX++) {
        const regionX = (pixelX + 0.5) / perCell - 0.5 - writeLeft + margin;
        const left = Math.floor(regionX);
        const across = regionX - left;
        const corner = left + top * width;
        const covered =
          (unexplored[corner] * (1 - across) + unexplored[corner + 1] * across) * (1 - down) +
          (unexplored[corner + width] * (1 - across) + unexplored[corner + width + 1] * across) * down;

        const wrappedX = this.wrapPixelX(pixelX);
        const texel = textureRow + (wrappedX % texture.width);
        const start = FogOfWarLayer.CLOUD_TOPS_FROM + FogOfWarLayer.CLOUD_HAZE_LAG * (1 - reachOf[texel]);
        const opacity = Math.min(1, Math.max(0, (covered - start) / FogOfWarLayer.CLOUD_FADE));
        const target = (wrappedX + pixelY * this.width) * 4;

        data[target] = texture.data[texel * 4];
        data[target + 1] = texture.data[texel * 4 + 1];
        data[target + 2] = texture.data[texel * 4 + 2];
        data[target + 3] = (Math.round(opacity * steps) / steps) * 255;
      }
    }
  }
}
