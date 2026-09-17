import fs from "fs";
import YAML from "yaml";

export interface TechnologyData {
  name: string;
  asset_name: string;
  cost: number;
  prerequisites: string[];
  description: string;
  // Horizontal position (0-9) within its row in the research tree, matching
  // Civ5's tech-web layout - a fixed 10-slot grid per row, some slots deliberately
  // left empty, rather than techs packed tightly together.
  slot: number;
  // Which row (0 = bottom) the tech sits in. Hand-authored like slot, not derived
  // from prerequisite depth - Civ5's actual layout doesn't pack every tech into
  // the shallowest row its prerequisites allow, so two techs can be equally deep
  // in the prerequisite graph and still sit in different rows.
  row: number;
}

export class Technology {
  private static technologyDataCache: TechnologyData[];

  private name: string;
  private assetName: string;
  private cost: number;
  private prerequisites: string[];
  private description: string;
  private slot: number;
  private row: number;

  constructor(data: TechnologyData) {
    this.name = data.name;
    this.assetName = data.asset_name;
    this.cost = data.cost;
    this.prerequisites = data.prerequisites ?? [];
    this.description = data.description;
    this.slot = data.slot;
    this.row = data.row;
  }

  public static createFromName(name: string): Technology | undefined {
    const data = Technology.getTechnologyDataByName(name);
    return data ? new Technology(data) : undefined;
  }

  public static getAllTechnologies(): Technology[] {
    return Technology.loadTechnologyData().map((data) => new Technology(data));
  }

  private static loadTechnologyData(): TechnologyData[] {
    if (!Technology.technologyDataCache) {
      const technologiesYMLData = YAML.parse(fs.readFileSync("./config/techs.yml", "utf-8"));
      Technology.technologyDataCache = JSON.parse(JSON.stringify(technologiesYMLData.technologies));
    }

    return Technology.technologyDataCache;
  }

  private static getTechnologyDataByName(name: string): TechnologyData | undefined {
    return Technology.loadTechnologyData().find((tech) => tech.name.toLocaleLowerCase() === name.toLocaleLowerCase());
  }

  public getName() {
    return this.name;
  }

  public getAssetName() {
    return this.assetName;
  }

  public getCost() {
    return this.cost;
  }

  public getPrerequisites() {
    return this.prerequisites;
  }

  public getDescription() {
    return this.description;
  }

  public getSlot() {
    return this.slot;
  }

  public getRow() {
    return this.row;
  }

  public toJSON() {
    return {
      name: this.name,
      asset_name: this.assetName,
      cost: this.cost,
      prerequisites: this.prerequisites,
      description: this.description,
      slot: this.slot,
      row: this.row
    };
  }
}
