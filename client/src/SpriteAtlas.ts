import { SpriteRegion } from "./Assets";
import { SPRITE_MANIFEST } from "./generated/SpriteManifest";

export interface SpriteAtlasRegion {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface CachedAtlas {
  hash: string;
  blob: Blob;
  regions: Record<string, SpriteAtlasRegion>;
}

// Packs every sprite in SPRITE_MANIFEST into one canvas at startup instead of
// relying on a hand-maintained spritesheet.png grid - adding a sprite is just
// adding a file (see client/assets/sprites/) and regenerating the manifest.
// The packed result is cached in IndexedDB, keyed by a hash of the manifest,
// so repeat loads skip packing entirely unless a sprite was added/removed/renamed.
export class SpriteAtlas {
  private static readonly DB_NAME = "openciv-sprite-atlas";
  private static readonly STORE_NAME = "cache";
  private static readonly CACHE_KEY = "atlas";
  private static readonly ATLAS_WIDTH = 1024;
  private static readonly SHELF_PADDING = 1; // avoids bleed between neighboring regions

  private static instance: SpriteAtlas;

  private readonly image: HTMLImageElement;
  private readonly regions: Record<string, SpriteAtlasRegion>;

  private constructor(image: HTMLImageElement, regions: Record<string, SpriteAtlasRegion>) {
    this.image = image;
    this.regions = regions;
  }

  public static async load(): Promise<SpriteAtlas> {
    // In dev, Vite serves each sprite at a stable URL regardless of its
    // content, so editing a sprite's pixels wouldn't change the manifest hash
    // and the cache would keep serving the pre-edit atlas. Only production
    // (where Vite content-hashes output filenames) benefits from caching.
    const useCache = import.meta.env.PROD;

    const hash = SpriteAtlas.computeManifestHash();
    const cached = useCache ? await SpriteAtlas.readCache(hash) : undefined;
    const { blob, regions } = cached ?? (await SpriteAtlas.pack());

    if (useCache && !cached) {
      await SpriteAtlas.writeCache(hash, blob, regions);
    }

    const image = await SpriteAtlas.blobToImage(blob);
    SpriteAtlas.instance = new SpriteAtlas(image, regions);
    return SpriteAtlas.instance;
  }

  public static getInstance(): SpriteAtlas {
    return SpriteAtlas.instance;
  }

  private static computeManifestHash(): string {
    // FNV-1a over the sorted "name:url" pairs. Changes whenever a sprite is
    // added, removed, or renamed, and (in production, where Vite content-hashes
    // output filenames) whenever a sprite's pixels change.
    // Explicit ordinal compare (not localeCompare) - this hash must come out identical on
    // every machine, and locale-aware collation isn't guaranteed consistent across them.
    const input = SPRITE_MANIFEST.map((e) => `${e.name}:${e.url}`)
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
      .join("\n");

    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16);
  }

  private static async pack(): Promise<{ blob: Blob; regions: Record<string, SpriteAtlasRegion> }> {
    const sprites = await Promise.all(
      SPRITE_MANIFEST.map(async (entry) => ({
        name: entry.name,
        // "no-store": dev URLs are stable/unhashed, so the browser's HTTP cache
        // can otherwise serve stale bytes for a sprite that was just edited on disk.
        bitmap: await createImageBitmap(await (await fetch(entry.url, { cache: "no-store" })).blob())
      }))
    );

    // Tallest-first shelf packing keeps shelves tight regardless of manifest order.
    sprites.sort((a, b) => b.bitmap.height - a.bitmap.height);

    const atlasWidth = SpriteAtlas.ATLAS_WIDTH;
    const regions: Record<string, SpriteAtlasRegion> = {};

    let shelfX = 0;
    let shelfY = 0;
    let shelfHeight = 0;

    for (const { name, bitmap } of sprites) {
      if (shelfX + bitmap.width > atlasWidth) {
        shelfX = 0;
        shelfY += shelfHeight + SpriteAtlas.SHELF_PADDING;
        shelfHeight = 0;
      }

      regions[name] = { x: shelfX, y: shelfY, w: bitmap.width, h: bitmap.height };
      shelfX += bitmap.width + SpriteAtlas.SHELF_PADDING;
      shelfHeight = Math.max(shelfHeight, bitmap.height);
    }

    const canvas = document.createElement("canvas");
    canvas.width = atlasWidth;
    canvas.height = shelfY + shelfHeight;
    const context = canvas.getContext("2d");
    for (const { name, bitmap } of sprites) {
      const region = regions[name];
      context.drawImage(bitmap, region.x, region.y);
    }

    const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
    return { blob, regions };
  }

  private static blobToImage(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = URL.createObjectURL(blob);
    });
  }

  private static async readCache(hash: string): Promise<{ blob: Blob; regions: Record<string, SpriteAtlasRegion> } | undefined> {
    try {
      const db = await SpriteAtlas.openDb();
      const cached = await SpriteAtlas.idbGet<CachedAtlas>(db, SpriteAtlas.CACHE_KEY);
      if (cached && cached.hash === hash) {
        return { blob: cached.blob, regions: cached.regions };
      }
    } catch (e) {
      console.warn("SpriteAtlas: cache read failed, repacking.", e);
    }
    return undefined;
  }

  private static async writeCache(hash: string, blob: Blob, regions: Record<string, SpriteAtlasRegion>): Promise<void> {
    try {
      const db = await SpriteAtlas.openDb();
      await SpriteAtlas.idbPut<CachedAtlas>(db, SpriteAtlas.CACHE_KEY, { hash, blob, regions });
    } catch (e) {
      console.warn("SpriteAtlas: cache write failed.", e);
    }
  }

  private static openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(SpriteAtlas.DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(SpriteAtlas.STORE_NAME);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private static idbGet<T>(db: IDBDatabase, key: string): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      const request = db.transaction(SpriteAtlas.STORE_NAME, "readonly").objectStore(SpriteAtlas.STORE_NAME).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private static idbPut<T>(db: IDBDatabase, key: string, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = db.transaction(SpriteAtlas.STORE_NAME, "readwrite").objectStore(SpriteAtlas.STORE_NAME).put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public getImage(): HTMLImageElement {
    return this.image;
  }

  public getRegion(region: SpriteRegion): SpriteAtlasRegion | undefined {
    return this.regions[SpriteRegion[region]];
  }
}
