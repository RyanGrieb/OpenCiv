import fs from "fs";
import YAML from "yaml";

export interface BuildingData {
  name: string;
  asset_name: string;
  stats: Record<string, number>[];
  is_wonder?: boolean;
}

export class Building {
  private static buildingDataCache: Record<string, any>[];

  private name: string;
  private assetName: string;
  private statLine: Record<string, number>;
  private isWonder: boolean;

  constructor(data: BuildingData) {
    this.name = data.name;
    this.assetName = data.asset_name;
    this.isWonder = data.is_wonder ?? false;

    this.statLine = {};
    for (const stat of data.stats) {
      const statType = Object.keys(stat)[0];
      this.statLine[statType] = stat[statType];
    }
  }

  public static createFromName(name: string): Building | undefined {
    const data = Building.getBuildingDataByName(name);
    return data ? new Building(data) : undefined;
  }

  private static getBuildingDataByName(name: string): BuildingData | undefined {
    if (!Building.buildingDataCache) {
      const buildingsYMLData = YAML.parse(fs.readFileSync("./config/buildings.yml", "utf-8"));
      Building.buildingDataCache = JSON.parse(JSON.stringify(buildingsYMLData.buildings));
    }

    for (const building of Building.buildingDataCache) {
      if ((building.name as string).toLocaleLowerCase() === name.toLocaleLowerCase()) {
        return building as BuildingData;
      }
    }

    return undefined;
  }

  public getName() {
    return this.name;
  }

  public getStatLine(): Record<string, number> {
    return this.statLine;
  }

  public isWonderBuilding(): boolean {
    return this.isWonder;
  }

  // Reconstructs the {name, asset_name, stats} wire shape the client's own
  // Buidling class expects - the network contract doesn't change. is_wonder
  // is only included when true, so an ordinary building's payload is
  // byte-identical to what City.ts sent before this class existed.
  public toJSON(): BuildingData {
    const data: BuildingData = {
      name: this.name,
      asset_name: this.assetName,
      stats: Object.entries(this.statLine).map(([statType, statValue]) => ({ [statType]: statValue }))
    };

    if (this.isWonder) {
      data.is_wonder = true;
    }

    return data;
  }
}
