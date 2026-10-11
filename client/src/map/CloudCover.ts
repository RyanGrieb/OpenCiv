import { GameImage, resolveSpriteRegion } from "../Assets";
import { Game } from "../Game";
import { SpriteAtlas } from "../SpriteAtlas";

// One cloud sprite placed in the sky, by its top-left corner in world pixels.
interface CloudPlacement {
  sprite: ImageData;
  x: number;
  y: number;
  shadow: number;
}

/**
 * The clouds over unexplored tiles, painted once per map: a haze of blue-gray patches with dim
 * far-off clouds in it, then formations of cloud sprites - towering cumulus with smaller banks
 * gathered at their feet, chains of banks, scattered puffs, the odd storm cloud and clear patches -
 * each casting a shadow down and right, away from the sun in the upper left. Thin wisps go on top.
 * Placement is random per game, and wraps around the map's seam on a wrapped map.
 *
 * Also works out each pixel's reach: how early it shows as the cloud cover thins toward known
 * tiles. Bright, sunlit pixels reach furthest and the haze least, so the edge of the cover billows.
 */
export class CloudCover {
  private static readonly SPRITE_COUNTS: Record<string, number> = {
    CUMULUS: 6,
    BANK: 4,
    PUFF: 4,
    STORM: 2,
    WISP: 3,
    LOWCLOUD: 3
  };
  // The first four cumulus sprites are ordinary towers; the rest are giants.
  private static readonly ORDINARY_CUMULUS = 4;
  private static readonly HAZE_COLORS = [
    [112, 122, 156],
    [120, 130, 164],
    [130, 140, 172]
  ];
  // Haze patch sizes, in world pixels. Both divide a wrapped map's width (a multiple of 128).
  private static readonly HAZE_CELL_SIZES = [64, 32];
  // Spacing of formations, in world pixels: each sits somewhere in its own cell of this size.
  private static readonly FORMATION_SPACING = 115;
  // How far a cloud's shadow falls from it, and how dark it makes what's below (1 = no shadow).
  private static readonly SHADOW_OFFSET_X = 5;
  private static readonly SHADOW_OFFSET_Y = 8;
  private static readonly CLOUD_SHADOW = 0.8;
  private static readonly WISP_SHADOW = 0.9;
  // A cloud's outline over another cloud (sum of RGB above this) is softened to a seam halfway between.
  private static readonly OUTLINE_LUMINANCE = 330;
  private static readonly CLOUD_LUMINANCE = 520;
  // Luminance (sum of RGB) of the darkest haze, where reach is 0, and of a sunlit top, where it's 1.
  private static readonly NO_REACH_LUMINANCE = 300;
  private static readonly FULL_REACH_LUMINANCE = 740;

  private static sprites: Map<string, ImageData> = new Map();

  private readonly width: number;
  private readonly height: number;
  private readonly wrapped: boolean;
  private readonly data: Uint8ClampedArray;
  // Pixels darkened by a shadow since the last cloud painted over them, so shadows don't stack.
  private readonly shaded: Uint8Array;
  private readonly reach: Uint8Array;
  private seed: number;

  /** Paints the clouds' colors into `pixels` (leaving its alpha alone). */
  constructor(pixels: ImageData, wrapped: boolean) {
    this.width = pixels.width;
    this.height = pixels.height;
    this.wrapped = wrapped;
    this.data = pixels.data;
    this.shaded = new Uint8Array(this.width * this.height);
    this.reach = new Uint8Array(this.width * this.height);
    this.seed = Math.floor(Math.random() * 0xffffffff);

    this.paintHaze();
    for (const placement of this.placeLowClouds()) this.paintCloud(placement);
    for (const placement of this.placeFormations()) this.paintCloud(placement);
    for (const placement of this.placeWisps()) this.paintCloud(placement);
    this.measureReach();
  }

  // A cloud sprite's pixels, read out of the sprite atlas once.
  private static getSprite(kind: string, variant: number): ImageData {
    const name = `FOG_${kind}_${variant}`;
    const cached = CloudCover.sprites.get(name);
    if (cached) return cached;

    const region = SpriteAtlas.getInstance().getRegion(resolveSpriteRegion(name));
    const canvas = document.createElement("canvas");
    canvas.width = region.w;
    canvas.height = region.h;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const spritesheet = Game.getInstance().getImage(GameImage.SPRITESHEET);
    context.drawImage(spritesheet, region.x, region.y, region.w, region.h, 0, 0, region.w, region.h);

    const sprite = context.getImageData(0, 0, region.w, region.h);
    CloudCover.sprites.set(name, sprite);
    return sprite;
  }

  // Smoothstep, for easing value noise between lattice points.
  private static ease(t: number): number {
    return t * t * (3 - 2 * t);
  }

  /** Per world pixel, 0-255: how early it shows as the cover thins out. */
  public getReach(): Uint8Array {
    return this.reach;
  }

  // Seeded, so one map's sky is painted from one sequence of numbers (mulberry32).
  private random(): number {
    this.seed = (this.seed + 0x6d2b79f5) | 0;
    let t = this.seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  private between(low: number, high: number): number {
    return low + this.random() * (high - low);
  }

  private pick(kind: string, from = 1, to = CloudCover.SPRITE_COUNTS[kind]): ImageData {
    return CloudCover.getSprite(kind, from + Math.floor(this.random() * (to - from + 1)));
  }

  // Blotches of three haze shades, from two octaves of value noise that wrap with the map.
  private paintHaze() {
    const value = new Float32Array(this.width * this.height);
    let weight = 0.65;
    for (const cellSize of CloudCover.HAZE_CELL_SIZES) {
      this.addValueNoise(value, cellSize, weight);
      weight = 1 - weight;
    }

    for (let pixel = 0; pixel < value.length; pixel++) {
      const shade = value[pixel] < 0.4 ? 0 : value[pixel] < 0.6 ? 1 : 2;
      const color = CloudCover.HAZE_COLORS[shade];
      this.data[pixel * 4] = color[0];
      this.data[pixel * 4 + 1] = color[1];
      this.data[pixel * 4 + 2] = color[2];
    }
  }

  // Adds `weight` times smoothly interpolated random values, set every `cellSize` pixels, to `value`.
  private addValueNoise(value: Float32Array, cellSize: number, weight: number) {
    const columns = Math.ceil(this.width / cellSize) + 1;
    const rows = Math.ceil(this.height / cellSize) + 1;
    const lattice = Float32Array.from({ length: columns * rows }, () => this.random());
    // On a wrapped map the column past the last is the first, so the haze meets itself at the seam.
    const wrapColumns = this.wrapped ? this.width / cellSize : columns;

    // Per column, the lattice columns either side and how far across it lies; worked out once.
    const lefts = new Int32Array(this.width);
    const rights = new Int32Array(this.width);
    const acrosses = new Float32Array(this.width);
    for (let x = 0; x < this.width; x++) {
      lefts[x] = Math.floor(x / cellSize);
      rights[x] = (lefts[x] + 1) % wrapColumns;
      acrosses[x] = CloudCover.ease(x / cellSize - lefts[x]);
    }

    for (let y = 0; y < this.height; y++) {
      const top = Math.floor(y / cellSize);
      const down = CloudCover.ease(y / cellSize - top);
      const upperRow = top * columns;
      const lowerRow = upperRow + columns;
      for (let x = 0; x < this.width; x++) {
        const across = acrosses[x];
        const upper = lattice[upperRow + lefts[x]] * (1 - across) + lattice[upperRow + rights[x]] * across;
        const lower = lattice[lowerRow + lefts[x]] * (1 - across) + lattice[lowerRow + rights[x]] * across;
        value[x + y * this.width] += (upper * (1 - down) + lower * down) * weight;
      }
    }
  }

  // Dim far-off clouds strewn through the haze, under everything else.
  private placeLowClouds(): CloudPlacement[] {
    const count = Math.round((this.width * this.height) / 1500);
    return Array.from({ length: count }, () => ({
      ...this.place(this.pick("LOWCLOUD"), this.between(0, this.width), this.between(0, this.height)),
      shadow: 1
    }));
  }

  // One formation per cell of a jittered grid, painted back to front by where each cloud's base sits.
  private placeFormations(): CloudPlacement[] {
    const spacing = CloudCover.FORMATION_SPACING;
    const placements: CloudPlacement[] = [];

    for (let cellY = -spacing / 2; cellY < this.height; cellY += spacing) {
      for (let cellX = 0; cellX < this.width; cellX += spacing) {
        const centerX = cellX + this.between(0, spacing);
        const centerY = cellY + this.between(0, spacing);
        placements.push(...this.placeFormation(centerX, centerY));
      }
    }

    // Stray puffs between the formations.
    const strays = Math.round((this.width * this.height) / 16000);
    for (let i = 0; i < strays; i++) {
      placements.push(this.place(this.pick("PUFF"), this.between(0, this.width), this.between(0, this.height)));
    }

    return placements.sort((a, b) => a.y + a.sprite.height - (b.y + b.sprite.height));
  }

  private placeFormation(centerX: number, centerY: number): CloudPlacement[] {
    const roll = this.random();
    if (roll < 0.45) return this.placeCumulusGroup(centerX, centerY);
    if (roll < 0.76) return this.placeBankChain(centerX, centerY);
    if (roll < 0.86) return this.placePuffScatter(centerX, centerY);
    if (roll < 0.93) return this.placeStorm(centerX, centerY);
    // A patch of clear sky.
    return [];
  }

  // A tower, sometimes a giant, with banks and puffs gathered at its feet.
  private placeCumulusGroup(centerX: number, centerY: number): CloudPlacement[] {
    const giant = this.random() < 0.3;
    const tower = giant
      ? this.pick("CUMULUS", CloudCover.ORDINARY_CUMULUS + 1)
      : this.pick("CUMULUS", 1, CloudCover.ORDINARY_CUMULUS);
    const placements = [this.place(tower, centerX, centerY)];
    const baseY = centerY + tower.height / 2;

    for (let i = Math.floor(this.between(2, 6)); i > 0; i--) {
      const sprite = this.random() < 0.5 ? this.pick("BANK") : this.pick("PUFF");
      const side = this.random() < 0.5 ? -1 : 1;
      const x = centerX + side * this.between(tower.width * 0.3, tower.width * 0.7);
      placements.push(this.place(sprite, x, baseY + this.between(-12, 10) - sprite.height / 2));
    }
    return placements;
  }

  // Banks strung out along a gentle slant.
  private placeBankChain(centerX: number, centerY: number): CloudPlacement[] {
    const count = Math.floor(this.between(3, 6));
    const slant = this.between(-0.35, 0.35);
    const placements: CloudPlacement[] = [];
    let x = centerX - count * 22;
    for (let i = 0; i < count; i++) {
      const sprite = this.pick("BANK");
      placements.push(this.place(sprite, x, centerY + (x - centerX) * slant + this.between(-6, 6)));
      x += sprite.width * this.between(0.55, 0.85);
    }
    return placements;
  }

  private placePuffScatter(centerX: number, centerY: number): CloudPlacement[] {
    return Array.from({ length: Math.floor(this.between(3, 7)) }, () =>
      this.place(this.pick("PUFF"), centerX + this.between(-60, 60), centerY + this.between(-40, 40))
    );
  }

  // A dark rain cloud, with a white bank or two catching the light in front of it.
  private placeStorm(centerX: number, centerY: number): CloudPlacement[] {
    const storm = this.pick("STORM");
    const placements = [this.place(storm, centerX, centerY)];
    for (let i = Math.floor(this.between(1, 3)); i > 0; i--) {
      placements.push(
        this.place(
          this.pick("BANK"),
          centerX + this.between(-storm.width / 2, storm.width / 2),
          centerY + storm.height / 2
        )
      );
    }
    return placements;
  }

  private placeWisps(): CloudPlacement[] {
    const count = Math.round((this.width * this.height) / 22000);
    return Array.from({ length: count }, () => ({
      ...this.place(this.pick("WISP"), this.between(0, this.width), this.between(0, this.height)),
      shadow: CloudCover.WISP_SHADOW
    }));
  }

  // A cloud centered on a point, snapped to whole pixels.
  private place(sprite: ImageData, centerX: number, centerY: number): CloudPlacement {
    return {
      sprite,
      x: Math.round(centerX - sprite.width / 2) | 0,
      y: Math.round(centerY - sprite.height / 2) | 0,
      shadow: CloudCover.CLOUD_SHADOW
    };
  }

  // The cloud's shadow on whatever is below it, then the cloud itself.
  private paintCloud({ sprite, x, y, shadow }: CloudPlacement) {
    if (shadow < 1) this.paintShadow(sprite, x + CloudCover.SHADOW_OFFSET_X, y + CloudCover.SHADOW_OFFSET_Y, shadow);

    const source = sprite.data;
    const data = this.data;
    for (let spriteY = 0; spriteY < sprite.height; spriteY++) {
      const worldY = y + spriteY;
      if (worldY < 0 || worldY >= this.height) continue;

      for (let spriteX = 0; spriteX < sprite.width; spriteX++) {
        const from = (spriteX + spriteY * sprite.width) * 4;
        const worldX = this.wrapX(x + spriteX);
        if (source[from + 3] < 128 || worldX < 0) continue;

        const pixel = worldX + worldY * this.width;
        const to = pixel * 4;
        this.shaded[pixel] = 0;
        const seam =
          source[from] + source[from + 1] + source[from + 2] < CloudCover.OUTLINE_LUMINANCE &&
          data[to] + data[to + 1] + data[to + 2] > CloudCover.CLOUD_LUMINANCE;
        data[to] = seam ? (source[from] + data[to]) / 2 : source[from];
        data[to + 1] = seam ? (source[from + 1] + data[to + 1]) / 2 : source[from + 1];
        data[to + 2] = seam ? (source[from + 2] + data[to + 2]) / 2 : source[from + 2];
      }
    }
  }

  // Darkens what's under the sprite's silhouette, once however many shadows overlap there.
  private paintShadow(sprite: ImageData, x: number, y: number, shadow: number) {
    const source = sprite.data;
    const data = this.data;
    // Shadows on clouds read cool, so blue drops off a little less.
    const blueShadow = shadow + (1 - shadow) * 0.4;
    for (let spriteY = 0; spriteY < sprite.height; spriteY++) {
      const worldY = y + spriteY;
      if (worldY < 0 || worldY >= this.height) continue;

      for (let spriteX = 0; spriteX < sprite.width; spriteX++) {
        const worldX = this.wrapX(x + spriteX);
        if (source[(spriteX + spriteY * sprite.width) * 4 + 3] < 128 || worldX < 0) continue;

        const pixel = worldX + worldY * this.width;
        if (this.shaded[pixel]) continue;
        this.shaded[pixel] = 1;
        data[pixel * 4] *= shadow;
        data[pixel * 4 + 1] *= shadow;
        data[pixel * 4 + 2] *= blueShadow;
      }
    }
  }

  // A world column, wrapped around the seam on a wrapped map, or -1 past the edge of one that isn't.
  private wrapX(worldX: number): number {
    if (this.wrapped) return ((worldX % this.width) + this.width) % this.width;
    return worldX >= 0 && worldX < this.width ? worldX : -1;
  }

  private measureReach() {
    const low = CloudCover.NO_REACH_LUMINANCE;
    const range = CloudCover.FULL_REACH_LUMINANCE - low;
    const data = this.data;
    for (let pixel = 0; pixel < this.reach.length; pixel++) {
      const luminance = data[pixel * 4] + data[pixel * 4 + 1] + data[pixel * 4 + 2];
      // Uint8Array stores clamp nothing, so keep it in 0-255 here.
      const reach = ((luminance - low) / range) * 255;
      this.reach[pixel] = reach < 0 ? 0 : reach > 255 ? 255 : reach;
    }
  }
}
