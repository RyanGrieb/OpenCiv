import { ConfigLoader } from "../util/ConfigLoader";

export interface BuildingData {
  name: string;
  asset_name: string;
  stats: Record<string, number>[];
  is_wonder?: boolean;
  // Absent for buildings never offered through a city's production queue (e.g.
  // Palace, which is only ever granted directly by applyFoundingBonuses()).
  cost?: number;
  required_tech?: string;
  // Extra hit points the building gives its city, e.g. Walls.
  city_health?: number;
  // A civilization's unique building: only that civ builds it, in place of the building it replaces.
  unique_to?: string;
  replaces?: string;
}

export class Building {
  private name: string;
  private assetName: string;
  private statLine: Record<string, number>;
  private isWonder: boolean;
  private cost?: number;
  private requiredTech?: string;
  private cityHealth: number;
  private uniqueTo?: string;
  private replaces?: string;

  constructor(data: BuildingData) {
    this.name = data.name;
    this.assetName = data.asset_name;
    this.isWonder = data.is_wonder ?? false;
    this.cost = data.cost;
    this.requiredTech = data.required_tech;
    this.cityHealth = data.city_health ?? 0;
    this.uniqueTo = data.unique_to;
    this.replaces = data.replaces;

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

  // Every building the config knows about, including ones with no `cost` -
  // callers building a production catalog must filter those out themselves.
  public static getAllBuildings(): Building[] {
    return Building.loadBuildingData().map((data) => new Building(data));
  }

  // Whether a civ can build this building: another civ's unique building is off limits, and so is any
  // building the civ's own unique building replaces. Mirrors Unit.isAvailableToCiv.
  public static isAvailableToCiv(building: Building, civName: string | undefined): boolean {
    if (building.uniqueTo) return building.uniqueTo === civName;

    return !Building.loadBuildingData().some((other) => other.unique_to === civName && other.replaces === building.name);
  }

  private static loadBuildingData(): BuildingData[] {
    return ConfigLoader.load<{ buildings: BuildingData[] }>("./config/buildings.yml").buildings;
  }

  private static getBuildingDataByName(name: string): BuildingData | undefined {
    return Building.loadBuildingData().find((building) => building.name.toLocaleLowerCase() === name.toLocaleLowerCase());
  }

  public getName() {
    return this.name;
  }

  public getAssetName() {
    return this.assetName;
  }

  public getStatLine(): Record<string, number> {
    return this.statLine;
  }

  public isWonderBuilding(): boolean {
    return this.isWonder;
  }

  public getCost(): number | undefined {
    return this.cost;
  }

  public getRequiredTech(): string | undefined {
    return this.requiredTech;
  }

  public getCityHealth(): number {
    return this.cityHealth;
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
