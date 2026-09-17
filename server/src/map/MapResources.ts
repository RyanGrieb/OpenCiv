import random from "random";
import { ConfigLoader } from "../util/ConfigLoader";

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

  constructor(resourceData: MapResourceConfigData) {
    this.name = resourceData.name;
    this.spawnTiles = resourceData.spawn_tiles;
    this.pathLength = resourceData.path_length;
    this.minTilesSet = resourceData.min_tiles_set;
    this.maxTilesSet = resourceData.max_tiles_set;
    this.setChance = resourceData.set_chance;
    this.minTemp = resourceData.min_temp;
    this.maxTemp = resourceData.max_temp;
    this.onAdditionalTileTypes = resourceData.spawn_on_additional_tile_types ?? false;
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

// Matches server/config/map_resources.yml
interface MapResourceConfigData {
  name: string;
  spawn_tiles: string[];
  path_length: number;
  min_tiles_set: number;
  max_tiles_set: number;
  set_chance: number;
  min_temp: number;
  max_temp: number;
  spawn_on_additional_tile_types?: boolean;
}

interface MapResourcesConfig {
  bonus_resources: MapResourceConfigData[];
  strategic_resources: MapResourceConfigData[];
  luxury_resources: MapResourceConfigData[];
}

export class MapResources {
  public static getRandomMapResource(options: { mapResourceType: string }): MapResource {
    const resourcesData = MapResources.loadResourcesData();
    let resourceData = undefined;

    switch (options.mapResourceType) {
      case "bonus":
        resourceData = resourcesData.bonus_resources[random.int(0, resourcesData.bonus_resources.length - 1)];
        break;
      case "strategic":
        resourceData =
          resourcesData.strategic_resources[random.int(0, resourcesData.strategic_resources.length - 1)];
        break;
      case "luxury":
        resourceData = resourcesData.luxury_resources[random.int(0, resourcesData.luxury_resources.length - 1)];
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
    const resourcesData = MapResources.loadResourcesData();
    const resourceTileTypes = [
      ...resourcesData.bonus_resources.map((resource: MapResourceConfigData) => resource.name),
      ...resourcesData.strategic_resources.map((resource: MapResourceConfigData) => resource.name),
      ...resourcesData.luxury_resources.map((resource: MapResourceConfigData) => resource.name)
    ];
    return tile.containsTileTypes(resourceTileTypes);
  }

  private static loadResourcesData(): MapResourcesConfig {
    return ConfigLoader.load<MapResourcesConfig>("./config/map_resources.yml");
  }
}
