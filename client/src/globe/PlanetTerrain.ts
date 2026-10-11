import { SpriteRegion } from "../Assets";
import { HexSphere } from "./HexSphere";

export type PlanetKind = "earth" | "desert" | "ice" | "moon";

/** What one tile looks like: its terrain sprite, then any sprites standing on it, bottom first. */
export interface PlanetTile {
  label: string;
  base: SpriteRegion;
  overlays: SpriteRegion[];
  mirrored: boolean;
}

/**
 * A throwaway random map for the hex planet prototype - not the server's map generator. Elevation
 * and moisture come from 3D noise sampled at each tile's center, so the map has no seams or
 * stretched poles; latitude sets the temperature.
 */
export class PlanetTerrain {
  private static readonly LAND_RESOURCES: Record<string, string[]> = {
    grass: ["TILE_CATTLE", "TILE_COTTON", "TILE_HORSES", "TILE_CITRUS"],
    plains: ["TILE_WHEAT", "TILE_HORSES", "TILE_STONE", "TILE_OLIVES"],
    desert: ["TILE_GOLD", "TILE_STONE", "TILE_COPPER"],
    tundra: ["TILE_IRON", "TILE_HORSES"],
    snow: ["TILE_IRON"]
  };
  private static readonly HILL_RESOURCES = ["TILE_SHEEP", "TILE_IRON", "TILE_COPPER", "TILE_GOLD"];
  private static readonly SHALLOW_RESOURCES = ["TILE_FISH", "TILE_CRAB", "TILE_PEARLS", "TILE_TURTLES"];
  private static readonly OCEAN_RESOURCES = ["TILE_WHALES", "TILE_FISH"];
  private static readonly LAND_WONDERS = [
    "TILE_MT_FUJI",
    "TILE_MT_KILIMANJARO",
    "TILE_CERRO_DE_POTOSI",
    "TILE_GRAND_MESA",
    "TILE_BARRINGER_CRATER"
  ];
  private static readonly WATER_WONDERS = ["TILE_KRAKATOA", "TILE_GREAT_BARRIER_REEF"];
  private static readonly SETTLEMENTS = ["TILE_CITY", "TILE_CITY", "TILE_BARBARIAN_CAMP", "TILE_ANCIENT_RUINS"];

  /** Generates every tile of `sphere`, the same each time for the same kind and seed. */
  public static generate(sphere: HexSphere, kind: PlanetKind, seed: number): PlanetTile[] {
    const random = PlanetTerrain.createRandom(seed);
    const count = sphere.tileCount;
    const elevation = new Float32Array(count);
    const moisture = new Float32Array(count);
    for (let t = 0; t < count; t++) {
      const x = sphere.centers[t * 3];
      const y = sphere.centers[t * 3 + 1];
      const z = sphere.centers[t * 3 + 2];
      elevation[t] = PlanetTerrain.fractalNoise(x * 1.5, y * 1.5, z * 1.5, seed, 6);
      moisture[t] = PlanetTerrain.fractalNoise(x * 2.2 + 31, y * 2.2, z * 2.2, seed + 17, 4);
    }

    const waterShare = { earth: 0.62, desert: 0.08, ice: 0.35, moon: 0 }[kind];
    const seaLevel = PlanetTerrain.quantile(elevation, waterShare);
    const hillLevel = PlanetTerrain.quantile(elevation, waterShare + (1 - waterShare) * 0.7);
    const mountainLevel = PlanetTerrain.quantile(elevation, waterShare + (1 - waterShare) * 0.9);
    const isWater = (tile: number) => elevation[tile] < seaLevel;

    const tiles: PlanetTile[] = [];
    for (let t = 0; t < count; t++) {
      const latitude = Math.abs(sphere.centers[t * 3 + 1]);
      const hash = PlanetTerrain.hashTile(t, seed);
      const tile: PlanetTile = { label: "", base: SpriteRegion.TILE_OCEAN, overlays: [], mirrored: hash % 2 === 1 };
      tiles.push(tile);

      if (isWater(t)) {
        const coastal = PlanetTerrain.someNeighbor(sphere, t, (neighbor) => !isWater(neighbor));
        PlanetTerrain.fillWater(tile, kind, coastal, latitude, hash, random);
        continue;
      }

      let temperature =
        1 -
        latitude * 1.15 +
        (PlanetTerrain.fractalNoise(
          sphere.centers[t * 3] * 4,
          sphere.centers[t * 3 + 1] * 4,
          sphere.centers[t * 3 + 2] * 4,
          seed + 5,
          2
        ) -
          0.5) *
          0.3;
      if (kind === "ice") temperature -= 0.55;
      if (kind === "desert") temperature += 0.4;
      const height = elevation[t] >= mountainLevel ? "mountain" : elevation[t] >= hillLevel ? "hill" : "flat";
      PlanetTerrain.fillLand(tile, kind, temperature, moisture[t], height, hash, random);
    }
    return tiles;
  }

  private static fillWater(
    tile: PlanetTile,
    kind: PlanetKind,
    coastal: boolean,
    latitude: number,
    hash: number,
    random: () => number
  ) {
    if (latitude > 0.9 || kind === "ice") {
      tile.label = "Polar ice";
      tile.base = PlanetTerrain.variant("TILE_SNOW", hash);
      return;
    }

    tile.label = coastal ? "Coast" : "Ocean";
    tile.base = PlanetTerrain.variant(coastal ? "TILE_SHALLOW_OCEAN" : "TILE_OCEAN", hash);
    const roll = random();
    if (roll < 0.002) {
      tile.overlays.push(PlanetTerrain.pick(PlanetTerrain.WATER_WONDERS, random));
      tile.label += ", natural wonder";
    } else if (roll < (coastal ? 0.08 : 0.02)) {
      tile.overlays.push(
        PlanetTerrain.pick(coastal ? PlanetTerrain.SHALLOW_RESOURCES : PlanetTerrain.OCEAN_RESOURCES, random)
      );
    }
  }

  private static fillLand(
    tile: PlanetTile,
    kind: PlanetKind,
    temperature: number,
    moisture: number,
    height: "flat" | "hill" | "mountain",
    hash: number,
    random: () => number
  ) {
    let terrain = "grass";
    if (kind === "moon") terrain = "desert";
    else if (temperature < 0.12) terrain = "snow";
    else if (temperature < 0.3) terrain = "tundra";
    else if (temperature > 0.72 && moisture < 0.5) terrain = "desert";
    else if (moisture < 0.45) terrain = "plains";

    tile.base = PlanetTerrain.variant(`TILE_${terrain.toUpperCase()}`, hash);
    tile.label = terrain[0].toUpperCase() + terrain.slice(1);

    if (height === "mountain") {
      tile.overlays.push(PlanetTerrain.variant("TILE_MOUNTAIN", hash >>> 3));
      tile.label = "Mountain";
      return;
    }
    if (height === "hill") {
      tile.overlays.push(PlanetTerrain.variant(`TILE_HILLS_${terrain.toUpperCase()}`, hash >>> 3));
      tile.label += " hills";
    }

    const forested = kind === "earth" && moisture > 0.55 && terrain !== "desert" && terrain !== "snow";
    if (forested) {
      const jungle = temperature > 0.75 && moisture > 0.62;
      const autumn = terrain === "tundra";
      const feature = jungle ? "TILE_JUNGLE" : autumn ? "TILE_FOREST_AUTUMN" : "TILE_FOREST";
      tile.overlays.push(PlanetTerrain.variant(feature, hash >>> 5));
      tile.label += jungle ? ", jungle" : ", forest";
    }

    const roll = random();
    if (kind === "moon") {
      if (roll < 0.03) tile.overlays.push(SpriteRegion.TILE_BARRINGER_CRATER);
      return;
    }
    if (roll < 0.003) {
      tile.overlays.push(PlanetTerrain.pick(PlanetTerrain.LAND_WONDERS, random));
      tile.label += ", natural wonder";
    } else if (kind === "earth" && roll < 0.012 && height === "flat" && !forested) {
      tile.overlays.push(PlanetTerrain.pick(PlanetTerrain.SETTLEMENTS, random));
    } else if (roll < 0.07) {
      tile.overlays.push(
        PlanetTerrain.pick(
          height === "hill" ? PlanetTerrain.HILL_RESOURCES : PlanetTerrain.LAND_RESOURCES[terrain],
          random
        )
      );
    }
  }

  // One of a sprite's looks: the plain one for half the tiles, else one of its numbered variants.
  public static variant(name: string, hash: number): SpriteRegion {
    // Variants are numbered from 2, the plain sprite being the first - as Tile.pickVariant() does.
    let variantCount = 0;
    while (PlanetTerrain.region(`${name}_${variantCount + 2}`) !== undefined) variantCount++;
    if (variantCount === 0) return PlanetTerrain.region(name);

    const roll = hash % (variantCount * 2);
    return PlanetTerrain.region(roll < variantCount ? name : `${name}_${roll - variantCount + 2}`);
  }

  private static pick(names: string[], random: () => number): SpriteRegion {
    return PlanetTerrain.region(names[Math.floor(random() * names.length)]);
  }

  private static region(name: string): SpriteRegion | undefined {
    return SpriteRegion[name as keyof typeof SpriteRegion];
  }

  private static someNeighbor(sphere: HexSphere, tile: number, test: (neighbor: number) => boolean): boolean {
    for (let i = sphere.cornerStart[tile]; i < sphere.cornerStart[tile + 1]; i++) {
      if (test(sphere.neighbors[i])) return true;
    }
    return false;
  }

  // The value `share` of the way up the sorted values.
  private static quantile(values: Float32Array, share: number): number {
    if (share <= 0) return -Infinity;
    const sorted = Float32Array.from(values).sort();
    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * share))];
  }

  // Octaves of smooth 3D value noise, in [0, 1).
  private static fractalNoise(x: number, y: number, z: number, seed: number, octaves: number): number {
    let total = 0;
    let amplitude = 1;
    let weight = 0;
    for (let octave = 0; octave < octaves; octave++) {
      total += PlanetTerrain.valueNoise(x, y, z, seed + octave * 101) * amplitude;
      weight += amplitude;
      amplitude *= 0.5;
      x *= 2;
      y *= 2;
      z *= 2;
    }
    return total / weight;
  }

  private static valueNoise(x: number, y: number, z: number, seed: number): number {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const z0 = Math.floor(z);
    const sx = PlanetTerrain.smoothstep(x - x0);
    const sy = PlanetTerrain.smoothstep(y - y0);
    const sz = PlanetTerrain.smoothstep(z - z0);
    const corner = (dx: number, dy: number, dz: number) => PlanetTerrain.latticeValue(x0 + dx, y0 + dy, z0 + dz, seed);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const near = lerp(lerp(corner(0, 0, 0), corner(1, 0, 0), sx), lerp(corner(0, 1, 0), corner(1, 1, 0), sx), sy);
    const far = lerp(lerp(corner(0, 0, 1), corner(1, 0, 1), sx), lerp(corner(0, 1, 1), corner(1, 1, 1), sx), sy);
    return lerp(near, far, sz);
  }

  private static latticeValue(x: number, y: number, z: number, seed: number): number {
    let hash =
      Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 2147483647) + Math.imul(seed, 1442695041);
    hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
    return ((hash ^ (hash >>> 16)) >>> 0) / 4294967296;
  }

  private static hashTile(tile: number, seed: number): number {
    let hash = Math.imul(tile, 374761393) + Math.imul(seed, 668265263);
    hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
    return (hash ^ (hash >>> 16)) >>> 0;
  }

  private static smoothstep(t: number): number {
    return t * t * (3 - 2 * t);
  }

  // A small seeded generator (mulberry32), so a planet looks the same every time it's built.
  private static createRandom(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
}
