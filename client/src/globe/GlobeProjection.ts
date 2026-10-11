import { HexSphere } from "./HexSphere";

/**
 * Where the flat map's world pixels sit on the globe. The map's rows are the band between the polar
 * caps of HexSphere.polarCapsule(width / 6, height): each row runs all the way around at its own
 * latitude, spaced as on a Mercator map, and each tile's center lands on the band tile with the same
 * x and y. In between, the map is stretched evenly, so its art wraps the globe as drawn.
 *
 * Longitude 0 runs through the first column's even-row tile centers, and grows eastward (with x).
 * Directions follow HexSphere: y points north, longitude 0 faces +z, and east is toward +x.
 */
export class GlobeProjection {
  // Tile spacing on the flat map, in world pixels (see GameMap.ingestChunkTiles()).
  public static readonly TILE_STRIDE_X = 32;
  public static readonly TILE_STRIDE_Y = 25;
  // From a tile's sprite corner to its center, either way.
  public static readonly TILE_CENTER = 16;
  // A tile's pointed top and bottom reach this far past its row's spacing.
  private static readonly TILE_POINT = 7;

  public readonly gridWidth: number;
  public readonly gridHeight: number;
  /** World pixels once around the globe. */
  public readonly worldWidth: number;
  /** World pixels from the top row's highest point to the bottom row's lowest. */
  public readonly worldHeight: number;
  /** Mercator latitude between rows, and at the first row's tile centers. */
  public readonly rowStep: number;
  public readonly edgeMercator: number;

  constructor(gridWidth: number, gridHeight: number) {
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.worldWidth = gridWidth * GlobeProjection.TILE_STRIDE_X;
    this.worldHeight = gridHeight * GlobeProjection.TILE_STRIDE_Y + GlobeProjection.TILE_POINT;
    this.rowStep = HexSphere.capsuleRowStep(gridWidth);
    this.edgeMercator = HexSphere.capsuleEdgeMercator(gridWidth, gridHeight);
  }

  /** The unit vector at a longitude and latitude. */
  public static unitVector(longitude: number, latitude: number): [number, number, number] {
    return [Math.cos(latitude) * Math.sin(longitude), Math.sin(latitude), Math.cos(latitude) * Math.cos(longitude)];
  }

  /** Longitude and latitude, in radians, of a world point. */
  public toSphere(worldX: number, worldY: number): [number, number] {
    const longitude = ((worldX - GlobeProjection.TILE_CENTER) / this.worldWidth) * 2 * Math.PI;
    const mercator =
      this.edgeMercator - ((worldY - GlobeProjection.TILE_CENTER) / GlobeProjection.TILE_STRIDE_Y) * this.rowStep;
    return [longitude, 2 * Math.atan(Math.exp(mercator)) - Math.PI / 2];
  }

  /** The world point at a longitude and latitude, with x brought onto the map (0 to worldWidth). */
  public toWorld(longitude: number, latitude: number): [number, number] {
    const mercator = Math.log(Math.tan(Math.PI / 4 + latitude / 2));
    const x = (longitude / (2 * Math.PI)) * this.worldWidth + GlobeProjection.TILE_CENTER;
    const y =
      GlobeProjection.TILE_CENTER + ((this.edgeMercator - mercator) / this.rowStep) * GlobeProjection.TILE_STRIDE_Y;
    return [((x % this.worldWidth) + this.worldWidth) % this.worldWidth, y];
  }

  /** The latitude of a world y. */
  public latitudeAt(worldY: number) {
    return this.toSphere(0, worldY)[1];
  }
}
