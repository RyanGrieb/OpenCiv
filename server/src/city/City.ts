import fs from "fs";
import YAML from "yaml";
import { ServerEvents } from "../Events";
import { Game } from "../Game";
import { Player } from "../Player";
import { GameMap } from "../map/GameMap";
import { StatEntry, StatValues, Tile } from "../map/Tile";

export interface CityStats extends StatValues {
  population: number;
  foodSurplus: number;
}
type CityStatEntry = Partial<CityStats>;

export interface CityOptions {
  tile: Tile;
  player: Player;
}

export interface ProductionOption {
  type: "unit" | "building";
  name: string;
  cost: number;
}

// Hardcoded until research/tech gates what's buildable.
const PRODUCTION_OPTIONS: ProductionOption[] = [
  { type: "unit", name: "Warrior", cost: 30 },
  { type: "unit", name: "Scout", cost: 20 },
  { type: "building", name: "Monument", cost: 60 }
];

export class City {
  private static cityBuildings: Record<string, any>[];

  private tile: Tile;
  private player: Player;
  private name: string;
  private buildings: Record<string, any>[];
  private population: number;
  private foodSurplus: number;
  private territory: Tile[];
  private workedTiles: Tile[];
  private productionQueue: ProductionOption[];

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
    this.productionQueue = [];

    this.territory = [this.tile];
    for (const adjTile of this.tile.getAdjacentTiles()) {
      if (!adjTile) continue;

      this.territory.push(adjTile);
    }
    this.sendTerritoryUpdate();

    this.updateWorkedTiles({ sendStatUpdate: true });

    ServerEvents.on({
      eventName: "requestCityStats",
      parentObject: this,
      callback: (data, websocket) => {
        const player = Game.getInstance().getPlayerFromWebsocket(websocket);
        if (this.name != data["cityName"] || this.player != player) {
          return;
        }

        this.sendStatUpdate(player);
      }
    });

    ServerEvents.on({
      eventName: "requestProductionOptions",
      parentObject: this,
      callback: (data, websocket) => {
        const player = Game.getInstance().getPlayerFromWebsocket(websocket);
        if (this.name != data["cityName"] || this.player != player) {
          return;
        }

        player.sendNetworkEvent({
          event: "updateProductionOptions",
          cityName: this.name,
          units: PRODUCTION_OPTIONS.filter((option) => option.type === "unit"),
          buildings: PRODUCTION_OPTIONS.filter((option) => option.type === "building")
        });
      }
    });

    ServerEvents.on({
      eventName: "addToProductionQueue",
      parentObject: this,
      callback: (data, websocket) => {
        const player = Game.getInstance().getPlayerFromWebsocket(websocket);
        if (this.name != data["cityName"] || this.player != player) {
          return;
        }

        // Look up the real option server-side rather than trusting the client's cost.
        const option = PRODUCTION_OPTIONS.find(
          (option) => option.type === data["type"] && option.name === data["name"]
        );
        if (!option) return;

        this.productionQueue.push(option);
        this.sendStatUpdate(player);
      }
    });
  }

  public static getBuildingDataByName(name: string): Record<string, any> {
    if (!City.cityBuildings) {
      const buildingsYMLData = YAML.parse(fs.readFileSync("./config/buildings.yml", "utf-8"));
      City.cityBuildings = JSON.parse(JSON.stringify(buildingsYMLData.buildings));
    }

    for (const building of City.cityBuildings) {
      if ((building.name as string).toLocaleLowerCase() === name.toLocaleLowerCase()) {
        return building;
      }
    }

    return undefined;
  }

  public updateWorkedTiles(options?: { sendStatUpdate: boolean }) {
    // Reset worked tiles
    this.workedTiles = [this.tile];

    // For default focus, find all tiles and get the best tile with the highest yield
    // Note, if our food stat from the current worked tiles is negative, find the tiles with the highest food yeild.
    // If our food stat is positive, find the tiles with the highest total yeild.
    for (let i = 0; i < this.population; i++) {
      const statline = this.getStatline({ asArray: false });
      //TODO: Change default with whatever value the player has set for the city.
      const tileFocus = statline["food"] < 0 ? "food" : "default";
      // Get a tile with the highest food yeild
      const tile = GameMap.getInstance().getTileWithHighestYeild({
        stats: [tileFocus],
        tiles: this.territory,
        ignoreTiles: this.workedTiles
      });

      this.workedTiles.push(tile);
    }

    if (options.sendStatUpdate) {
      this.sendStatUpdate(this.player);
    }
  }

  public addBuilding(name: string) {
    // Get the building data from YML
    const buildingData = City.getBuildingDataByName(name);

    // Apply any effects to the building if any (faith, culture, bonuses, etc.)):
    //...

    this.buildings.push(buildingData);

    //FIXME: Just append building data to stateUpdate
    // Send new-building packet to player
    this.player.sendNetworkEvent({
      event: "addBuilding",
      cityName: this.name,
      building: buildingData
    });

    this.updateWorkedTiles({ sendStatUpdate: true });
  }

  public sendTerritoryUpdate() { }

  /**
   * Tells all players this city now exists, then applies whatever founding-time
   * logic follows from that (e.g. granting a starting palace). Must broadcast
   * "newCity" before applying any bonus that itself sends a network event (like
   * addBuilding) - clients only start listening for a city's events once they've
   * processed its "newCity" packet and constructed it locally.
   */
  public announceCreated() {
    Game.getInstance()
      .getPlayers()
      .forEach((player) => {
        player.sendNetworkEvent({
          event: "newCity",
          ...this.getJSON()
        });
      });

    this.applyFoundingBonuses();
  }

  private applyFoundingBonuses() {
    // The player's first city gets a starting palace.
    //FIXME: Some civilizations can replace the palace with a unique building.
    if (this.player.getCities().length < 2) {
      this.addBuilding("palace");
    }
  }

  /*
  Get the city-stat line, and send it to the player
*/
  public sendStatUpdate(player: Player) {
    const cityStats = this.getStatline({ asArray: true });

    //FIXME: Append building data to stateUpdate
    player.sendNetworkEvent({
      event: "updateCityStats",
      cityName: this.name,
      cityStats: cityStats,
      workedTiles: this.workedTiles.map((tile) => ({ x: tile.getX(), y: tile.getY() })),
      productionQueue: this.productionQueue
    });

    player.sendTotalStatsUpdate();
  }

  public getStatline(options: { asArray: true }): CityStatEntry[];
  public getStatline(options: { asArray: false }): CityStats;
  public getStatline(options: { asArray: boolean }): CityStatEntry[] | CityStats {
    if (options.asArray) {
      const cityStats: CityStatEntry[] = [
        {
          population: this.population
        },
        { science: 0 },
        { gold: 0 },
        { production: 0 },
        { faith: 0 },
        { culture: 0 },
        { food: -(this.population * 2) },
        { morale: 0 }, //TODO: Implement morale
        { foodSurplus: this.foodSurplus }
      ];

      // Add all buildings to existing stat-line dictionary
      for (const buildingData of this.buildings) {
        for (const stat of buildingData.stats) {
          const statType = Object.keys(stat)[0] as keyof CityStats; // Get the stat type, e.g., "science", "gold", etc.
          const statValue = stat[statType]; // Get the stat value

          for (const cityStat of cityStats) {
            if (Object.keys(cityStat)[0] === statType) {
              cityStat[statType] += statValue;
            }
          }
        }
      }


      // Add all worked tiles to existing stat-line dictionary
      console.log(`[City ${this.name}] Updating stats (asArray). Worked tiles: ${this.workedTiles.length}`);
      for (const tile of this.workedTiles) {
        console.log(`[City ${this.name}] Working tile at ${tile.getX()},${tile.getY()}`);
        for (const stat of tile.getStats()) {
          const statType = Object.keys(stat)[0] as keyof StatValues; // Get the stat type, e.g., "science", "gold", etc.
          const statValue = stat[statType]; // Get the stat value

          if (statValue !== 0) {
            console.log(`[City ${this.name}] Tile yields ${statType}: ${statValue}`);
          }

          for (const cityStat of cityStats) {
            if (Object.keys(cityStat)[0] === statType) {
              cityStat[statType] += statValue;
            }
          }
        }
      }

      return cityStats;
    }

    // If we're not returning an array, return a dictionary
    const cityStats: CityStats = {
      population: this.population,
      science: 0,
      gold: 0,
      production: 0,
      faith: 0,
      culture: 0,
      food: -(this.population * 2),
      morale: 0, //TODO: Implement morale
      foodSurplus: this.foodSurplus
    };

    // Add all buildings to existing stat-line dictionary
    for (const buildingData of this.buildings) {
      for (const stat of buildingData.stats) {
        const statType = Object.keys(stat)[0] as keyof CityStats; // Get the stat type, e.g., "science", "gold", etc.
        const statValue = stat[statType]; // Get the stat value

        if (cityStats.hasOwnProperty(statType)) {
          cityStats[statType] += statValue;
        }
      }
    }

    // Add all worked tiles to existing stat-line dictionary
    for (const tile of this.workedTiles) {
      for (const stat of tile.getStats()) {
        const statType = Object.keys(stat)[0] as keyof StatValues; // Get the stat type, e.g., "science", "gold", etc.
        const statValue = stat[statType]; // Get the stat value

        if (cityStats.hasOwnProperty(statType)) {
          cityStats[statType] += statValue;
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

  public getJSON() {
    const territoryCoords = this.territory.map((tile) => ({
      tileX: tile.getX(),
      tileY: tile.getY()
    }));

    return {
      cityName: this.name,
      player: this.player.getName(),
      tileX: this.tile.getX(),
      tileY: this.tile.getY(),
      territory: territoryCoords,
      workedTiles: this.workedTiles.map((tile) => ({ x: tile.getX(), y: tile.getY() }))
    };
  }
}
