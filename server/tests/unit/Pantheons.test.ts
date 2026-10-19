import { City } from "../../src/city/City";
import { ServerEvents } from "../../src/Events";
import { Game } from "../../src/Game";
import { GameMap } from "../../src/map/GameMap";
import { Tile } from "../../src/map/Tile";
import { Player } from "../../src/Player";
import { Beliefs } from "../../src/religion/Beliefs";
import { CityReligion } from "../../src/religion/CityReligion";
import { Pantheons } from "../../src/religion/Pantheons";
import { PlayerReligion } from "../../src/religion/PlayerReligion";

// Real pantheons.yml throughout, with as much of a player and city as the effects look at.
describe("Pantheons", () => {
  let players: Map<string, Player>;

  const playerWith = (options: { pantheon?: string; faith?: number; techs?: string[] } = {}) => {
    const accumulated: Record<string, number> = { faith: options.faith ?? 0 };
    const player = {
      ownCities: [] as City[],
      accumulated,
      messages: [] as string[],
      getName: () => `player${players.size}`,
      getCivilizationName: () => `Civ${players.size}`,
      getCities: () => player.ownCities,
      getUnits: (): unknown[] => [],
      hasResearchedTech: (tech: string) => (options.techs ?? []).includes(tech),
      isBarbarian: () => false,
      hasClient: () => true,
      getAccumulatedStats: () => accumulated,
      addToAccumulatedStat: (stat: string, amount: number) => (accumulated[stat] = (accumulated[stat] ?? 0) + amount),
      getNotifications: () => ({ addMessage: (icon: string, text: string) => player.messages.push(text) }),
      sendTotalStatsUpdate: jest.fn(),
      sendNetworkEvent: jest.fn(),
      getWebsocket: (): undefined => undefined
    } as unknown as Player & { ownCities: City[]; accumulated: Record<string, number>; messages: string[] };
    const religion = new PlayerReligion(player);
    (player as unknown as Record<string, unknown>).getReligion = () => religion;
    if (options.pantheon) religion["pantheonName"] = options.pantheon;
    players.set(player.getName(), player);
    return player;
  };

  const cityOf = (
    player: Player & { ownCities: City[] },
    options: { buildings?: string[]; population?: number } = {}
  ) => {
    const cityTile = new Tile("grass", 5, 5);
    const workedTiles: Tile[] = [];
    const city = {
      getPlayer: () => player,
      getPopulation: () => options.population ?? 1,
      hasBuilding: (name: string) => (options.buildings ?? []).includes(name),
      getBuildings: (): unknown[] => [],
      getTile: () => cityTile,
      getTerritory: (): Tile[] => [],
      getWorkedTiles: () => workedTiles,
      updateWorkedTiles: jest.fn()
    } as unknown as City;
    const religion = new CityReligion(city, options.population ?? 1);
    (city as unknown as Record<string, unknown>).getReligion = () => religion;
    player.ownCities.push(city);
    return city;
  };

  const ownedTile = (city: City, ...tileTypes: string[]) => {
    const tile = new Tile(tileTypes[0], 0, 0);
    tileTypes.slice(1).forEach((type) => tile.addTileType(type));
    tile.setCityTerritoryOf(city);
    return tile;
  };

  const bonusesOn = (tile: Tile) =>
    Object.assign({}, ...Beliefs.getTileBonusSources(tile).flatMap((source) => source.stats));

  beforeEach(() => {
    players = new Map();
    jest.spyOn(ServerEvents, "on").mockImplementation(() => {});
    jest.spyOn(Game, "getInstance").mockReturnValue({ getPlayers: () => players } as unknown as Game);
    jest.spyOn(GameMap, "getInstance").mockReturnValue({ sendTilesToPlayer: jest.fn() } as unknown as GameMap);
  });

  afterEach(() => jest.restoreAllMocks());

  it("lists all 26 pantheons", () => {
    expect(Pantheons.getAll()).toHaveLength(26);
  });

  describe("founding", () => {
    it("costs 10 Faith for the first pantheon and 5 more for each one founded", () => {
      playerWith();
      expect(Pantheons.getCost()).toBe(10);

      playerWith({ pantheon: "Fertility Rites" });
      playerWith({ pantheon: "Sacred Path" });
      expect(Pantheons.getCost()).toBe(20);
    });

    it("needs the faith for it", () => {
      expect(playerWith({ faith: 9 }).getReligion().canFoundPantheon()).toBe(false);
      expect(playerWith({ faith: 10 }).getReligion().canFoundPantheon()).toBe(true);
    });

    it("spends the faith, keeps the leftover, and tells everyone", () => {
      const other = playerWith();
      const player = playerWith({ faith: 14 });

      expect(player.getReligion().foundPantheon("Desert Folklore")).toBe(true);

      expect(player.getReligion().getPantheonName()).toBe("Desert Folklore");
      expect(player.accumulated.faith).toBe(4);
      expect(player.messages).toContain("You have founded a pantheon: Desert Folklore.");
      expect(other.messages.some((text) => text.includes("Desert Folklore"))).toBe(true);
    });

    it("lets only one civilization found each pantheon, and only one pantheon per civilization", () => {
      playerWith({ pantheon: "God of War" });
      const player = playerWith({ faith: 100 });

      expect(player.getReligion().foundPantheon("God of War")).toBe(false);
      expect(Pantheons.getAvailable().map((pantheon) => pantheon.name)).not.toContain("God of War");

      expect(player.getReligion().foundPantheon("Sacred Path")).toBe(true);
      expect(player.getReligion().foundPantheon("Stone Circles")).toBe(false);
      expect(player.getReligion().canFoundPantheon()).toBe(false);
    });
  });

  describe("tile bonuses", () => {
    it("gives Dance of the Aurora +1 Faith on tundra, but not tundra forest", () => {
      const city = cityOf(playerWith({ pantheon: "Dance of the Aurora" }));

      expect(bonusesOn(ownedTile(city, "tundra"))).toEqual({ faith: 1 });
      expect(bonusesOn(ownedTile(city, "tundra_hill"))).toEqual({ faith: 1 });
      expect(bonusesOn(ownedTile(city, "tundra", "forest"))).toEqual({});
      expect(bonusesOn(ownedTile(city, "grass"))).toEqual({});
    });

    it("gives Desert Folklore +1 Faith on desert and flood plains", () => {
      const city = cityOf(playerWith({ pantheon: "Desert Folklore" }));

      expect(bonusesOn(ownedTile(city, "desert"))).toEqual({ faith: 1 });
      expect(bonusesOn(ownedTile(city, "floodplains"))).toEqual({ faith: 1 });
    });

    it("gives improvement pantheons their bonus once the improvement is built", () => {
      const city = cityOf(playerWith({ pantheon: "Stone Circles" }));

      expect(bonusesOn(ownedTile(city, "grass", "stone"))).toEqual({});
      expect(bonusesOn(ownedTile(city, "grass", "stone_quarry"))).toEqual({ faith: 2 });
    });

    it("gives resource pantheons their bonus with or without an improvement, once the resource is visible", () => {
      const city = cityOf(playerWith({ pantheon: "Earth Mother" }));

      expect(bonusesOn(ownedTile(city, "grass_hill", "copper"))).toEqual({ faith: 1 });
      expect(bonusesOn(ownedTile(city, "grass_hill", "copper_mine"))).toEqual({ faith: 1 });
      // Iron stays hidden until Bronze Working.
      expect(bonusesOn(ownedTile(city, "grass_hill", "iron"))).toEqual({});
    });

    it("counts the newer resources and Oasis", () => {
      const festivals = cityOf(playerWith({ pantheon: "Goddess of Festivals" }));
      expect(bonusesOn(ownedTile(festivals, "plains", "wine"))).toEqual({ culture: 1, faith: 1 });
      expect(bonusesOn(ownedTile(festivals, "desert", "incense_plantation"))).toEqual({ culture: 1, faith: 1 });

      const tears = cityOf(playerWith({ pantheon: "Tears of the Gods" }));
      expect(bonusesOn(ownedTile(tears, "grass", "gems"))).toEqual({ faith: 2 });

      const sunGod = cityOf(playerWith({ pantheon: "Sun God" }));
      expect(bonusesOn(ownedTile(sunGod, "grass", "jungle", "bananas"))).toEqual({ food: 1 });

      const desert = cityOf(playerWith({ pantheon: "Desert Folklore" }));
      expect(bonusesOn(ownedTile(desert, "desert", "oasis"))).toEqual({ faith: 1 });
    });

    it("lists the bonus under the pantheon's name in the tile's yields", () => {
      const city = cityOf(playerWith({ pantheon: "Sacred Path" }));
      const tile = ownedTile(city, "grass", "jungle");

      expect(tile.getYieldSources().map((source) => source.source)).toContain("Sacred Path");
    });

    it("gives nothing to a player without the pantheon, or to unowned tiles", () => {
      playerWith({ pantheon: "Desert Folklore" });
      const city = cityOf(playerWith());

      expect(bonusesOn(ownedTile(city, "desert"))).toEqual({});
      expect(bonusesOn(new Tile("desert", 0, 0))).toEqual({});
    });
  });

  describe("city bonuses", () => {
    it("adds God-King's yields to the Palace city only", () => {
      const player = playerWith({ pantheon: "God-King" });
      const capital = cityOf(player, { buildings: ["Palace"] });
      const other = cityOf(player);

      expect(Object.assign({}, ...Beliefs.getCityYields(capital))).toEqual({
        production: 1,
        gold: 1,
        science: 1,
        culture: 1,
        faith: 1
      });
      expect(Beliefs.getCityYields(other)).toEqual([]);
    });

    it("gives God of Craftsmen +1 Production in cities of 3 or more", () => {
      const player = playerWith({ pantheon: "God of Craftsmen" });

      expect(Beliefs.getCityYields(cityOf(player, { population: 2 }))).toEqual([]);
      expect(Beliefs.getCityYields(cityOf(player, { population: 3 }))).toEqual([{ production: 1 }]);
    });

    it("counts Goddess of Love's happiness for the empire, not in the city's yields", () => {
      const player = playerWith({ pantheon: "Goddess of Love" });
      const bigCity = cityOf(player, { population: 6 });
      cityOf(player, { population: 6 });
      cityOf(player, { population: 5 });

      expect(Beliefs.getCityYields(bigCity)).toEqual([]);
      expect(Beliefs.getHappiness(player)).toEqual([{ source: "Goddess of Love", amount: 2 }]);
    });

    it("makes growth 10% faster with Fertility Rites, and borders 15% faster with Religious Settlements", () => {
      expect(Beliefs.getFoodRequiredToGrow(22, cityOf(playerWith({ pantheon: "Fertility Rites" })))).toBe(20);
      expect(Beliefs.getFoodRequiredToGrow(22, cityOf(playerWith()))).toBe(22);
      expect(Beliefs.getBorderCost(23, cityOf(playerWith({ pantheon: "Religious Settlements" })))).toBe(20);
    });

    it("speeds up only Ancient and Classical wonders with Monument to the Gods", () => {
      const city = cityOf(playerWith({ pantheon: "Monument to the Gods" }));

      expect(Beliefs.getWonderProductionPercent(city, "Pottery")).toBe(15);
      expect(Beliefs.getWonderProductionPercent(city, "Philosophy")).toBe(15);
      expect(Beliefs.getWonderProductionPercent(city, "Theology")).toBe(0);
    });

    it("adds up what the pantheon gives a city: its worked tiles' bonuses, its own yields and happiness", () => {
      const player = playerWith({ pantheon: "Sacred Waters" });
      const city = cityOf(player);
      city.getTile().setRiverSide(0, true, false);
      expect(Beliefs.getCityBonuses(city)).toEqual({ happiness: 1 });

      const desertPlayer = playerWith({ pantheon: "Desert Folklore" });
      const desertCity = cityOf(desertPlayer);
      desertCity.getWorkedTiles().push(ownedTile(desertCity, "desert"), ownedTile(desertCity, "floodplains"));
      expect(Beliefs.getCityBonuses(desertCity)).toEqual({ faith: 2 });
    });

    it("raises city strike strength by 30% with Goddess of Protection", () => {
      expect(Beliefs.getCityRangedModifiers(cityOf(playerWith({ pantheon: "Goddess of Protection" })))).toEqual([
        { label: "Goddess of Protection", value: 0.3 }
      ]);
    });
  });
});
