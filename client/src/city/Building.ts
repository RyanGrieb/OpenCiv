import { resolveSpriteRegion, SpriteRegion } from "../Assets";

export interface BuildingData {
  name: string;
  asset_name: string;
  stats: Record<string, number>[];
  // Only sent when true. A great wonder is one per world, a national wonder one per civilization.
  is_wonder?: boolean;
  national_wonder?: boolean;
  // Gold a turn, and extra city hit points (Walls). Only sent when there are any.
  maintenance?: number;
  city_health?: number;
}

// Which section of the city's buildings window a building is listed in.
export type BuildingCategory = "Buildings" | "National Wonders" | "Great Wonders";

export class Buidling {
  private name: string;
  private statLine: Record<string, number>;
  private spriteRegion: SpriteRegion;
  private category: BuildingCategory;

  constructor(buildingData: BuildingData) {
    this.name = buildingData.name;
    this.spriteRegion = resolveSpriteRegion(buildingData.asset_name);
    this.category = Buidling.categoryOf(buildingData);
    this.statLine = {};

    for (const stat of buildingData.stats) {
      const statType = Object.keys(stat)[0]; // Get the stat type, e.g., "science", "gold", etc.
      const statValue = stat[statType]; // Get the stat value
      this.statLine[statType] = statValue;
    }
  }

  private static categoryOf(buildingData: BuildingData): BuildingCategory {
    if (buildingData.is_wonder) return "Great Wonders";
    if (buildingData.national_wonder) return "National Wonders";
    return "Buildings";
  }

  public getSpriteRegion() {
    return this.spriteRegion;
  }

  public getStatLine() {
    return this.statLine;
  }

  public getName() {
    return this.name;
  }

  public getCategory(): BuildingCategory {
    return this.category;
  }
}
