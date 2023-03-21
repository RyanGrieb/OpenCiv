import fs from "fs";
import random from "random";
import YAML from "yaml";

export class MapResource {
  name: string;
  spawnTiles: string[];
  pathLength: number;
  minTilesSet: number;
  maxTilesSet: number;
  setChance: number;
  minTemp: number;
  maxTemp: number;
  onAdditionalTileTypes: boolean;

  constructor(resourceData: any) {
    this.name = resourceData.name;
    this.spawnTiles = resourceData.spawn_tiles;
    this.pathLength = resourceData.path_length;
    this.minTilesSet = resourceData.min_tiles_set;
    this.maxTilesSet = resourceData.max_tiles_set;
    this.setChance = resourceData.set_chance;
    this.minTemp = resourceData.min_temp;
    this.maxTemp = resourceData.max_temp;
    this.onAdditionalTileTypes =
      resourceData.spawn_on_additional_tile_types ?? false;
  }

  public getName(): string {
    return this.name;
  }

  public getSpawnTiles(): string[] {
    return this.spawnTiles;
  }

  public getPathLength(): number {
    return this.pathLength;
  }

  public getMinTilesSet() {
    return this.minTilesSet;
  }

  public getMaxTilesSet() {
    return this.maxTilesSet;
  }

  public getSetChance() {
    return this.setChance;
  }

  public getMinTemp() {
    return this.minTemp;
  }

  public getMaxTemp() {
    return this.maxTemp;
  }

  public spawnOnAdditionalTileTypes() {
    return this.onAdditionalTileTypes;
  }
}

import { Tile } from "./Tile";

export class MapResources {
  private static resourcesData;

  public static async loadConfigurationFile() {
    const file = fs.readFileSync("./config/map_resources.yml", "utf-8");
    this.resourcesData = YAML.parse(file);
  }

  public static getRandomMapResource(options: {
    mapResourceType: string;
  }): MapResource {
    if (!this.resourcesData) this.loadConfigurationFile();

    let resourceData = undefined;

    switch (options.mapResourceType) {
      case "bonus":
        resourceData =
          this.resourcesData.bonus_resources[
            random.int(0, this.resourcesData.bonus_resources.length - 1)
          ];
        break;
      case "strategic":
        resourceData =
          this.resourcesData.strategic_resources[
            random.int(0, this.resourcesData.strategic_resources.length - 1)
          ];
        break;
      case "luxury":
        resourceData =
          this.resourcesData.luxury_resources[
            random.int(0, this.resourcesData.luxury_resources.length - 1)
          ];
        break;
    }

    return new MapResource(resourceData);
  }

  /**
   * Determine if the tile is a resource or a natural wonder
   * @param tile
   * @returns
   */
  public static isResourceTile(tile: Tile): boolean {
    if (!this.resourcesData) this.loadConfigurationFile();

    const resourceTileTypes = [
      ...this.resourcesData.bonus_resources.map((resource) => resource.name),
      ...this.resourcesData.strategic_resources.map(
        (resource) => resource.name
      ),
      ...this.resourcesData.luxury_resources.map((resource) => resource.name),
    ];
    return tile.containsTileTypes(resourceTileTypes);
  }
}
