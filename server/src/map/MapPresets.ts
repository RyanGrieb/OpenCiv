import { ConfigLoader } from "../util/ConfigLoader";
import { GameMap } from "./GameMap";
import { Tile } from "./Tile";

// Matches one entry of server/config/map_presets.yml.
interface MapPresetConfigData {
  description?: string;
  legend: Record<string, string[]>;
  units?: Record<string, string>;
  rows: string[];
}

// One hex of a preset, positioned relative to the settler's hex in cube coordinates.
export interface MapPresetCell {
  letter: string;
  tileTypes: string[];
  unit?: string;
  cube: { x: number; y: number; z: number };
}

export interface MapPreset {
  name: string;
  description: string;
  cells: MapPresetCell[];
  // How many hexes the patch reaches from the settler's hex, so the spawn can keep that far from the map edge.
  radius: number;
}

// A stamped hex: the map tile it landed on and what the preset put there.
export interface StampedCell {
  tile: Tile;
  cell: MapPresetCell;
}

/**
 * Hand-drawn patches of map from config/map_presets.yml, stamped over a freshly generated map so a
 * scenario gets the same terrain every run (the mapPreset game option). Rows are drawn the way the
 * hex grid lies: a row that starts with a space sits half a hex to the right of the rows around it.
 */
export class MapPresets {
  // The letter the first player's Settler starts on.
  public static readonly SETTLER_LETTER = "S";

  public static getNames(): string[] {
    return Object.keys(MapPresets.loadPresetsData());
  }

  // Throws on a preset that doesn't exist or isn't drawn right, so a typo shows up at game start.
  public static get(name: string): MapPreset {
    const data = MapPresets.loadPresetsData()[name];
    if (!data) {
      throw new Error(`Unknown map preset "${name}". Known presets: ${MapPresets.getNames().join(", ")}`);
    }

    return MapPresets.parse(name, data);
  }

  public static parse(name: string, data: MapPresetConfigData): MapPreset {
    const grid = MapPresets.parseRows(name, data.rows);
    const settler = grid.find(({ letter }) => letter === MapPresets.SETTLER_LETTER);
    if (!settler) throw new Error(`Map preset "${name}" has no "${MapPresets.SETTLER_LETTER}" for the Settler`);

    const origin = MapPresets.toCube(settler.column, settler.row);
    const cells = grid.map(({ letter, column, row }) => {
      const tileTypes = data.legend[letter];
      if (!tileTypes || tileTypes.length === 0) {
        throw new Error(`Map preset "${name}" uses "${letter}", which its legend doesn't define`);
      }

      const cube = MapPresets.toCube(column, row);
      return {
        letter,
        tileTypes,
        unit: data.units?.[letter],
        cube: { x: cube.x - origin.x, y: cube.y - origin.y, z: cube.z - origin.z }
      };
    });

    const radius = Math.max(...cells.map(({ cube }) => Math.max(Math.abs(cube.x), Math.abs(cube.y), Math.abs(cube.z))));

    return { name, description: data.description ?? "", cells, radius };
  }

  /**
   * Rewrites the tiles around `anchor` so the preset's Settler hex lands on it. Each stamped tile loses
   * its rivers, and its tile types become the preset's. Returns every stamped tile with its cell, or
   * throws if the patch would run off the map.
   */
  public static stamp(preset: MapPreset, tiles: Tile[][], anchor: Tile): StampedCell[] {
    const anchorCube = GameMap.toCube(anchor.getX(), anchor.getY());

    const stamped = preset.cells.map((cell) => {
      const [gridX, gridY] = GameMap.cubeToGrid({
        x: anchorCube.x + cell.cube.x,
        y: anchorCube.y + cell.cube.y,
        z: anchorCube.z + cell.cube.z
      });
      const tile = tiles[GameMap.wrapX(gridX)]?.[gridY];
      if (!tile) throw new Error(`Map preset "${preset.name}" runs off the map at ${gridX},${gridY}`);

      return { tile, cell };
    });

    for (const { tile, cell } of stamped) {
      MapPresets.clearRivers(tile);
      tile.clearTileTypes();
      cell.tileTypes.forEach((tileType) => tile.addTileType(tileType));
    }

    return stamped;
  }

  // Cube coordinates for a preset's own column/row. Indented rows play the part of the map's odd rows.
  private static toCube(column: number, row: number) {
    const x = column - (row - (row & 1)) / 2;
    return { x, y: -x - row, z: row };
  }

  // Each row's letters, indexed by column. The first row sets which parity is indented, and the
  // rows after it have to alternate from there.
  private static parseRows(name: string, rows: string[]): { letter: string; column: number; row: number }[] {
    if (!rows || rows.length === 0) throw new Error(`Map preset "${name}" has no rows`);

    // If the first row is indented it's an odd row, so everything shifts down one to keep parity.
    const firstIndented = rows[0].startsWith(" ");
    const rowOffset = firstIndented ? 1 : 0;

    return rows.flatMap((text, index) => {
      const indented = text.startsWith(" ");
      if (indented !== ((index + rowOffset) % 2 === 1)) {
        throw new Error(`Map preset "${name}" row ${index + 1} should ${indented ? "not " : ""}start with a space`);
      }

      return text
        .trim()
        .split(/\s+/)
        .map((letter, column) => {
          if (letter.length !== 1) {
            throw new Error(`Map preset "${name}" row ${index + 1} has "${letter}": put one space between hexes`);
          }
          return { letter, column, row: index + rowOffset };
        });
    });
  }

  private static clearRivers(tile: Tile) {
    tile.getRiverSides().forEach((hasRiver, side) => {
      if (hasRiver) tile.setRiverSide(side, false, false);
    });
  }

  private static loadPresetsData(): Record<string, MapPresetConfigData> {
    return ConfigLoader.load<{ presets: Record<string, MapPresetConfigData> }>("./config/map_presets.yml").presets;
  }
}
