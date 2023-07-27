import { SpriteRegion } from "../Assets";

export class Buidling {
  private name: string;
  private statLine: Record<string, any>;
  private spriteRegion: SpriteRegion;

  constructor(buildingData: JSON) {
    this.name = buildingData["name"];
    this.spriteRegion = SpriteRegion[buildingData["asset_name"]];
    this.statLine = {};

    for (const stat of buildingData["stats"]) {
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
