import { ConfigLoader } from "../util/ConfigLoader";
import type { BuildingEffectsData } from "./BuildingEffects";
import { BuildingEffectText } from "./BuildingEffectText";

export interface BuildingData {
  name: string;
  asset_name: string;
  stats: Record<string, number>[];
  // A great (world) wonder: one city in the whole world can have it.
  is_wonder?: boolean;
  // A national wonder: one city per civilization can have it.
  national_wonder?: boolean;
  // Absent for buildings never offered through a city's production queue (e.g.
  // Palace, which is only ever granted directly by applyFoundingBonuses()).
  cost?: number;
  // Gold paid every turn while the city has the building. Absent means none.
  maintenance?: number;
  required_tech?: string;
  // Extra hit points the building gives its city, e.g. Walls.
  city_health?: number;
  // A civilization's unique building: only that civ builds it, in place of the building it replaces.
  unique_to?: string;
  replaces?: string;
  // Only a city beside the sea can build it (Lighthouse, Harbor).
  coastal?: boolean;
  // A building the city needs first, as Civ 5's Temple needs a Shrine.
  requires_building?: string;
  // The city must sit on a river (Water Mill).
  requires_river?: boolean;
  // The city must sit next to a mountain (Observatory).
  requires_mountain?: boolean;
  // Civ 5's effects beyond flat yields (see BuildingEffects).
  effects?: BuildingEffectsData;
  // Real effects that need systems the game doesn't have yet. Shown in the tooltip, nothing applies them.
  not_yet?: string[];
  // Only on the copies sent to the client: what the effects above do, in words, for the tooltip.
  effect_lines?: string[];
}

export class Building {
  private name: string;
  private assetName: string;
  private statLine: Record<string, number>;
  private isWonder: boolean;
  private nationalWonder: boolean;
  private cost?: number;
  private maintenance: number;
  private requiredTech?: string;
  private cityHealth: number;
  private uniqueTo?: string;
  private replaces?: string;
  private coastal: boolean;
  private requiredBuilding?: string;
  private requiresRiver: boolean;
  private requiresMountain: boolean;
  private effects: BuildingEffectsData;
  private notYet: string[];

  constructor(data: BuildingData) {
    this.name = data.name;
    this.assetName = data.asset_name;
    this.isWonder = data.is_wonder ?? false;
    this.nationalWonder = data.national_wonder ?? false;
    this.cost = data.cost;
    this.maintenance = data.maintenance ?? 0;
    this.requiredTech = data.required_tech;
    this.cityHealth = data.city_health ?? 0;
    this.uniqueTo = data.unique_to;
    this.replaces = data.replaces;
    this.coastal = data.coastal ?? false;
    this.requiredBuilding = data.requires_building;
    this.requiresRiver = data.requires_river ?? false;
    this.requiresMountain = data.requires_mountain ?? false;
    this.effects = data.effects ?? {};
    this.notYet = data.not_yet ?? [];

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

  public isNationalWonder(): boolean {
    return this.nationalWonder;
  }

  public getCost(): number | undefined {
    return this.cost;
  }

  public getMaintenance(): number {
    return this.maintenance;
  }

  public getRequiredTech(): string | undefined {
    return this.requiredTech;
  }

  public getCityHealth(): number {
    return this.cityHealth;
  }

  public isCoastal(): boolean {
    return this.coastal;
  }

  public getRequiredBuilding(): string | undefined {
    return this.requiredBuilding;
  }

  public needsRiver(): boolean {
    return this.requiresRiver;
  }

  public needsMountain(): boolean {
    return this.requiresMountain;
  }

  public getEffects(): BuildingEffectsData {
    return this.effects;
  }

  // Reconstructs the {name, asset_name, stats} wire shape the client's own
  // Buidling class expects - the network contract doesn't change. The optional
  // fields (the wonder flags, maintenance, city_health, effects in words) are only
  // included when set, so an ordinary building's payload stays as small as it was.
  public toJSON(): BuildingData {
    const data: BuildingData = {
      name: this.name,
      asset_name: this.assetName,
      stats: Object.entries(this.statLine).map(([statType, statValue]) => ({ [statType]: statValue }))
    };

    if (this.isWonder) data.is_wonder = true;
    if (this.nationalWonder) data.national_wonder = true;
    if (this.maintenance > 0) data.maintenance = this.maintenance;
    if (this.cityHealth > 0) data.city_health = this.cityHealth;
    const effectLines = BuildingEffectText.describe(this.effects);
    if (effectLines.length > 0) data.effect_lines = effectLines;
    if (this.notYet.length > 0) data.not_yet = this.notYet;

    return data;
  }
}
