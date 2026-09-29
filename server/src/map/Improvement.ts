import { Barbarians } from "../barbarian/Barbarians";
import { Player } from "../Player";
import { TechEffects } from "../research/TechEffects";
import { ConfigLoader } from "../util/ConfigLoader";
import { Tile } from "./Tile";
import type { UnitDomain } from "../unit/Unit";

// One entry of config/improvements.yml - see the comment at the top of that file for what each
// field means.
export interface ImprovementData {
  name: string;
  // Absent where no sprite exists yet.
  asset_name?: string;
  icon?: string;
  required_tech?: string;
  // Absent for improvements a Builder can't construct yet.
  build_turns?: number;
  tile_type?: string;
  terrain?: string[];
  resources?: Record<string, string>;
  features?: string[];
  requires_feature?: string;
  route?: boolean;
  removes_feature?: string;
  outside_borders?: boolean;
  // "sea" for a Work Boat's improvements, built on water. Absent means a Builder's, on land.
  domain?: UnitDomain;
  // Finished the moment it's ordered, using up the unit that builds it (Civ 5's Fishing Boats).
  consumes_unit?: boolean;
}

// The tile improvements (and forest/jungle clearing) a Builder can work on, and the Fishing Boats a
// Work Boat can lay down, from config/improvements.yml.
export class Improvement {
  public static getAllImprovementData(): ImprovementData[] {
    return ConfigLoader.load<{ improvements: ImprovementData[] }>("./config/improvements.yml").improvements;
  }

  // Everything a land or sea worker is able to build, whether or not it can go anywhere right now.
  public static getBuildableImprovementData(domain: UnitDomain = "land"): ImprovementData[] {
    return Improvement.getAllImprovementData().filter(
      (improvement) => Improvement.isBuildable(improvement) && (improvement.domain ?? "land") === domain
    );
  }

  public static getImprovementData(name: string): ImprovementData | undefined {
    return Improvement.getAllImprovementData().find(
      (improvement) => improvement.name === name && Improvement.isBuildable(improvement)
    );
  }

  // The resource an improvement was built on, read back from the tile it left (copper_mine -> copper).
  public static getImprovedResource(tile: Tile): string | undefined {
    for (const improvement of Improvement.getAllImprovementData()) {
      const entry = Object.entries(improvement.resources ?? {}).find(([, improved]) => tile.containsTileType(improved));
      if (entry) return entry[0];
    }
    return undefined;
  }

  // Whether this player's Builder could start (or keep) working on the improvement on this tile.
  public static canBuild(improvement: ImprovementData, tile: Tile, player: Player): boolean {
    if (!Improvement.isBuildable(improvement)) return false;
    if (improvement.required_tech && !player.hasResearchedTech(improvement.required_tech)) return false;
    if (improvement.domain === "sea") return Improvement.canBuildAtSea(improvement, tile, player);
    if (tile.isWater() || tile.getCity() || !tile.isWorkable()) return false;
    if (tile.containsTileType(Barbarians.CAMP_TILE_TYPE)) return false;
    if (!Improvement.territoryAllows(improvement, tile, player)) return false;

    if (improvement.removes_feature) {
      return tile.containsTileType(improvement.removes_feature) && !tile.getImprovement();
    }
    if (improvement.route)
      return !tile.containsTileType(improvement.tile_type) && Improvement.featuresAllow(improvement, tile);

    if (tile.getImprovement() || !Improvement.featuresAllow(improvement, tile)) return false;

    const resource = Improvement.getVisibleResource(tile, player);
    if (resource) return improvement.resources?.[resource] !== undefined;

    return Improvement.terrainAllows(improvement, tile);
  }

  // Finishes the improvement on the tile. The caller is responsible for telling players about it.
  // builder is whose Builder did the work: a resource they can't see yet stays as it is, under the
  // improvement, as in Civ 5 (a Mine dug before Iron Working turns out to sit on Iron later).
  public static complete(improvement: ImprovementData, tile: Tile, builder?: Player) {
    if (improvement.removes_feature) {
      tile.removeTileType(improvement.removes_feature);
      return;
    }

    if (improvement.route) {
      tile.addTileType(improvement.tile_type);
      return;
    }

    const resource = Improvement.getVisibleResource(tile, builder);
    const improvedResource = resource ? improvement.resources?.[resource] : undefined;
    if (improvedResource) tile.replaceTileType(resource, improvedResource);
    else tile.addTileType(improvement.tile_type);

    tile.setImprovement(improvement.name);
  }

  // The tile's resource, unless the player hasn't the tech to see it yet - then the tile is plain land to them.
  private static getVisibleResource(tile: Tile, player?: Player): string | undefined {
    const resource = tile.getResource();
    if (!resource || TechEffects.isResourceHidden(resource, player)) return undefined;

    return resource;
  }

  private static isBuildable(improvement: ImprovementData): boolean {
    return improvement.build_turns > 0 || !!improvement.consumes_unit;
  }

  // A sea improvement goes on an unimproved water resource it lists, inside the player's own borders.
  private static canBuildAtSea(improvement: ImprovementData, tile: Tile, player: Player): boolean {
    if (!tile.isWater() || tile.getImprovement()) return false;
    if (!Improvement.territoryAllows(improvement, tile, player)) return false;

    const resource = tile.getResource();
    return !!resource && improvement.resources?.[resource] !== undefined;
  }

  // Every feature on the tile has to be one the improvement can sit among, and a required one has
  // to be there.
  private static featuresAllow(improvement: ImprovementData, tile: Tile): boolean {
    if (improvement.requires_feature && !tile.containsTileType(improvement.requires_feature)) return false;

    const allowed = [...(improvement.features ?? []), improvement.requires_feature];
    return Tile.FEATURES.every((feature) => !tile.containsTileType(feature) || allowed.includes(feature));
  }

  // Improvements go in the Builder's own territory; roads and clearing may also go on unowned land.
  private static territoryAllows(improvement: ImprovementData, tile: Tile, player: Player): boolean {
    const owner = tile.getCityTerritoryOf()?.getPlayer();
    if (owner) return owner === player;

    return !!improvement.outside_borders;
  }

  private static terrainAllows(improvement: ImprovementData, tile: Tile): boolean {
    if (!improvement.tile_type) return false;

    return !improvement.terrain || improvement.terrain.includes(tile.getTileTypes()[0]);
  }
}
