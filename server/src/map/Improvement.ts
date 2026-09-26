import { Barbarians } from "../barbarian/Barbarians";
import { Player } from "../Player";
import { ConfigLoader } from "../util/ConfigLoader";
import { Tile } from "./Tile";

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
}

// The tile improvements (and forest/jungle clearing) a Builder can work on, from
// config/improvements.yml.
export class Improvement {
  // Trees and undergrowth that sit on top of a tile's terrain.
  public static readonly FEATURES = ["forest", "jungle"];

  public static getAllImprovementData(): ImprovementData[] {
    return ConfigLoader.load<{ improvements: ImprovementData[] }>("./config/improvements.yml").improvements;
  }

  // Everything a Builder is able to work on, whether or not it can be built anywhere right now.
  public static getBuildableImprovementData(): ImprovementData[] {
    return Improvement.getAllImprovementData().filter((improvement) => improvement.build_turns > 0);
  }

  public static getImprovementData(name: string): ImprovementData | undefined {
    return Improvement.getBuildableImprovementData().find((improvement) => improvement.name === name);
  }

  // Whether this player's Builder could start (or keep) working on the improvement on this tile.
  public static canBuild(improvement: ImprovementData, tile: Tile, player: Player): boolean {
    if (!(improvement.build_turns > 0)) return false;
    if (improvement.required_tech && !player.hasResearchedTech(improvement.required_tech)) return false;
    if (tile.isWater() || tile.getCity() || !tile.isWorkable()) return false;
    if (tile.containsTileType(Barbarians.CAMP_TILE_TYPE)) return false;

    if (improvement.removes_feature) {
      return tile.containsTileType(improvement.removes_feature) && !tile.getImprovement();
    }
    if (improvement.route)
      return !tile.containsTileType(improvement.tile_type) && Improvement.featuresAllow(improvement, tile);

    if (tile.getImprovement() || !Improvement.featuresAllow(improvement, tile)) return false;

    const resource = tile.getResource();
    if (resource) return improvement.resources?.[resource] !== undefined;

    return Improvement.terrainAllows(improvement, tile);
  }

  // Finishes the improvement on the tile. The caller is responsible for telling players about it.
  public static complete(improvement: ImprovementData, tile: Tile) {
    if (improvement.removes_feature) {
      tile.removeTileType(improvement.removes_feature);
      return;
    }

    if (improvement.route) {
      tile.addTileType(improvement.tile_type);
      return;
    }

    const resource = tile.getResource();
    const improvedResource = resource ? improvement.resources?.[resource] : undefined;
    if (improvedResource) tile.replaceTileType(resource, improvedResource);
    else tile.addTileType(improvement.tile_type);

    tile.setImprovement(improvement.name);
  }

  // Every feature on the tile has to be one the improvement can sit among, and a required one has
  // to be there.
  private static featuresAllow(improvement: ImprovementData, tile: Tile): boolean {
    if (improvement.requires_feature && !tile.containsTileType(improvement.requires_feature)) return false;

    const allowed = [...(improvement.features ?? []), improvement.requires_feature];
    return Improvement.FEATURES.every((feature) => !tile.containsTileType(feature) || allowed.includes(feature));
  }

  private static terrainAllows(improvement: ImprovementData, tile: Tile): boolean {
    if (!improvement.tile_type) return false;

    return !improvement.terrain || improvement.terrain.includes(tile.getTileTypes()[0]);
  }
}
