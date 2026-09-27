import { GameImage, resolveSpriteRegion } from "../Assets";
import { Game } from "../Game";
import { Actor } from "../scene/Actor";
import { SpriteAtlas } from "../SpriteAtlas";
import { HexPixels } from "./HexPixels";
import { Tile } from "./Tile";

/**
 * Softens the hard hex border where two different kinds of land meet, such as plains beside
 * grassland. Along each such side, a tile's pixels are dithered over to its neighbor's ground,
 * so the two terrains fray into each other across a wobbly line instead of meeting at a straight
 * hex edge. Only the look: the tiles' types and yields are untouched.
 *
 * Both tiles of a pair draw their half of the same transition: whether a pixel shows one terrain or
 * the other is decided from its distance to the shared side plus noise and a dither pattern taken in
 * world coordinates, so the two halves line up exactly and a border runs on smoothly from one tile
 * into the next. The borrowed pixels are the neighbor's own sprite mirrored across the side, so its
 * texture carries straight on over the edge. Hard pixels, no antialiasing, like the rest of the art.
 *
 * A hill blends as the flat ground under its mounds, which are drawn on the map's top layer and so
 * stay whole. Mountains, water and natural wonders are left alone (the shore between land and water
 * is Coastline's).
 */
export class TerrainBlend {
  // Terrains that blend. A hill blends as the ground it stands on ("plains_hill" as "plains").
  private static readonly BLENDING_TERRAINS = [
    "grass",
    "plains",
    "desert",
    "tundra",
    "snow",
    "floodplains",
    "grass_hill",
    "plains_hill",
    "desert_hill",
    "tundra_hill",
    "snow_hill"
  ];
  private static readonly HILL_SUFFIX = "_hill";
  private static readonly ALL_SIDES = [0, 1, 2, 3, 4, 5];

  // How far the border between the two terrains wanders either side of the hex side, in pixels.
  private static readonly WOBBLE = 2.5;
  // How wide the dithered band is where the two terrains' pixels mix.
  private static readonly DITHER_WIDTH = 4;
  // World pixels between the noise's lattice points: how quickly the border wanders.
  private static readonly NOISE_SCALE = 6;
  // Keeps this noise from lining up with the shore's, which uses the same lattice.
  private static readonly NOISE_SEED = 7331;
  // A 4x4 ordered dither, laid over the world so it lines up across tiles.
  private static readonly BAYER = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
  ];

  private static readonly tilePixels = new Map<string, ImageData>();
  private static readonly spritePixels = new Map<string, ImageData>();
  private static canvas: HTMLCanvasElement;

  /**
   * The borrowed pixels drawn over a chunk's tiles, each given with its position on the chunk's
   * canvas, as one image; or none if no known neighbor of any of them is a different blending
   * terrain. One image a chunk rather than one a tile, since turning pixels into an image is the slow
   * part. Built from the real map tiles, whose neighbors are linked, rather than a chunk's render-only
   * copies of them.
   */
  public static async createChunkActor(
    tiles: { tile: Tile; x: number; y: number }[],
    width: number,
    height: number
  ): Promise<Actor | undefined> {
    const chunkPixels = new ImageData(width, height);
    let blended = false;

    for (const { tile, x, y } of tiles) {
      const tilePixels = TerrainBlend.getTilePixels(tile);
      if (!tilePixels) continue;
      TerrainBlend.copyOpaquePixels(tilePixels, chunkPixels, x, y);
      blended = true;
    }
    if (!blended) return undefined;

    return new Actor({ image: await TerrainBlend.toImage(chunkPixels), x: 0, y: 0, width, height });
  }

  // Whether a newly discovered tile changes the blend drawn on this neighbor of it.
  public static affects(tile: Tile, neighbor: Tile): boolean {
    const ground = TerrainBlend.getGround(tile);
    const neighborGround = TerrainBlend.getGround(neighbor);
    return !!ground && !!neighborGround && ground !== neighborGround;
  }

  // The ground a tile blends as, or undefined if it doesn't blend.
  private static getGround(tile: Tile): string | undefined {
    const terrain = tile.getTileTypes()[0];
    if (!TerrainBlend.BLENDING_TERRAINS.includes(terrain)) return undefined;
    return terrain.replace(TerrainBlend.HILL_SUFFIX, "");
  }

  // The sides this tile draws a blend along: those facing a different ground.
  private static getBlendingSides(tile: Tile): number[] {
    const sides: number[] = [];
    tile.getAdjacentTiles().forEach((neighbor, side) => {
      if (neighbor && TerrainBlend.affects(tile, neighbor)) sides.push(side);
    });
    return sides;
  }

  // A tile's borrowed pixels, 32x32, or undefined if it has none. Cached per tile and its neighbors'
  // terrains: a chunk is rebuilt whenever anything in it changes, while a blend only changes when a
  // neighbor across it is discovered.
  private static getTilePixels(tile: Tile): ImageData | undefined {
    const sides = TerrainBlend.getBlendingSides(tile);
    if (sides.length === 0) return undefined;

    const neighbors = sides.map((side) => `${side}${tile.getAdjacentTiles()[side].getTileTypes()[0]}`);
    const key = `${tile.getGridX()},${tile.getGridY()}:${tile.getTileTypes()[0]}:${neighbors.join(",")}`;
    let pixels = TerrainBlend.tilePixels.get(key);
    if (!pixels) {
      pixels = TerrainBlend.drawTilePixels(tile, sides);
      TerrainBlend.tilePixels.set(key, pixels);
    }
    return pixels;
  }

  private static drawTilePixels(tile: Tile, sides: number[]): ImageData {
    const pixels = new ImageData(Tile.WIDTH, Tile.HEIGHT);

    for (let py = 0; py < Tile.HEIGHT; py++) {
      for (let px = 0; px < Tile.WIDTH; px++) {
        if (!HexPixels.insideHex(px, py)) continue;

        // Each pixel belongs to its nearest side, so a side facing the same ground stays clean up to its corners.
        const side = TerrainBlend.nearestSide(px + 0.5, py + 0.5);
        if (!sides.includes(side) || !TerrainBlend.showsNeighbor(tile, side, px, py)) continue;

        const color = TerrainBlend.neighborPixel(tile, side, px, py);
        if (color) pixels.data.set(color, (py * Tile.WIDTH + px) * 4);
      }
    }
    return pixels;
  }

  // Copies a tile's opaque pixels onto the chunk's at (x, y), leaving what its neighbors drew in the
  // corners of its square untouched.
  private static copyOpaquePixels(source: ImageData, target: ImageData, x: number, y: number) {
    for (let py = 0; py < source.height; py++) {
      for (let px = 0; px < source.width; px++) {
        const sourceIndex = (py * source.width + px) * 4;
        if (source.data[sourceIndex + 3] === 0) continue;
        if (x + px >= target.width || y + py >= target.height) continue;

        const targetIndex = ((y + py) * target.width + x + px) * 4;
        target.data.set(source.data.subarray(sourceIndex, sourceIndex + 4), targetIndex);
      }
    }
  }

  private static async toImage(pixels: ImageData): Promise<HTMLImageElement> {
    TerrainBlend.canvas ??= document.createElement("canvas");
    const canvas = TerrainBlend.canvas;
    canvas.width = pixels.width;
    canvas.height = pixels.height;
    canvas.getContext("2d").putImageData(pixels, 0, 0);

    const image = new Image(pixels.width, pixels.height);
    image.src = canvas.toDataURL();
    await new Promise((resolve) => (image.onload = resolve));
    return image;
  }

  private static nearestSide(x: number, y: number): number {
    return TerrainBlend.ALL_SIDES.reduce((nearest, side) =>
      HexPixels.distanceToSide(x, y, side) < HexPixels.distanceToSide(x, y, nearest) ? side : nearest
    );
  }

  /**
   * Whether a pixel of the tile shows the neighbor's ground rather than its own. The border between
   * the two sits at the hex side, pushed back and forth by the noise and dither of that world pixel.
   * Both tiles of a pair measure the same border from opposite sides, so each world pixel lands on
   * one side of it.
   */
  private static showsNeighbor(tile: Tile, side: number, px: number, py: number): boolean {
    const neighbor = tile.getAdjacentTiles()[side];
    const worldX = tile.getX() + px;
    const worldY = tile.getY() + py;

    const noise = HexPixels.noise(worldX, worldY, TerrainBlend.NOISE_SCALE, TerrainBlend.NOISE_SEED);
    const dither = (TerrainBlend.BAYER[TerrainBlend.mod(worldY, 4)][TerrainBlend.mod(worldX, 4)] + 0.5) / 16;
    const offset = TerrainBlend.WOBBLE * (noise * 2 - 1) + TerrainBlend.DITHER_WIDTH * (dither - 0.5);
    const distance = HexPixels.distanceToSide(px + 0.5, py + 0.5, side);

    // Which way the offset pushes the border is agreed on by both tiles: toward the ground that
    // sorts later.
    const direction = TerrainBlend.getGround(tile) < TerrainBlend.getGround(neighbor) ? 1 : -1;
    return distance + direction * offset < 0;
  }

  // The neighbor's ground at the point mirrored across the side, or straight across where the
  // mirror lands outside its hex (near a corner). Undefined if its sprite has nothing there either.
  private static neighborPixel(tile: Tile, side: number, px: number, py: number): Uint8ClampedArray | undefined {
    const neighbor = tile.getAdjacentTiles()[side];
    // A hill's base sprite is its flat ground's, the same one drawn under its mounds.
    const sprite = TerrainBlend.getSpritePixels(
      Tile.getVariantTileType(neighbor.getTileTypes()[0], neighbor.getGridX(), neighbor.getGridY())
    );
    const [offsetX, offsetY] = HexPixels.NEIGHBOR_OFFSETS[side];
    const [mirroredX, mirroredY] = HexPixels.reflectAcrossSide(px + 0.5, py + 0.5, side);

    const mirrored = TerrainBlend.spritePixel(sprite, Math.floor(mirroredX - offsetX), Math.floor(mirroredY - offsetY));
    if (mirrored) return mirrored;
    return TerrainBlend.spritePixel(sprite, px, py);
  }

  // One opaque pixel of a sprite, or undefined if it's off the sprite or transparent.
  private static spritePixel(sprite: ImageData, x: number, y: number): Uint8ClampedArray | undefined {
    if (x < 0 || y < 0 || x >= sprite.width || y >= sprite.height) return undefined;
    const index = (y * sprite.width + x) * 4;
    if (sprite.data[index + 3] < 255) return undefined;
    return sprite.data.subarray(index, index + 4);
  }

  private static getSpritePixels(tileType: string): ImageData {
    const cached = TerrainBlend.spritePixels.get(tileType);
    if (cached) return cached;

    const canvas = document.createElement("canvas");
    canvas.width = Tile.WIDTH;
    canvas.height = Tile.HEIGHT;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const region = SpriteAtlas.getInstance().getRegion(resolveSpriteRegion(`TILE_${tileType.toUpperCase()}`));
    const spritesheet = Game.getInstance().getImage(GameImage.SPRITESHEET);
    context.drawImage(spritesheet, region.x, region.y, region.w, region.h, 0, 0, Tile.WIDTH, Tile.HEIGHT);

    const pixels = context.getImageData(0, 0, Tile.WIDTH, Tile.HEIGHT);
    TerrainBlend.spritePixels.set(tileType, pixels);
    return pixels;
  }

  // A remainder that stays positive for negative world coordinates too.
  private static mod(value: number, divisor: number): number {
    return ((value % divisor) + divisor) % divisor;
  }
}
