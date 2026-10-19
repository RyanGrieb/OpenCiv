import { City } from "../../src/city/City";
import { ServerEvents } from "../../src/Events";
import { Game } from "../../src/Game";
import { GameMap } from "../../src/map/GameMap";
import { Player } from "../../src/Player";
import { Beliefs } from "../../src/religion/Beliefs";
import { PlayerReligion } from "../../src/religion/PlayerReligion";
import { Religions } from "../../src/religion/Religions";
import { Unit } from "../../src/unit/Unit";

const PROPHET_ID = 1;

// Real religions.yml and pantheons.yml throughout, with as much of a player and city as the beliefs look at.
describe("Religions", () => {
  let players: Map<string, Player>;

  type TestPlayer = Player & {
    ownCities: City[];
    accumulated: Record<string, number>;
    messages: string[];
    atWar: boolean;
    ownUnits: Unit[];
  };

  const playerWith = (options: { pantheon?: string; faith?: number } = {}) => {
    const accumulated: Record<string, number> = { faith: options.faith ?? 0, gold: 0 };
    const player = {
      ownCities: [] as City[],
      accumulated,
      messages: [] as string[],
      atWar: false,
      ownUnits: [] as Unit[],
      getUnits: () => player.ownUnits,
      getName: () => `player${players.size}`,
      getCivilizationName: () => `Civ${players.size}`,
      getCities: () => player.ownCities,
      isBarbarian: () => false,
      hasClient: () => true,
      getAccumulatedStats: () => accumulated,
      addToAccumulatedStat: (stat: string, amount: number) => (accumulated[stat] = (accumulated[stat] ?? 0) + amount),
      getNotifications: () => ({ addMessage: (icon: string, text: string) => player.messages.push(text) }),
      getDiplomacy: () => ({ isAtWar: () => player.atWar }),
      sendTotalStatsUpdate: jest.fn(),
      sendNetworkEvent: jest.fn(),
      getWebsocket: (): undefined => undefined
    } as unknown as TestPlayer;
    const religion = new PlayerReligion(player);
    (player as unknown as Record<string, unknown>).getReligion = () => religion;
    if (options.pantheon) religion["pantheonName"] = options.pantheon;
    players.set(player.getName(), player);
    return player;
  };

  const cityOf = (player: TestPlayer, options: { name?: string; buildings?: string[]; population?: number } = {}) => {
    const buildings = options.buildings ?? [];
    const city = {
      getName: () => options.name ?? `city${player.ownCities.length}`,
      getPlayer: () => player,
      getPopulation: () => options.population ?? 1,
      hasBuilding: (name: string) => buildings.includes(name),
      getBuildings: () =>
        buildings.map((name) => ({ getName: () => name, isWonderBuilding: () => name === "Pyramids" })),
      getTerritory: (): unknown[] => [],
      getWorkedTiles: (): unknown[] => [],
      updateWorkedTiles: jest.fn(),
      spawnFreeUnit: jest.fn(() => {
        prophetOf(player, city);
        return true;
      })
    } as unknown as City;
    player.ownCities.push(city);
    return city;
  };

  // A Great Prophet of the player's, standing on the city's tile (or nowhere near a city). Always id 1.
  const prophetOf = (player: TestPlayer, city?: City) => {
    const prophet = {
      getId: () => PROPHET_ID,
      getName: () => "Great Prophet",
      getPlayer: () => player,
      getTile: () => ({ getCity: () => city }),
      delete: jest.fn(() => (player.ownUnits = player.ownUnits.filter((unit) => unit !== prophet)))
    } as unknown as Unit;
    player.ownUnits.push(prophet);
    return prophet;
  };

  // A player with a pantheon, and a Great Prophet in their capital, Rome.
  const founder = (faith = 0) => {
    const player = playerWith({ pantheon: "Sacred Path", faith });
    prophetOf(player, cityOf(player, { name: "Rome", buildings: ["Palace"] }));
    return player;
  };

  const found = (player: TestPlayer, name: string, founderBelief: string, followerBelief: string) =>
    player.getReligion().foundReligion(name, founderBelief, followerBelief, PROPHET_ID);

  beforeEach(() => {
    players = new Map();
    jest.spyOn(ServerEvents, "on").mockImplementation(() => {});
    jest.spyOn(Game, "getInstance").mockReturnValue({ getPlayers: () => players } as unknown as Game);
    jest.spyOn(GameMap, "getInstance").mockReturnValue({ sendTilesToPlayer: jest.fn() } as unknown as GameMap);
  });

  afterEach(() => jest.restoreAllMocks());

  it("lists 13 religions, 9 founder beliefs and 16 follower beliefs", () => {
    expect(Religions.getNames()).toHaveLength(13);
    expect(Religions.getFounderBeliefs()).toHaveLength(9);
    expect(Religions.getFollowerBeliefs()).toHaveLength(16);
  });

  describe("Great Prophets", () => {
    it("are born at 200 Faith in the capital, the next costing 300", () => {
      const player = playerWith({ pantheon: "Sacred Path", faith: 210 });
      const rome = cityOf(player, { name: "Rome", buildings: ["Palace"] });

      player.getReligion().checkForProphet();

      expect(rome.spawnFreeUnit).toHaveBeenCalledWith("Great Prophet");
      expect(player.accumulated.faith).toBe(10);
      expect(player.getReligion().getProphetCost()).toBe(300);
      expect(player.messages.some((text) => text.includes("Great Prophet has been born in Rome"))).toBe(true);
    });

    it("need a pantheon, a city, the faith, and no prophet already waiting", () => {
      const withPantheon = () => playerWith({ pantheon: "Sacred Path", faith: 200 });
      const ready = withPantheon();
      cityOf(ready);
      expect(ready.getReligion().canEarnProphet()).toBe(true);

      expect(withPantheon().getReligion().canEarnProphet()).toBe(false);
      const noPantheon = playerWith({ faith: 500 });
      cityOf(noPantheon);
      expect(noPantheon.getReligion().canEarnProphet()).toBe(false);
      const poor = playerWith({ pantheon: "Sacred Path", faith: 199 });
      cityOf(poor);
      expect(poor.getReligion().canEarnProphet()).toBe(false);
      expect(founder(500).getReligion().canEarnProphet()).toBe(false);
    });
  });

  describe("founding", () => {
    it("uses up the prophet, makes its city the holy city, and tells everyone", () => {
      const other = playerWith();
      const player = founder(50);
      const prophet = player.ownUnits[0];

      expect(found(player, "Buddhism", "Church Property", "Asceticism")).toBe(true);

      expect(player.getReligion().getFounded()).toEqual({
        name: "Buddhism",
        founderBelief: "Church Property",
        followerBelief: "Asceticism",
        holyCity: "Rome"
      });
      expect(prophet.delete).toHaveBeenCalled();
      expect(player.accumulated.faith).toBe(50);
      expect(
        player
          .getReligion()
          .getBeliefs()
          .map((belief) => belief.name)
      ).toEqual(["Sacred Path", "Church Property", "Asceticism"]);
      expect(other.messages.some((text) => text.includes("Buddhism"))).toBe(true);
    });

    it("needs the prophet to stand in one of the player's own cities", () => {
      const player = playerWith({ pantheon: "Sacred Path" });
      prophetOf(player);
      expect(found(player, "Islam", "Tithe", "Feed the World")).toBe(false);

      const enemyCity = cityOf(playerWith());
      const abroad = playerWith({ pantheon: "Sacred Path" });
      prophetOf(abroad, enemyCity);
      expect(found(abroad, "Islam", "Tithe", "Feed the World")).toBe(false);
    });

    it("lets no two religions share a name or a belief", () => {
      found(founder(), "Islam", "Tithe", "Feed the World");
      const player = founder();

      expect(found(player, "Islam", "Church Property", "Asceticism")).toBe(false);
      expect(found(player, "Judaism", "Tithe", "Asceticism")).toBe(false);
      expect(found(player, "Judaism", "Church Property", "Feed the World")).toBe(false);
      const available = Religions.getAvailable();
      expect(available.religions).not.toContain("Islam");
      expect(available.founderBeliefs.map((belief) => belief.name)).not.toContain("Tithe");

      expect(found(player, "Judaism", "Church Property", "Asceticism")).toBe(true);
      prophetOf(player, player.ownCities[0]);
      expect(found(player, "Taoism", "Tithe", "Peace Gardens")).toBe(false);
    });

    it("refuses a follower belief as the founder belief", () => {
      expect(found(founder(), "Islam", "Feed the World", "Asceticism")).toBe(false);
    });
  });

  describe("founder beliefs", () => {
    it("gives Church Property 2 Gold for each city, and Tithe 1 for every 4 followers", () => {
      const church = founder();
      cityOf(church, { population: 3 });
      found(church, "Islam", "Church Property", "Feed the World");
      expect(Beliefs.getEmpireGold(church)).toBe(4);

      const tithe = founder();
      cityOf(tithe, { population: 7 });
      found(tithe, "Judaism", "Tithe", "Asceticism");
      expect(Beliefs.getEmpireGold(tithe)).toBe(2);
    });

    it("gives Ceremonial Burial 1 Happiness for every 2 cities", () => {
      const player = founder();
      cityOf(player);
      cityOf(player);
      found(player, "Islam", "Ceremonial Burial", "Feed the World");

      expect(Beliefs.getHappiness(player)).toContainEqual({ source: "Ceremonial Burial", amount: 1 });
      expect(Beliefs.getEmpireBonuses(player)).toEqual({ happiness: 1 });
    });

    it("pays Initiation Rites' 100 Gold once for each city at founding, and for each city joined later", () => {
      const player = founder();
      cityOf(player);
      found(player, "Islam", "Initiation Rites", "Feed the World");
      expect(player.accumulated.gold).toBe(200);

      const settled = cityOf(player);
      player.getReligion().onCityJoined(settled);
      player.getReligion().onCityJoined(settled);
      expect(player.accumulated.gold).toBe(300);
    });
  });

  describe("follower beliefs", () => {
    it("gives building beliefs their yields only with enough followers", () => {
      const player = founder();
      const small = cityOf(player, { buildings: ["Shrine", "Temple"], population: 2 });
      const large = cityOf(player, { buildings: ["Shrine", "Temple"], population: 5 });
      found(player, "Islam", "Tithe", "Asceticism");

      expect(Beliefs.getCityHappiness(small)).toBe(0);
      expect(Beliefs.getCityHappiness(large)).toBe(1);
    });

    it("gives Feed the World +1 Food from each Shrine and Temple", () => {
      const player = founder();
      const city = cityOf(player, { buildings: ["Shrine", "Temple"] });
      found(player, "Islam", "Tithe", "Feed the World");

      expect(Beliefs.getCityBonuses(city)).toEqual({ food: 2 });
    });

    it("gives Divine Inspiration +2 Faith for each World Wonder", () => {
      const player = founder();
      const city = cityOf(player, { buildings: ["Pyramids", "Shrine"] });
      found(player, "Islam", "Tithe", "Divine Inspiration");

      expect(Beliefs.getCityBonuses(city)).toEqual({ faith: 2 });
    });

    it("adds Religious Community's 1% Production per follower, up to 15%", () => {
      const player = founder();
      const city = cityOf(player, { population: 20 });
      found(player, "Islam", "Tithe", "Religious Community");

      const stats = { production: 100 } as Parameters<typeof Beliefs.applyToCityStats>[1];
      Beliefs.applyToCityStats(city, stats);
      expect(stats.production).toBe(115);
    });

    it("speeds growth 15% with Swords into Plowshares only while at peace", () => {
      const player = founder();
      found(player, "Islam", "Tithe", "Swords into Plowshares");

      expect(Beliefs.getFoodRequiredToGrow(115, player)).toBe(100);
      player.atWar = true;
      expect(Beliefs.getFoodRequiredToGrow(115, player)).toBe(115);
    });
  });
});
