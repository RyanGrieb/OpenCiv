import { Tile } from "./Tile";

/**
 * Pixel geometry and world-space noise shared by the per-pixel overlays drawn along a tile's sides
 * (Coastline, TerrainBlend).
 */
export class HexPixels {
  // The hex's corners in a tile's own pixels; side i runs from corner i to corner i + 1, and faces
  // getAdjacentTiles()[i] (the numbering rivers and roads use).
  public static readonly CORNERS: [number, number][] = [
    [0, 7],
    [16, 0],
    [32, 7],
    [32, 25],
    [16, 32],
    [0, 25]
  ];
  // Where the neighbor across each side sits, relative to the tile, in pixels.
  public static readonly NEIGHBOR_OFFSETS: [number, number][] = [
    [-16, -25],
    [16, -25],
    [32, 0],
    [16, 25],
    [-16, 25],
    [-32, 0]
  ];
  // Rows of a tile's sprite above this (and from TILE_BOTTOM_ROW down) are the hex's pointed top
  // and bottom, which narrow by 2 pixels a row - the same stepped outline the terrain sprites use.
  private static readonly TILE_TOP_ROWS = 7;
  private static readonly TILE_BOTTOM_ROW = 25;

  // Whether a pixel of a tile's 32x32 sprite belongs to its hex, rather than a neighbor's.
  public static insideHex(px: number, py: number): boolean {
    let halfWidth = Tile.WIDTH / 2;
    if (py < HexPixels.TILE_TOP_ROWS) halfWidth = 2 * (py + 1);
    if (py >= HexPixels.TILE_BOTTOM_ROW) halfWidth = 2 * (Tile.HEIGHT - py);

    return Math.abs(px + 0.5 - Tile.WIDTH / 2) < halfWidth;
  }

  // How far a point is from the nearest of the given sides, in pixels.
  public static distanceToSides(x: number, y: number, sides: number[]): number {
    return Math.min(...sides.map((side) => HexPixels.distanceToSide(x, y, side)));
  }

  public static distanceToSide(x: number, y: number, side: number): number {
    const [x1, y1] = HexPixels.CORNERS[side];
    const [x2, y2] = HexPixels.CORNERS[(side + 1) % 6];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
  }

  // A point mirrored across the (endless) line through one of the hex's sides.
  public static reflectAcrossSide(x: number, y: number, side: number): [number, number] {
    const [x1, y1] = HexPixels.CORNERS[side];
    const [x2, y2] = HexPixels.CORNERS[(side + 1) % 6];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
    const footX = x1 + t * dx;
    const footY = y1 + t * dy;
    return [2 * footX - x, 2 * footY - y];
  }

  // Smooth value noise in [0, 1) at a world pixel, the same whichever tile asks for it. `scale` is
  // the world pixels between lattice points: how quickly the noise wanders.
  public static noise(worldX: number, worldY: number, scale: number, seed = 0): number {
    const x = worldX / scale;
    const y = worldY / scale;
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const sx = HexPixels.smoothstep(x - x0);
    const sy = HexPixels.smoothstep(y - y0);

    const lattice = (lx: number, ly: number) => HexPixels.latticeValue(lx + seed, ly);
    const top = HexPixels.lerp(lattice(x0, y0), lattice(x0 + 1, y0), sx);
    const bottom = HexPixels.lerp(lattice(x0, y0 + 1), lattice(x0 + 1, y0 + 1), sx);
    return HexPixels.lerp(top, bottom, sy);
  }

  private static latticeValue(x: number, y: number): number {
    let hash = Math.imul(x, 374761393) + Math.imul(y, 668265263);
    hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
    return ((hash ^ (hash >>> 16)) >>> 0) / 4294967296;
  }

  private static smoothstep(t: number): number {
    return t * t * (3 - 2 * t);
  }

  private static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }
}
