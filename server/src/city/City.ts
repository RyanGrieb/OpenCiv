import { ServerEvents } from "../Events";
import { Game } from "../Game";
import { Player } from "../Player";
import { GameMap } from "../map/GameMap";
import { StatEntry, StatValues, Tile } from "../map/Tile";
import { Unit } from "../unit/Unit";
import { Building } from "./Building";

export interface CityStats extends StatValues {
  population: number;
  foodSurplus: number;
  defense: number;
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
  // Only meaningful once queued - tracked here (rather than a parallel
  // structure) so that reordering the queue (moveProductionQueueItem, which
  // swaps whole entries) carries progress along with it automatically.
  progress?: number;
}

// Hardcoded until research/tech gates what's buildable.
const PRODUCTION_OPTIONS: ProductionOption[] = [
  { type: "unit", name: "Warrior", cost: 30 },
  { type: "unit", name: "Scout", cost: 20 },
  { type: "building", name: "Monument", cost: 60 }
];

export class City {
  private tile: Tile;
  private player: Player;
  private name: string;
  private buildings: Building[];
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

        const buildingExists = (option: ProductionOption) =>
          this.buildings.some((b) => b.getName() === option.name);
        const buildingInQueue = (option: ProductionOption) =>
          this.productionQueue.some((q) => q.name === option.name);

        player.sendNetworkEvent({
          event: "updateProductionOptions",
          cityName: this.name,
          units: PRODUCTION_OPTIONS.filter((option) => option.type === "unit"),
          buildings: PRODUCTION_OPTIONS.filter((option) => option.type === "building").filter(
            (option) => !buildingExists(option)
          ).filter((option) => !buildingInQueue(option))
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

        this.productionQueue.push({ ...option, progress: 0 });
        this.sendStatUpdate(player);
      }
    });

    ServerEvents.on({
      eventName: "removeFromProductionQueue",
      parentObject: this,
      callback: (data, websocket) => {
        const player = Game.getInstance().getPlayerFromWebsocket(websocket);
        if (this.name != data["cityName"] || this.player != player) {
          return;
        }

        const index = data["index"];
        if (typeof index !== "number" || index < 0 || index >= this.productionQueue.length) return;

        this.productionQueue.splice(index, 1);
        this.sendStatUpdate(player);
      }
    });

    ServerEvents.on({
      eventName: "moveProductionQueueItem",
      parentObject: this,
      callback: (data, websocket) => {
        const player = Game.getInstance().getPlayerFromWebsocket(websocket);
        if (this.name != data["cityName"] || this.player != player) {
          return;
        }

        const index = data["index"];
        const targetIndex = data["direction"] === "up" ? index - 1 : index + 1;
        if (
          typeof index !== "number" ||
          index < 0 ||
          index >= this.productionQueue.length ||
          targetIndex < 0 ||
          targetIndex >= this.productionQueue.length
        ) {
          return;
        }

        [this.productionQueue[index], this.productionQueue[targetIndex]] = [
          this.productionQueue[targetIndex],
          this.productionQueue[index]
        ];
        this.sendStatUpdate(player);
      }
    });

    ServerEvents.on({
      eventName: "nextTurn",
      parentObject: this,
      callback: () => {
        this.applyProduction();
      }
    });
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
    const building = Building.createFromName(name);
    if (!building) return;

    this.buildings.push(building);

    // Send new-building packet to player
    this.player.sendNetworkEvent({
      event: "addBuilding",
      cityName: this.name,
      building: building.toJSON()
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
        { defense: 0 },
        { foodSurplus: this.foodSurplus }
      ];

      // Add all buildings to existing stat-line dictionary (Note: We would apply bonuses to buildings here in the future)
      for (const building of this.buildings) {
        for (const [statType, statValue] of Object.entries(building.getStatLine()) as [keyof CityStats, number][]) {
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
      foodSurplus: this.foodSurplus,
      defense: 0
    };

    // Add all buildings to existing stat-line dictionary
    for (const building of this.buildings) {
      for (const [statType, statValue] of Object.entries(building.getStatLine()) as [keyof CityStats, number][]) {
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

  private applyFoundingBonuses() {
    // The player's first city gets a starting palace.
    //FIXME: Some civilizations can replace the palace with a unique building.
    if (this.player.getCities().length < 2) {
      this.addBuilding("palace");
    }
  }

  private applyProduction() {
    if (this.productionQueue.length === 0) return;

    const current = this.productionQueue[0];
    const productionRate = this.getStatline({ asArray: false }).production;
    current.progress += productionRate;

    if (current.progress >= current.cost) {
      console.log(`[City ${this.name}] Finished producing ${current.name}`);
      this.productionQueue.shift();

      if (current.type === "building") {
        this.addBuilding(current.name);
      } else {
        const unit = Unit.createFromName(current.name, this.tile, this.player);
        if (unit) this.tile.addUnit(unit);
      }
    }

    this.sendStatUpdate(this.player);
  }
}
