import { resolveSpriteRegion, SpriteRegion } from "../Assets";

export interface BuildingData {
  name: string;
  asset_name: string;
  stats: Record<string, number>[];
}

export class Buidling {
  private name: string;
  private statLine: Record<string, number>;
  private spriteRegion: SpriteRegion;

  constructor(buildingData: BuildingData) {
    this.name = buildingData.name;
    this.spriteRegion = resolveSpriteRegion(buildingData.asset_name);
    this.statLine = {};

    for (const stat of buildingData.stats) {
      const statType = Object.keys(stat)[0]; // Get the stat type, e.g., "science", "gold", etc.
      const statValue = stat[statType]; // Get the stat value
      this.statLine[statType] = statValue;
    }
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
}
