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
  foodRequiredToGrow: number;
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

export class City {
  // Minimum food surplus the "default" tile focus tries to bank once population upkeep
  // is covered, so cities trend toward growth instead of merely breaking even. Adjust to
  // tune how aggressively default-focus cities prioritize growth over other yields.
  public static readonly DEFAULT_FOCUS_GROWTH_TARGET = 1;

  // Food a city must bank to add a citizen, as BASE + PER_POP * population - the cost
  // climbs with size so large cities grow slower. Adjust to tune the growth curve.
  public static readonly GROWTH_FOOD_BASE = 15;
  public static readonly GROWTH_FOOD_PER_POP = 8;

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
    this.workedTiles = [];

    this.territory = [this.tile];
    for (const adjTile of this.tile.getAdjacentTiles()) {
      if (!adjTile) continue;

      this.territory.push(adjTile);
    }
    // So a tile reports this city (see Tile.getTileJSON()) whether it's the center or any of the
    // surrounding tiles - a player who's only scouted the edge of this territory still learns of
    // the city and its borders, without needing to have seen the center tile itself.
    for (const territoryTile of this.territory) {
      territoryTile.setCityTerritoryOf(this);
    }
    this.sendTerritoryUpdate();

    // Must happen before updateWorkedTiles() below (and after the fields above -
    // setCity() broadcasts this tile, which serializes this city via getJSON()) so
    // Tile.getStats() can apply the city-center food bonus once it computes yields.
    this.tile.setCity(this);

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

        const { units, buildings } = this.getProductionOptions();
        player.sendNetworkEvent({
          event: "updateProductionOptions",
          cityName: this.name,
          units,
          buildings
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

        // Look up the real option server-side rather than trusting the client's cost -
        // this also re-checks tech-gating, so a stale/forged request can't queue
        // something the player hasn't researched.
        const { units, buildings } = this.getProductionOptions();
        const option = [...units, ...buildings].find(
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
        // Growth first, so a citizen gained this turn is already working a tile when
        // production is applied below.
        this.applyGrowth();
        this.applyProduction();
        this.sendStatUpdate(this.player);
      }
    });
  }

  public updateWorkedTiles(options?: { sendStatUpdate: boolean }) {
    // Reset worked tiles
    this.workedTiles = [this.tile];

    //TODO: Change default with whatever value the player has set for the city.
    const tileFocus = "default";
    const foodFloor = tileFocus === "default" ? City.DEFAULT_FOCUS_GROWTH_TARGET : 0;

    let assigned = 0;

    // Phase 1: regardless of focus, cover the food floor first so a city never starves
    // (or, under default focus, fails to grow) chasing a better non-food tile when a food
    // tile was available instead.
    let currentFood = this.getStatline({ asArray: false }).food;
    while (assigned < this.population && currentFood < foodFloor) {
      const tile = GameMap.getInstance().getTileWithHighestYeild({
        stats: ["food"],
        tiles: this.territory,
        ignoreTiles: this.workedTiles
      });

      if (!tile) break;

      this.workedTiles.push(tile);
      assigned++;

      const updatedFood = this.getStatline({ asArray: false }).food;
      if (updatedFood <= currentFood) {
        // This tile didn't actually improve food (none of the remaining tiles do) -
        // undo it and let phase 2 use the citizen on the best overall yield instead.
        this.workedTiles.pop();
        assigned--;
        break;
      }

      currentFood = updatedFood;
    }

    // Phase 2: whatever population remains chases the best overall yield.
    while (assigned < this.population) {
      const tile = GameMap.getInstance().getTileWithHighestYeild({
        stats: [tileFocus],
        tiles: this.territory,
        ignoreTiles: this.workedTiles
      });

      if (!tile) break;

      this.workedTiles.push(tile);
      assigned++;
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
    // Founding a city is a new source of sight, so refresh the owner's fog first - otherwise the
    // "newCity" packet below can outrun the tiles the city reveals.
    this.player.getVisibility().update();

    Game.getInstance()
      .getPlayers()
      .forEach((player) => {
        // Another civ only learns of this city if they can see where it was founded. Otherwise they
        // meet it when they first scout the tile, which carries the city in its tile data.
        if (!player.getVisibility().isVisible(this.tile)) return;

        player.sendNetworkEvent({
          event: "newCity",
          ...this.getJSON({ observer: player })
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
        { foodSurplus: this.foodSurplus },
        { foodRequiredToGrow: this.getFoodRequiredToGrow() }
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
      foodRequiredToGrow: this.getFoodRequiredToGrow(),
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

  public getFoodRequiredToGrow(): number {
    return City.GROWTH_FOOD_BASE + City.GROWTH_FOOD_PER_POP * this.population;
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

  // An observer is only told about the parts of this city's territory they've actually discovered -
  // their client has no tile to hang the border on otherwise.
  public getJSON(options?: { observer?: Player }) {
    const ownCity = !options?.observer || options.observer === this.player;
    const visibleTerritory = options?.observer
      ? this.territory.filter((tile) => options.observer.getVisibility().hasDiscovered(tile))
      : this.territory;

    const territoryCoords = visibleTerritory.map((tile) => ({
      tileX: tile.getX(),
      tileY: tile.getY()
    }));

    return {
      cityName: this.name,
      player: this.player.getName(),
      tileX: this.tile.getX(),
      tileY: this.tile.getY(),
      territory: territoryCoords,
      // Which tiles a city works is its owner's business.
      workedTiles: ownCity ? this.workedTiles.map((tile) => ({ x: tile.getX(), y: tile.getY() })) : []
    };
  }

  private applyFoundingBonuses() {
    // The player's first city gets a starting palace.
    //FIXME: Some civilizations can replace the palace with a unique building.
    if (this.player.getCities().length < 2) {
      this.addBuilding("palace");
    }
  }

  // Units/buildings with no `cost` (e.g. Settler, Palace) are never offered here -
  // they're granted directly elsewhere rather than queued. required_tech, when
  // present, gates an option until the player has researched it.
  private getProductionOptions(): { units: ProductionOption[]; buildings: ProductionOption[] } {
    const isUnlocked = (requiredTech?: string) => !requiredTech || this.player.hasResearchedTech(requiredTech);

    const units: ProductionOption[] = Unit.getAllUnitData()
      .filter((unit) => typeof unit.cost === "number" && isUnlocked(unit.required_tech))
      .map((unit) => ({ type: "unit", name: unit.name, cost: unit.cost }));

    const buildingExists = (name: string) => this.buildings.some((b) => b.getName() === name);
    const buildingInQueue = (name: string) => this.productionQueue.some((q) => q.name === name);

    const buildings: ProductionOption[] = Building.getAllBuildings()
      .filter(
        (building) =>
          typeof building.getCost() === "number" &&
          isUnlocked(building.getRequiredTech()) &&
          !buildingExists(building.getName()) &&
          !buildingInQueue(building.getName())
      )
      .map((building) => ({ type: "building", name: building.getName(), cost: building.getCost() }));

    return { units, buildings };
  }

  // Banks this turn's net food, then grows the city once the bank covers the growth
  // cost, or starves a citizen off if the bank runs dry. Growth keeps the leftover food
  // rather than resetting the bank, so a big surplus carries into the next citizen.
  private applyGrowth() {
    this.foodSurplus += this.getStatline({ asArray: false }).food;

    if (this.foodSurplus < 0) {
      // A size-1 city can't shrink any further - it just sits empty-banked until its
      // food recovers.
      if (this.population > 1) {
        this.population--;
        console.log(`[City ${this.name}] Starved down to population ${this.population}`);
        this.updateWorkedTiles({ sendStatUpdate: false });
      }

      this.foodSurplus = 0;
      return;
    }

    const requiredFood = this.getFoodRequiredToGrow();
    if (this.foodSurplus >= requiredFood) {
      this.foodSurplus -= requiredFood;
      this.population++;
      console.log(`[City ${this.name}] Grew to population ${this.population}`);
      this.updateWorkedTiles({ sendStatUpdate: false });
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
  }
}
