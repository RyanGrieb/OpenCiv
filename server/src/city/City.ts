import { ServerEvents } from "../Events";
import { Game } from "../Game";
import { Player } from "../Player";
import { GameMap } from "../map/GameMap";
import { StatEntry, StatValues, Tile } from "../map/Tile";
import { Combat, CombatModifier } from "../unit/Combat";
import { Unit, UnitYMLTypeData } from "../unit/Unit";
import { BorderGrowth } from "./BorderGrowth";
import { Building } from "./Building";
import { CityCombat } from "./CityCombat";

export interface CityStats extends StatValues {
  population: number;
  foodSurplus: number;
  foodRequiredToGrow: number;
  cultureStored: number;
  cultureRequiredToExpand: number;
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

  // Civ 5's MIN_CITY_RANGE: no city may be founded within this many tiles of another, so there are
  // always at least two tiles between cities.
  public static readonly MIN_CITY_RANGE = 2;

  private tile: Tile;
  private player: Player;
  private name: string;
  private buildings: Building[];
  private population: number;
  private foodSurplus: number;
  // Culture banked toward the next border tile, and how many tiles culture has claimed so far
  // (which sets the cost of the next one - see BorderGrowth.getCultureCost()).
  private cultureStored: number;
  private tilesAcquired: number;
  // The tile the borders grow into next. Picked ahead of time, as in Civ 5, so the city screen can
  // show it and a random tie-break doesn't change the answer from turn to turn.
  private nextBorderTile: Tile | undefined;
  private territory: Tile[];
  private workedTiles: Tile[];
  private productionQueue: ProductionOption[];
  private health: number;
  // A city shoots at most once a turn, and not at all on the turn it changes hands.
  private strikeSpent: boolean;
  // What each player was last told about this city's health, strength and strike (see refreshCombatStatus()).
  private sentCombatStatus: Map<Player, string>;

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
    this.cultureStored = 0;
    this.tilesAcquired = 0;
    this.productionQueue = [];
    this.workedTiles = [];
    this.health = Math.min(CityCombat.BASE_MAX_HEALTH, Game.getInstance().getGameOptions().cityStartingHealth);
    this.strikeSpent = false;
    this.sentCombatStatus = new Map();

    // A new city claims the ring around it, except tiles another city already owns.
    this.territory = [this.tile];
    for (const adjTile of this.tile.getAdjacentTiles()) {
      if (!adjTile || adjTile.getCityTerritoryOf()) continue;

      this.territory.push(adjTile);
    }
    // So a tile reports this city (see Tile.getTileJSON()) whether it's the center or any of the
    // surrounding tiles - a player who's only scouted the edge of this territory still learns of
    // the city and its borders, without needing to have seen the center tile itself.
    for (const territoryTile of this.territory) {
      territoryTile.setCityTerritoryOf(this);
    }

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

    // The owner pressed the city's strike button: tell them which tiles it can reach.
    ServerEvents.on({
      eventName: "requestCityStrikeTargets",
      parentObject: this,
      callback: (data, websocket) => {
        const player = Game.getInstance().getPlayerFromWebsocket(websocket);
        if (this.name !== data["cityName"] || this.player !== player) return;

        this.sendStrikeTargets();
      }
    });

    ServerEvents.on({
      eventName: "requestCityStrikePreview",
      parentObject: this,
      callback: (data, websocket) => {
        const player = Game.getInstance().getPlayerFromWebsocket(websocket);
        if (this.name !== data["cityName"] || this.player !== player) return;

        const targetTile = GameMap.getInstance().getTiles()[data["targetX"]]?.[data["targetY"]];
        const preview = targetTile ? this.getStrikePreview(targetTile) : undefined;
        if (preview) player.sendNetworkEvent({ event: "combatPreview", ...preview });
      }
    });

    ServerEvents.on({
      eventName: "cityStrike",
      parentObject: this,
      callback: (data, websocket) => {
        const player = Game.getInstance().getPlayerFromWebsocket(websocket);
        if (this.name !== data["cityName"] || this.player !== player) return;

        const targetTile = GameMap.getInstance().getTiles()[data["targetX"]]?.[data["targetY"]];
        if (targetTile) this.strike(targetTile);
      }
    });

    ServerEvents.on({
      eventName: "nextTurn",
      parentObject: this,
      callback: () => {
        this.strikeSpent = false;
        this.heal();
        // Growth first, so a citizen gained this turn is already working a tile when
        // production is applied below.
        this.applyGrowth();
        this.applyBorderGrowth();
        this.applyProduction();
        this.sendStatUpdate(this.player);
      }
    });
  }

  /**
   * Whether a Settler may found a city here, by Civ 5's rules: on land, not inside another
   * civilization's borders, and more than MIN_CITY_RANGE tiles from every other city.
   */
  public static canFoundAt(tile: Tile, player: Player): boolean {
    if (tile.isWater() || tile.getCity()) return false;

    const owner = tile.getCityTerritoryOf()?.getPlayer();
    if (owner && owner !== player) return false;

    return !GameMap.getInstance()
      .getTilesInRange(tile, City.MIN_CITY_RANGE)
      .some((nearbyTile) => nearbyTile.getCity());
  }

  /**
   * Resends each city's health, strength and whether it can strike, to whoever should know and only
   * when it changed. Called after every client message and every turn, like PlayerNotifications -
   * between them, those cover everything that moves these numbers (a fight, a garrison walking in,
   * a citizen born, Walls finished, an enemy stepping into range).
   */
  public static refreshAllCombatStatus() {
    Game.getInstance()
      .getPlayers()
      .forEach((player) => player.getCities().forEach((city) => city.refreshCombatStatus()));
  }

  // A civilization that lost its capital gets a new Palace in its first remaining city.
  private static relocatePalace(player: Player) {
    const cities = player.getCities();
    if (cities.length < 1 || cities.some((city) => city.hasBuilding("Palace"))) return;

    cities[0].addBuilding("Palace");
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
        tiles: this.getWorkableTiles(),
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
        tiles: this.getWorkableTiles(),
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

  /**
   * Tells every player who has discovered any of this city's territory where its borders now run.
   * The owner always qualifies. Everyone else only hears about the tiles they've discovered, which
   * getJSON() filters for them.
   */
  public sendTerritoryUpdate() {
    Game.getInstance()
      .getPlayers()
      .forEach((player) => {
        if (!this.territory.some((tile) => player.getVisibility().hasDiscovered(tile))) return;

        player.sendNetworkEvent({
          event: "cityTerritoryUpdated",
          ...this.getJSON({ observer: player })
        });
      });
  }

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
    const nextBorderTile = this.getNextBorderTile();

    //FIXME: Append building data to stateUpdate
    player.sendNetworkEvent({
      event: "updateCityStats",
      cityName: this.name,
      cityStats: cityStats,
      workedTiles: this.workedTiles.map((tile) => ({ x: tile.getX(), y: tile.getY() })),
      productionQueue: this.productionQueue,
      nextBorderTile: nextBorderTile ? { x: nextBorderTile.getX(), y: nextBorderTile.getY() } : null
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
        { foodRequiredToGrow: this.getFoodRequiredToGrow() },
        { cultureStored: this.cultureStored },
        { cultureRequiredToExpand: this.getCultureRequiredToExpand() }
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
      cultureStored: this.cultureStored,
      cultureRequiredToExpand: this.getCultureRequiredToExpand(),
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

  public getHealth(): number {
    return this.health;
  }

  public getMaxHealth(): number {
    return this.buildings.reduce((total, building) => total + building.getCityHealth(), CityCombat.BASE_MAX_HEALTH);
  }

  public setHealth(health: number) {
    this.health = Math.max(0, Math.min(this.getMaxHealth(), health));
  }

  /** Strength before the percentage modifiers in getDefenseModifiers(). */
  public getBaseStrength(): number {
    const buildingDefense = this.getStatline({ asArray: false }).defense;
    const garrisonStrength = this.getGarrison()?.getCombatStrength() ?? 0;

    return (
      CityCombat.BASE_STRENGTH +
      this.population * CityCombat.STRENGTH_PER_POPULATION +
      buildingDefense +
      garrisonStrength * CityCombat.GARRISON_STRENGTH_SHARE
    );
  }

  // In place of the terrain bonuses a unit would get: a city on a hill is harder to take.
  public getDefenseModifiers(): CombatModifier[] {
    if (!this.tile.getTileTypes().some((type) => type.includes("hill"))) return [];

    return [{ label: "Hill", value: CityCombat.HILL_STRENGTH_BONUS }];
  }

  /** What the city defends and shoots with. */
  public getCombatStrength(): number {
    const modifierTotal = this.getDefenseModifiers().reduce((total, modifier) => total + modifier.value, 0);
    return this.getBaseStrength() * (1 + modifierTotal);
  }

  // The owner's military unit standing in the city, if any.
  public getGarrison(): Unit | undefined {
    return this.tile.getUnits().find((unit) => unit.getPlayer() === this.player && unit.canFight());
  }

  // Every tile within reach of the city's strike. Cities fire indirectly, so there's no line of sight check.
  public getStrikeRangeTiles(): Tile[] {
    return GameMap.getInstance()
      .getTilesInRange(this.tile, CityCombat.STRIKE_RANGE)
      .filter((tile) => tile !== this.tile);
  }

  // Like a ranged unit, a city only shoots enemies that can fight back, and only ones its owner can see.
  public canStrikeAt(tile: Tile): boolean {
    if (this.strikeSpent || !this.getStrikeTarget(tile)) return false;
    if (!this.player.getVisibility().isVisible(tile)) return false;

    return this.getStrikeRangeTiles().includes(tile);
  }

  public canStrike(): boolean {
    if (this.strikeSpent) return false;

    return this.getStrikeRangeTiles().some((tile) => this.canStrikeAt(tile));
  }

  /**
   * The city's ranged strike: the target takes damage from the city's strength against its own
   * (terrain included), and nothing comes back. A kill removes the target. Returns whether it fired.
   */
  public strike(targetTile: Tile): boolean {
    if (!this.canStrikeAt(targetTile)) return false;

    const defender = this.getStrikeTarget(targetTile);
    this.strikeSpent = true;

    const result = Combat.resolveRanged({
      attackerStrength: this.getCombatStrength(),
      attackerHealth: Combat.MAX_HEALTH,
      defenderStrength: Combat.getDefenseStrength(defender.getCombatStrength(), targetTile),
      defenderHealth: defender.getHealth()
    });
    defender.setHealth(result.defenderHealth);

    const combatPacket = {
      event: "unitCombat",
      attackerCity: this.name,
      defenderId: defender.getId(),
      defenderHealth: defender.getHealth(),
      ranged: true
    };
    Game.getInstance()
      .getPlayers()
      .forEach((player) => {
        const visibility = player.getVisibility();
        if (!visibility.isVisible(this.tile) && !visibility.isVisible(targetTile)) return;

        player.sendNetworkEvent(combatPacket);
      });

    if (defender.getHealth() <= 0) defender.delete();
    return true;
  }

  public getStrikePreview(targetTile: Tile) {
    if (!this.canStrikeAt(targetTile)) return undefined;

    const defender = this.getStrikeTarget(targetTile);

    return {
      attackerCity: this.name,
      targetX: targetTile.getX(),
      targetY: targetTile.getY(),
      ranged: true,
      defenderId: defender.getId(),
      defenderName: defender.getName(),
      attackerHealth: this.health,
      attackerMaxHealth: this.getMaxHealth(),
      defenderHealth: defender.getHealth(),
      ...Combat.predictRanged({
        attackerRangedStrength: this.getCombatStrength(),
        attackerHealth: Combat.MAX_HEALTH,
        defenderBaseStrength: defender.getCombatStrength(),
        defenderHealth: defender.getHealth(),
        targetTile
      })
    };
  }

  // The tiles the owner's client tints while aiming the strike.
  public sendStrikeTargets() {
    this.player.sendNetworkEvent({
      event: "cityStrikeTargets",
      cityName: this.name,
      tiles: this.getStrikeRangeTiles().map((tile) => ({ x: tile.getX(), y: tile.getY() }))
    });
  }

  /**
   * Hands the city to the civilization whose melee unit took it, as in Civ 5: it loses half its
   * citizens, its Palace and whatever it was building, and can't strike until next turn. It keeps its
   * name, its other buildings and its damage. The previous owner's Palace moves to another of their
   * cities, if they have one.
   */
  public captureBy(newOwner: Player) {
    const previousOwner = this.player;

    previousOwner.removeCity(this);
    newOwner.getCities().push(this);
    this.player = newOwner;

    this.population = Math.max(1, Math.floor(this.population * (1 - CityCombat.CAPTURE_POPULATION_LOSS)));
    this.foodSurplus = 0;
    this.productionQueue = [];
    this.strikeSpent = true;
    this.buildings = this.buildings.filter((building) => building.getName() !== "Palace");
    this.setHealth(this.health);
    this.updateWorkedTiles({ sendStatUpdate: false });

    City.relocatePalace(previousOwner);

    previousOwner.getVisibility().update();
    newOwner.getVisibility().update();
    this.sendCaptured();
    // The new owner's client only knows of buildings finished while it owned the city.
    this.buildings.forEach((building) =>
      newOwner.sendNetworkEvent({ event: "addBuilding", cityName: this.name, building: building.toJSON() })
    );
    this.sendStatUpdate(newOwner);
    previousOwner.sendTotalStatsUpdate();

    // The borders changing hands changes what either side's Builders can build there.
    [previousOwner, newOwner].forEach((player) => player.getUnits().forEach((unit) => unit.sendActionsToOwner()));

    previousOwner
      .getNotifications()
      .addMessage("ICON_DEFENSE", `${this.name} has been captured by ${newOwner.getName()}!`);
    newOwner.getNotifications().addMessage("ICON_ACCEPT", `You have captured ${this.name}!`);
  }

  /**
   * Drops queued units the player's latest tech made obsolete, like Civ 5 does. Called once a tech is
   * researched; any progress on a dropped unit is lost.
   */
  public removeObsoleteUnitsFromQueue() {
    const obsolete = this.productionQueue.filter((item) => item.type === "unit" && this.isObsoleteUnit(item.name));
    if (obsolete.length === 0) return;

    this.productionQueue = this.productionQueue.filter((item) => !obsolete.includes(item));
    obsolete.forEach((item) =>
      this.player.getNotifications().addMessage("ICON_PRODUCTION", `${this.name} can no longer build ${item.name}.`)
    );
    this.sendStatUpdate(this.player);
  }

  public getFoodRequiredToGrow(): number {
    return City.GROWTH_FOOD_BASE + City.GROWTH_FOOD_PER_POP * this.population;
  }

  public getCultureRequiredToExpand(): number {
    return BorderGrowth.getCultureCost(this.tilesAcquired);
  }

  public getTile(): Tile {
    return this.tile;
  }

  public getTerritory(): Tile[] {
    return this.territory;
  }

  // Picks a new target once the current one is gone, e.g. claimed by this city or a neighbor.
  public getNextBorderTile(): Tile | undefined {
    if (!this.nextBorderTile || this.nextBorderTile.getCityTerritoryOf()) {
      this.nextBorderTile = BorderGrowth.chooseNextTile(this.tile, this.territory);
    }
    return this.nextBorderTile;
  }

  public isCoastal(): boolean {
    return this.tile.isCoastal();
  }

  public getPlayer(): Player {
    return this.player;
  }

  public getProductionQueue(): ProductionOption[] {
    return this.productionQueue;
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
      health: this.health,
      maxHealth: this.getMaxHealth(),
      strength: this.getCombatStrength(),
      // Which tiles a city works is its owner's business.
      workedTiles: ownCity ? this.workedTiles.map((tile) => ({ x: tile.getX(), y: tile.getY() })) : []
    };
  }

  private hasBuilding(name: string): boolean {
    return this.buildings.some((building) => building.getName() === name);
  }

  private getStrikeTarget(tile: Tile): Unit | undefined {
    return tile.getUnits().find((unit) => unit.getPlayer() !== this.player && unit.canFight());
  }

  private heal() {
    if (this.health >= this.getMaxHealth()) return;

    this.setHealth(this.health + CityCombat.HEAL_PER_TURN);
  }

  // Health and strength go to everyone who can see the city (its banner shows them); whether it can
  // strike only goes to the owner.
  private refreshCombatStatus() {
    Game.getInstance()
      .getPlayers()
      .forEach((player) => {
        if (!player.getVisibility().isVisible(this.tile)) return;

        const status = {
          event: "cityCombatStatus",
          cityName: this.name,
          health: this.health,
          maxHealth: this.getMaxHealth(),
          strength: this.getCombatStrength(),
          canStrike: player === this.player && this.canStrike()
        };
        const json = JSON.stringify(status);
        if (this.sentCombatStatus.get(player) === json) return;

        this.sentCombatStatus.set(player, json);
        player.sendNetworkEvent(status);
      });
  }

  // Everyone who knows of any of this city's territory redraws it in its new owner's colors.
  private sendCaptured() {
    this.sentCombatStatus.clear();

    Game.getInstance()
      .getPlayers()
      .forEach((player) => {
        if (!this.territory.some((tile) => player.getVisibility().hasDiscovered(tile))) return;

        player.sendNetworkEvent({ event: "cityCaptured", ...this.getJSON({ observer: player }) });
      });
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
  // present, gates an option until the player has researched it; obsolete_tech hides a unit again
  // once its replacement's tech is in.
  private getProductionOptions(): { units: ProductionOption[]; buildings: ProductionOption[] } {
    const isUnlocked = (requiredTech?: string) => !requiredTech || this.player.hasResearchedTech(requiredTech);

    // Ships need a coast to be launched from.
    const canLaunch = (unit: UnitYMLTypeData) => unit.domain !== "sea" || this.isCoastal();

    const units: ProductionOption[] = Unit.getAllUnitData()
      .filter(
        (unit) =>
          typeof unit.cost === "number" &&
          isUnlocked(unit.required_tech) &&
          !this.isObsoleteUnit(unit.name) &&
          canLaunch(unit)
      )
      .map((unit) => ({ type: "unit", name: unit.name, cost: unit.cost }));

    const buildingExists = (name: string) => this.hasBuilding(name);
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

  private isObsoleteUnit(unitName: string): boolean {
    const obsoleteTech = Unit.getAllUnitData().find((unit) => unit.name === unitName)?.obsolete_tech;
    return obsoleteTech !== undefined && this.player.hasResearchedTech(obsoleteTech);
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

  // Banks this turn's culture, and claims a new tile once the bank covers the next one's cost. As in
  // Civ 5 that's at most one tile a turn, and the leftover culture carries over. A city with nothing
  // left to claim keeps banking.
  private applyBorderGrowth() {
    this.cultureStored += this.getStatline({ asArray: false }).culture;

    const cost = this.getCultureRequiredToExpand();
    if (this.cultureStored < cost) return;

    const tile = this.getNextBorderTile();
    if (!tile) return;

    this.cultureStored -= cost;
    this.tilesAcquired++;
    this.claimTile(tile);
  }

  private claimTile(tile: Tile) {
    this.territory.push(tile);
    tile.setCityTerritoryOf(this);
    console.log(`[City ${this.name}] Borders grew to ${tile.getX()},${tile.getY()}`);

    // Owned land is in sight, so the owner's client gets the new tile before the border update needs it.
    this.player.getVisibility().update();
    this.sendTerritoryUpdate();
    this.updateWorkedTiles({ sendStatUpdate: false });
    // A Settler standing here, of any civilization, may no longer be able to settle.
    tile.getUnits().forEach((unit) => unit.sendActionsToOwner());
  }

  // The part of the territory citizens can work: borders reach 5 rings out, citizens only 3.
  private getWorkableTiles(): Tile[] {
    const rings = BorderGrowth.getRingDistances(this.tile, BorderGrowth.MAX_WORK_DISTANCE);
    return this.territory.filter((tile) => rings.has(tile));
  }

  private applyProduction() {
    if (this.productionQueue.length === 0) return;

    const current = this.productionQueue[0];
    const productionRate = this.getStatline({ asArray: false }).production;
    current.progress += productionRate;

    if (current.progress < current.cost) return;

    if (current.type === "building") {
      console.log(`[City ${this.name}] Finished producing ${current.name}`);
      this.productionQueue.shift();
      this.addBuilding(current.name);
      this.announceFinished(current.name);
      return;
    }

    // Every tile around the city already holds a unit of this type: the finished unit waits at the
    // front of the queue, and appears once one of them moves off.
    const spawnTile = this.getUnitSpawnTile(current.name);
    if (!spawnTile) return;

    console.log(`[City ${this.name}] Finished producing ${current.name}`);
    this.productionQueue.shift();

    const unit = Unit.createFromName(current.name, spawnTile, this.player);
    if (unit) spawnTile.addUnit(unit);
    this.announceFinished(current.name);
  }

  private announceFinished(itemName: string) {
    this.player.getNotifications().addMessage("ICON_PRODUCTION", `${this.name} has finished ${itemName}.`);
  }

  // The city's own tile if the new unit can stack there, else the first free neighbor it could move
  // onto: land for land units, water for ships.
  private getUnitSpawnTile(unitName: string): Tile | undefined {
    const unitData = Unit.getAllUnitData().find((data) => data.name.toLowerCase() === unitName.toLowerCase());
    const isUtility = unitData?.is_utility ?? false;

    const canStandOn = (tile: Tile) => {
      if (unitData?.domain === "sea") return Unit.canSailOnto(tile, unitData.coast_only ?? false);
      return !tile.isWater() && tile.getMovementCost() < 9999;
    };
    const candidates = [this.tile, ...this.tile.getAdjacentTiles().filter((tile) => tile && canStandOn(tile))];

    return candidates.find((tile) => tile.canPlaceUnit(this.player, isUtility));
  }
}
