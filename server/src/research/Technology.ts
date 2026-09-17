import { ConfigLoader } from "../util/ConfigLoader";

// A row range labeled for the research tree's visual section dividers/labels
// (e.g. "Ancient Era" spanning rows 0-1) - hand-placed in techs.yml, same as
// each tech's own row/slot.
export interface EraData {
  name: string;
  rows: number[];
}

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

  public static getAllEras(): EraData[] {
    return ConfigLoader.load<{ eras: EraData[] }>("./config/techs.yml").eras;
  }

  private static loadTechnologyData(): TechnologyData[] {
    return ConfigLoader.load<{ technologies: TechnologyData[] }>("./config/techs.yml").technologies;
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
