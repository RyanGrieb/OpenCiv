import random from "random";
import { ConfigLoader } from "../util/ConfigLoader";
import { Tile } from "./Tile";

// Matches one entry of server/config/natural_wonders.yml.
export interface NaturalWonderData {
  name: string;
  tile_type: string;
  spawn_tiles: string[];
  impassable: boolean;
}

/**
 * Civ 5's natural wonders (config/natural_wonders.yml): unique landmarks, each placed at most once
 * per map on top of a bare terrain tile. Their yields live in tiles.yml and replace the terrain's
 * (see Tile.getStats), and most can't be entered by any unit (see Tile.getMovementCost).
 */
export class NaturalWonders {
  // Wonders keep at least this many tiles apart, so no corner of the map gets two.
  public static readonly MIN_WONDER_DISTANCE = 4;
  // Keeps a wonder off the map's top and bottom rows, where it could only be seen from one side.
  public static readonly MAP_EDGE_BUFFER = 2;

  public static getAll(): NaturalWonderData[] {
    return ConfigLoader.load<{ natural_wonders: NaturalWonderData[] }>("./config/natural_wonders.yml").natural_wonders;
  }

  public static getTileTypes(): string[] {
    return NaturalWonders.getAll().map((wonder) => wonder.tile_type);
  }

  // The wonder standing on this tile, if there is one.
  public static getWonderOn(tile: Tile): NaturalWonderData | undefined {
    return NaturalWonders.getAll().find((wonder) => tile.containsTileType(wonder.tile_type));
  }

  // Civ 5 places 2 wonders on a Duel map up to 7 on a Huge one; this lands close to that for our map sizes.
  public static getCountForMapArea(mapArea: number): number {
    return Math.min(NaturalWonders.getAll().length, Math.max(1, Math.round(Math.sqrt(mapArea) / 13)));
  }

  /**
   * Places `count` different wonders, picked at random, each on a random tile it's allowed on. A
   * wonder with nowhere to go is skipped rather than forced. Returns the tiles that got one.
   */
  public static generate(tiles: Tile[][], count: number): Tile[] {
    const wonders = NaturalWonders.shuffle([...NaturalWonders.getAll()]);
    const placed: Tile[] = [];

    for (const wonder of wonders) {
      if (placed.length >= count) break;

      const candidates = tiles.flat().filter((tile) => NaturalWonders.canPlace(wonder, tile, tiles[0].length));
      if (candidates.length === 0) {
        console.log(`No room for natural wonder: ${wonder.name}`);
        continue;
      }

      const tile = candidates[random.int(0, candidates.length - 1)];
      tile.addTileType(wonder.tile_type);
      placed.push(tile);
      console.log(`Placed natural wonder ${wonder.name} at (${tile.getX()}, ${tile.getY()})`);
    }

    return placed;
  }

  // Bare terrain the wonder spawns on, clear of the map's top and bottom and of every other wonder.
  public static canPlace(wonder: NaturalWonderData, tile: Tile, mapHeight: number): boolean {
    const tileTypes = tile.getTileTypes();
    if (tileTypes.length !== 1 || !wonder.spawn_tiles.includes(tileTypes[0])) return false;
    if (tile.getY() < NaturalWonders.MAP_EDGE_BUFFER || tile.getY() >= mapHeight - NaturalWonders.MAP_EDGE_BUFFER) {
      return false;
    }

    return !NaturalWonders.isNearWonder(tile);
  }

  private static isNearWonder(origin: Tile): boolean {
    const wonderTypes = NaturalWonders.getTileTypes();
    const seen = new Set<Tile>([origin]);
    let frontier = [origin];

    for (let step = 0; step < NaturalWonders.MIN_WONDER_DISTANCE; step++) {
      if (frontier.some((tile) => tile.containsTileTypes(wonderTypes))) return true;

      frontier = frontier
        .flatMap((tile) => tile.getAdjacentTiles())
        .filter((tile) => tile && !seen.has(tile) && seen.add(tile));
    }

    return false;
  }

  private static shuffle<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i--) {
      const j = random.int(0, i);
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }
}
