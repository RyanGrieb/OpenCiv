import { MapResources } from "../map/MapResources";
import { Tile } from "../map/Tile";

/**
 * Civ 5's culture border growth: how much culture a city needs to claim its next tile, and which
 * tile it claims. The culture and distance values mirror the Civ 5 GlobalDefines entries named
 * beside them; the tile priorities follow the Civ 5 wiki's Territory page.
 */
export class BorderGrowth {
  // Culture for the next tile is FIRST_TILE_COST + (LATER_TILE_MULTIPLIER * tilesAcquired) ^ LATER_TILE_EXPONENT,
  // so 20, 32, 46, 62, 77, ... (CULTURE_COST_FIRST_PLOT, CULTURE_COST_LATER_PLOT_MULTIPLIER/_EXPONENT).
  public static readonly FIRST_TILE_COST = 20;
  public static readonly LATER_TILE_MULTIPLIER = 10;
  public static readonly LATER_TILE_EXPONENT = 1.1;

  // Borders reach up to 5 tiles from the city (MAXIMUM_ACQUIRE_PLOT_DISTANCE), but its citizens
  // only work the first 3 rings.
  public static readonly MAX_ACQUIRE_DISTANCE = 5;
  public static readonly MAX_WORK_DISTANCE = 3;

  // Influence costs: the city claims the candidate with the lowest total. Each ring out adds
  // DISTANCE_COST, so borders fill in evenly around the city. A tile's most important feature pulls
  // it forward, in the wiki's order: a luxury, strategic or bonus resource, then bordering a
  // resource, then a river or lake. Features don't stack, so that order holds within a ring, and a
  // resource is worth reaching more than a ring further out for.
  public static readonly INFLUENCE_DISTANCE_COST = 100;
  public static readonly INFLUENCE_LUXURY_COST = -250;
  public static readonly INFLUENCE_STRATEGIC_COST = -200;
  public static readonly INFLUENCE_BONUS_COST = -150;
  public static readonly INFLUENCE_NEXT_TO_RESOURCE_COST = -75;
  public static readonly INFLUENCE_RIVER_OR_LAKE_COST = -50;

  public static getCultureCost(tilesAcquired: number): number {
    const laterTileCost = Math.pow(BorderGrowth.LATER_TILE_MULTIPLIER * tilesAcquired, BorderGrowth.LATER_TILE_EXPONENT);
    return Math.floor(BorderGrowth.FIRST_TILE_COST + laterTileCost);
  }

  // How many tiles each tile within maxRing sits from the center, walking the hex grid (so it
  // follows the map's east-west wrap). The center itself is ring 0.
  public static getRingDistances(center: Tile, maxRing: number): Map<Tile, number> {
    const rings = new Map<Tile, number>([[center, 0]]);
    let frontier = [center];

    for (let ring = 1; ring <= maxRing; ring++) {
      const nextFrontier: Tile[] = [];

      for (const frontierTile of frontier) {
        for (const adjTile of frontierTile.getAdjacentTiles()) {
          if (!adjTile || rings.has(adjTile)) continue;

          rings.set(adjTile, ring);
          nextFrontier.push(adjTile);
        }
      }

      frontier = nextFrontier;
    }

    return rings;
  }

  /**
   * The tile a city's borders grow into next: an unowned tile touching its territory, within reach
   * of the city, with the lowest influence cost. Ties are broken at random, as in Civ 5. Undefined
   * once there's nothing left to claim.
   */
  public static chooseNextTile(centerTile: Tile, territory: Tile[]): Tile | undefined {
    const candidates = BorderGrowth.getCandidates(centerTile, territory);
    if (candidates.length < 1) return undefined;

    const lowestCost = Math.min(...candidates.map((candidate) => candidate.cost));
    const cheapest = candidates.filter((candidate) => candidate.cost === lowestCost);

    return cheapest[Math.floor(Math.random() * cheapest.length)].tile;
  }

  public static getInfluenceCost(tile: Tile, distance: number): number {
    return distance * BorderGrowth.INFLUENCE_DISTANCE_COST + BorderGrowth.getFeatureCost(tile);
  }

  private static getCandidates(centerTile: Tile, territory: Tile[]): { tile: Tile; cost: number }[] {
    const owned = new Set(territory);
    const candidates: { tile: Tile; cost: number }[] = [];

    for (const [tile, distance] of BorderGrowth.getRingDistances(centerTile, BorderGrowth.MAX_ACQUIRE_DISTANCE)) {
      if (tile.getCityTerritoryOf()) continue;
      if (!tile.getAdjacentTiles().some((adjTile) => owned.has(adjTile))) continue;

      candidates.push({ tile, cost: BorderGrowth.getInfluenceCost(tile, distance) });
    }

    return candidates;
  }

  // The cost of the most important feature on or around the tile, or 0 when it has none.
  private static getFeatureCost(tile: Tile): number {
    const resource = tile.getResource();
    if (resource) {
      const category = MapResources.getResourceCategory(resource);
      if (category === "luxury") return BorderGrowth.INFLUENCE_LUXURY_COST;
      if (category === "strategic") return BorderGrowth.INFLUENCE_STRATEGIC_COST;
      return BorderGrowth.INFLUENCE_BONUS_COST;
    }

    if (tile.getAdjacentTiles().some((adjTile) => adjTile?.getResource())) {
      return BorderGrowth.INFLUENCE_NEXT_TO_RESOURCE_COST;
    }

    if (tile.hasRiver() || tile.containsTileType("freshwater")) return BorderGrowth.INFLUENCE_RIVER_OR_LAKE_COST;
    return 0;
  }
}
