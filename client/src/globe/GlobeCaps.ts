import { GlobeProjection } from "./GlobeProjection";
import { HexSphere } from "./HexSphere";
import { PlanetMesh } from "./PlanetMesh";
import { PlanetTerrain, PlanetTile } from "./PlanetTerrain";

/**
 * The globe's two polar caps: rings of polar ice past the map's top and bottom rows that close the
 * band the map wraps around. The globe's twelve pentagons are where they meet the map - six tiles of
 * its top row and six of its bottom row. The caps aren't part of the map, so nothing goes there,
 * like Civ 5's polar ice.
 */
export class GlobeCaps {
  private static readonly POLAR_ICE = "TILE_SNOW";

  /** One mesh with both caps, for a globe of radius 1. */
  public static build(projection: GlobeProjection): PlanetMesh {
    const capRows = projection.gridWidth / 6;
    const sphere = HexSphere.polarCapsule(capRows, projection.gridHeight);

    const tiles: (PlanetTile | null)[] = [];
    for (let tile = 0; tile < sphere.tileCount; tile++) {
      const mapY = sphere.rows[tile] - capRows;
      if (mapY >= 0 && mapY < projection.gridHeight) {
        tiles.push(null);
        continue;
      }

      const hash = Math.imul(tile + 1, 2654435761) >>> 0;
      tiles.push({
        label: "Polar ice",
        base: PlanetTerrain.variant(GlobeCaps.POLAR_ICE, hash),
        overlays: [],
        mirrored: (hash & 1) === 1
      });
    }

    GlobeCaps.fitToMap(sphere, projection, capRows);
    return new PlanetMesh(sphere, tiles, 1);
  }

  /**
   * Moves the corners the caps share with the map's top and bottom rows onto those tiles' own hex
   * corners, as the map's art lands on the globe, so the caps meet it without a gap or an overlap.
   * Where a cap reaches down between two map tiles, it takes the corner between their sides; where
   * it sits against one, that tile's pointed top (or bottom).
   */
  private static fitToMap(sphere: HexSphere, projection: GlobeProjection, capRows: number) {
    const cornerCount = sphere.corners.length / 3;
    const cornerTiles = new Int32Array(cornerCount * 3);
    const filled = new Uint8Array(cornerCount);
    for (let tile = 0; tile < sphere.tileCount; tile++) {
      for (let i = sphere.cornerStart[tile]; i < sphere.cornerStart[tile + 1]; i++) {
        const corner = sphere.tileCorners[i];
        cornerTiles[corner * 3 + filled[corner]++] = tile;
      }
    }

    const mapTiles: number[] = [];
    for (let corner = 0; corner < cornerCount; corner++) {
      mapTiles.length = 0;
      for (let k = 0; k < 3; k++) {
        const tile = cornerTiles[corner * 3 + k];
        const mapY = sphere.rows[tile] - capRows;
        if (mapY >= 0 && mapY < projection.gridHeight) mapTiles.push(tile);
      }
      if (mapTiles.length === 0 || mapTiles.length === 3) continue;

      const [worldX, worldY] = GlobeCaps.sharedCorner(sphere, projection, capRows, mapTiles);
      const [x, y, z] = GlobeProjection.unitVector(...projection.toSphere(worldX, worldY));
      sphere.corners[corner * 3] = x;
      sphere.corners[corner * 3 + 1] = y;
      sphere.corners[corner * 3 + 2] = z;
    }
  }

  // The world point of a corner where a cap meets one map tile, or two side by side.
  private static sharedCorner(
    sphere: HexSphere,
    projection: GlobeProjection,
    capRows: number,
    mapTiles: number[]
  ): [number, number] {
    const mapY = sphere.rows[mapTiles[0]] - capRows;
    const north = mapY === 0;
    let mapX = sphere.columns[mapTiles[0]];
    // A tile's corner in its own sprite pixels: its pointed top or bottom, or the top or bottom of
    // its east side - which, of two tiles side by side, is the western one's.
    let cornerX = 16;
    let cornerY = north ? 0 : 32;
    if (mapTiles.length === 2) {
      const otherX = sphere.columns[mapTiles[1]];
      if ((mapX - otherX + projection.gridWidth) % projection.gridWidth === 1) mapX = otherX;
      cornerX = 32;
      cornerY = north ? 7 : 25;
    }

    const spriteX = mapX * GlobeProjection.TILE_STRIDE_X + (mapY % 2 !== 0 ? GlobeProjection.TILE_CENTER : 0);
    return [spriteX + cornerX, mapY * GlobeProjection.TILE_STRIDE_Y + cornerY];
  }
}
