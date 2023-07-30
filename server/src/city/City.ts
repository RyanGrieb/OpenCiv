import { Game } from "../Game";
import { Player } from "../Player";
import { Tile } from "../map/Tile";

export interface CityOptions {
  tile: Tile;
  player: Player;
}

export class City {
  private tile: Tile;
  private player: Player;
  private name: string;
  private buildings: Record<string, any>[];
  private population: number;
  private foodSurplus: number;

  /**
   * Creates a new City instance.
   * @param options - The options for initializing the city.
   * @param options.tile - The tile where the city is located.
   * @param options.player - The player who owns the city.
   */
  constructor(options: CityOptions) {
    this.tile = options.tile;
    this.player = options.player;
    this.name = this.player.getNextAvailableCityName();
    this.buildings = [];
    this.population = 1;
    this.foodSurplus = 0;
  }

  public addBuilding(name: string) {
    // Get the building data from YML
    const buildingData = Game.getBuildingDataByName(name);

    // Apply any effects to the building if any (faith, culture, bonuses, etc.)):
    //...

    this.buildings.push(buildingData);

    // Send new-building packet to player
    this.player.sendNetworkEvent({
      event: "addBuilding",
      cityName: this.name,
      building: buildingData,
    });

    // Update the city-stat line, and send it to the player
    const cityStats = this.getStatline();

    this.player.sendNetworkEvent({
      event: "updateCityStats",
      cityName: this.name,
      cityStats: cityStats,
    });
  }

  public getStatline() {
    const cityStats = [
      {
        population: this.population,
      },
      { science: 0 },
      { gold: 0 },
      { production: 0 },
      { faith: 0 },
      { culture: 0 },
      { food: 0 },
      { morale: 0 }, //TODO: Implement morale
      { foodSurplus: this.foodSurplus },
    ];

    // Add all buildings to existing stat-line dictionary
    for (const buildingData of this.buildings) {
      for (const stat of buildingData.stats) {
        const statType = Object.keys(stat)[0]; // Get the stat type, e.g., "science", "gold", etc.
        const statValue = stat[statType]; // Get the stat value

        for (const cityStat of cityStats) {
          if (Object.keys(cityStat)[0] === statType) {
            cityStat[statType] += statValue;
          }
        }
      }
    }

    return cityStats;
  }

  public getTile(): Tile {
    return this.tile;
  }

  public getPlayer(): Player {
    return this.player;
  }

  public getName() {
    return this.name;
  }
}
