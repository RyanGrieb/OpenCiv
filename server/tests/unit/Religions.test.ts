import { City } from "../../src/city/City";
import { ServerEvents } from "../../src/Events";
import { Game } from "../../src/Game";
import { GameMap } from "../../src/map/GameMap";
import { Tile } from "../../src/map/Tile";
import { Player } from "../../src/Player";
import { Beliefs } from "../../src/religion/Beliefs";
import { CityReligion } from "../../src/religion/CityReligion";
import { PlayerReligion } from "../../src/religion/PlayerReligion";
import { Religions } from "../../src/religion/Religions";
import { ReligiousUnits } from "../../src/religion/ReligiousUnits";
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
    era: string;
    techs: string[];
  };

  const playerWith = (options: { pantheon?: string; faith?: number } = {}) => {
    const accumulated: Record<string, number> = { faith: options.faith ?? 0, gold: 0 };
    const player = {
      ownCities: [] as City[],
      accumulated,
      messages: [] as string[],
      atWar: false,
      ownUnits: [] as Unit[],
      era: "ancient",
      techs: [] as string[],
      getEra: () => ({ id: player.era }),
      hasResearchedTech: (tech: string) => player.techs.includes(tech),
      getUnits: () => player.ownUnits,
      getName: () => `player${players.size}`,
      getCivilizationName: () => `Civ${players.size}`,
      getCities: () => player.ownCities,
      isBarbarian: () => false,
      hasClient: () => true,
      getAccumulatedStats: () => accumulated,
      addToAccumulatedStat: (stat: string, amount: number) => (accumulated[stat] = (accumulated[stat] ?? 0) + amount),
      getNotifications: () => ({ addMessage: (icon: string, text: string) => player.messages.push(text) }),
      getDiplomacy: () => ({ isAtWar: () => player.atWar, isAtWarWith: () => player.atWar }),
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

  // A city of the player's at (x, 0), 3 tiles east of the last one unless placed.
  const cityOf = (
    player: TestPlayer,
    options: { name?: string; buildings?: string[]; population?: number; x?: number } = {}
  ) => {
    const buildings = options.buildings ?? [];
    const tile = new Tile("grass", options.x ?? Religions.getAllCities().length * 3, 0);
    const name = options.name ?? `city${Religions.getAllCities().length}`;
    let population = options.population ?? 1;
    const city = {
      setPopulation: (count: number) => (population = count),
      getName: () => name,
      getPlayer: () => player,
      getTile: () => tile,
      getPopulation: () => population,
      refreshBeliefs: jest.fn(),
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
    } as unknown as City & { setPopulation: (count: number) => void };
    const religion = new CityReligion(city, population);
    (city as unknown as Record<string, unknown>).getReligion = () => religion;
    player.ownCities.push(city);
    return city;
  };

  // Every citizen of the player's cities follows the religion.
  const followAll = (player: TestPlayer, religion: string) =>
    player.ownCities.forEach((city) => city.getReligion().convertAll(religion));

  const foundAndFollow = (player: TestPlayer, name: string, founderBelief: string, followerBelief: string) => {
    found(player, name, founderBelief, followerBelief);
    followAll(player, name);
  };

  // A Great Prophet of the player's, standing on the city's tile (or nowhere near a city). Always id 1.
  const prophetOf = (player: TestPlayer, city?: City) => {
    const prophet = {
      getId: () => PROPHET_ID,
      getName: () => "Great Prophet",
      hasSpread: () => false,
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
    const always = () => 0;
    const never = () => 0.999;

    it("have a 5% chance at their cost, 1% more for each Faith past it, up to 100%", () => {
      const player = playerWith({ pantheon: "Sacred Path", faith: 199 });
      cityOf(player);
      const chanceAt = (faith: number) => {
        player.accumulated.faith = faith;
        return player.getReligion().getProphetChance();
      };

      expect(chanceAt(199)).toBe(0);
      expect(chanceAt(200)).toBe(5);
      expect(chanceAt(250)).toBe(55);
      expect(chanceAt(295)).toBe(100);
      expect(chanceAt(400)).toBe(100);
    });

    it("are born on a roll under the chance, in the capital, taking all the Faith before the Industrial Era", () => {
      const player = playerWith({ pantheon: "Sacred Path", faith: 250 });
      const rome = cityOf(player, { name: "Rome", buildings: ["Palace"] });

      player.getReligion().checkForProphet(() => 0.56);
      expect(rome.spawnFreeUnit).not.toHaveBeenCalled();
      player.getReligion().checkForProphet(() => 0.54);

      expect(rome.spawnFreeUnit).toHaveBeenCalledWith("Great Prophet");
      expect(player.accumulated.faith).toBe(0);
      expect(player.getReligion().getProphetCost()).toBe(300);
      expect(player.messages.some((text) => text.includes("Great Prophet has been born in Rome"))).toBe(true);
    });

    it("take only their cost from the Industrial Era on", () => {
      const player = playerWith({ pantheon: "Sacred Path", faith: 250 });
      player.era = "industrial";
      cityOf(player, { buildings: ["Palace"] });

      player.getReligion().checkForProphet(always);

      expect(player.accumulated.faith).toBe(50);
    });

    it("need a pantheon, a city, the faith, and a religion left to found or one founded", () => {
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
      expect(founder(500).getReligion().canEarnProphet()).toBe(true);

      const founded = founder(200);
      found(founded, "Islam", "Tithe", "Feed the World");
      const late = founder(500);
      jest.spyOn(Religions, "hasRoomForAnother").mockReturnValue(false);
      expect(late.getReligion().canEarnProphet()).toBe(false);
      expect(founded.getReligion().canEarnProphet()).toBe(true);
    });

    it("are born in the holy city once there is one, and never on a roll over the chance", () => {
      const player = founder(210);
      const capital = cityOf(player, { name: "Paris", buildings: ["Palace"] });
      player.ownCities.reverse();
      found(player, "Islam", "Tithe", "Feed the World");
      const rome = player.ownCities.find((city) => city.getName() === "Rome");

      player.getReligion().checkForProphet(never);
      expect(rome.spawnFreeUnit).not.toHaveBeenCalled();
      player.getReligion().checkForProphet(always);

      expect(rome.spawnFreeUnit).toHaveBeenCalledWith("Great Prophet");
      expect(capital.spawnFreeUnit).not.toHaveBeenCalled();
    });
  });

  describe("enhancing", () => {
    const enhance = (player: TestPlayer, followerBelief: string, enhancerBelief: string) =>
      player.getReligion().enhanceReligion(followerBelief, enhancerBelief, PROPHET_ID);

    // A player who founded Islam, with a second Great Prophet in the holy city.
    const founderWithProphet = () => {
      const player = founder();
      found(player, "Islam", "Tithe", "Feed the World");
      prophetOf(player, player.ownCities[0]);
      return player;
    };

    it("lists 9 enhancer beliefs", () => {
      expect(Religions.getEnhancerBeliefs()).toHaveLength(9);
    });

    it("adds a second follower belief and an enhancer belief, using up the prophet", () => {
      const player = founderWithProphet();
      const prophet = player.ownUnits[0];
      expect(player.getReligion().canEnhanceWith(prophet)).toBe(true);

      expect(enhance(player, "Asceticism", "Messiah")).toBe(true);

      expect(prophet.delete).toHaveBeenCalled();
      expect(player.getReligion().isEnhanced()).toBe(true);
      expect(player.getReligion().getFounded()).toMatchObject({
        followerBelief2: "Asceticism",
        enhancerBelief: "Messiah"
      });
      expect(Beliefs.getCityBeliefs(player.ownCities[0]).map((belief) => belief.name)).toEqual([
        "Sacred Path",
        "Feed the World",
        "Asceticism"
      ]);
      prophetOf(player, player.ownCities[0]);
      expect(player.getReligion().canEnhanceWith(player.ownUnits[0])).toBe(false);
    });

    it("needs a founded religion, the prophet in an own city, and beliefs no one has", () => {
      const unfounded = founder();
      expect(unfounded.getReligion().canEnhanceWith(unfounded.ownUnits[0])).toBe(false);

      const player = founderWithProphet();
      expect(enhance(player, "Feed the World", "Messiah")).toBe(false);
      expect(enhance(player, "Asceticism", "Tithe")).toBe(false);
    });

    it("gives Messiah's prophets a quarter off", () => {
      const player = founderWithProphet();
      enhance(player, "Asceticism", "Messiah");

      expect(player.getReligion().getProphetCost()).toBe(150);
    });

    it("presses 30% further with Itinerant Preachers, 25% harder with Religious Texts and 50% with Printing Press", () => {
      const player = founderWithProphet();
      enhance(player, "Asceticism", "Itinerant Preachers");
      expect(Beliefs.getSpreadRange("Islam", 10)).toBe(13);
      expect(Beliefs.getSpreadPressure("Islam", 6)).toBe(6);

      const texts = founder();
      found(texts, "Judaism", "Church Property", "Peace Gardens");
      prophetOf(texts, texts.ownCities[0]);
      enhance(texts, "Pagodas", "Religious Texts");
      expect(Beliefs.getSpreadPressure("Judaism", 12)).toBe(15);
      texts.techs.push("Printing Press");
      expect(Beliefs.getSpreadPressure("Judaism", 12)).toBe(18);
    });

    it("gives Defender of the Faith +20% in friendly following lands and Just War +20% in enemy ones", () => {
      const player = founderWithProphet();
      enhance(player, "Asceticism", "Defender of the Faith");
      const enemy = playerWith();
      const enemyCity = cityOf(enemy);
      const tileOf = (city: City) => ({ getCityTerritoryOf: () => city }) as unknown as Tile;

      expect(Beliefs.getCombatModifiers(player, tileOf(player.ownCities[0]))).toEqual([
        { label: "Defender of the Faith", value: 0.2 }
      ]);
      expect(Beliefs.getCombatModifiers(player, tileOf(enemyCity))).toEqual([]);

      const crusader = founder();
      found(crusader, "Judaism", "Church Property", "Peace Gardens");
      prophetOf(crusader, crusader.ownCities[0]);
      enhance(crusader, "Pagodas", "Just War");
      crusader.atWar = true;
      enemyCity.getReligion().convertAll("Judaism");
      expect(Beliefs.getCombatModifiers(crusader, tileOf(enemyCity))).toEqual([{ label: "Just War", value: 0.2 }]);
      expect(Beliefs.getCombatModifiers(crusader, tileOf(crusader.ownCities[0]))).toEqual([]);
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

  describe("spreading", () => {
    it("converts the holy city at founding, and only it", () => {
      const player = founder();
      const other = cityOf(player, { population: 3 });
      found(player, "Islam", "Tithe", "Feed the World");

      expect(player.ownCities[0].getReligion().getMajority()).toBe("Islam");
      expect(other.getReligion().getMajority()).toBeUndefined();
    });

    it("converts one citizen for every 60 pressure, within 10 tiles of a following city", () => {
      const player = founder();
      found(player, "Islam", "Tithe", "Feed the World");
      const near = cityOf(playerWith(), { population: 4, x: 10 });
      const far = cityOf(playerWith(), { population: 4, x: 11 });

      for (let turn = 0; turn < 5; turn++) Religions.spreadPressure();

      // The holy city presses 12 a turn: 60 after 5 turns, one citizen.
      expect(near.getReligion().getFollowers()).toEqual({ Islam: 1 });
      expect(near.getReligion().getNonFollowers()).toBe(3);
      expect(near.getReligion().getMajority()).toBeUndefined();
      expect(far.getReligion().getFollowers()).toEqual({});
    });

    it("follows the religion with the most followers, if they're at least as many as those following none", () => {
      const city = cityOf(playerWith(), { population: 5 });
      const religion = city.getReligion();

      religion.addPressure("Islam", 120);
      expect(religion.getMajority()).toBeUndefined();
      religion.addPressure("Judaism", 120);
      expect(religion.getMajority()).toBeUndefined();
      religion.addPressure("Islam", 60);
      expect(religion.getFollowers()).toEqual({ Islam: 3, Judaism: 2 });
      expect(religion.getMajority()).toBe("Islam");
    });

    it("converts the biggest other religion's followers once no one is left following none", () => {
      const city = cityOf(playerWith(), { population: 3 });
      city.getReligion().convertAll("Islam");

      city.getReligion().addPressure("Judaism", 120);

      expect(city.getReligion().getFollowers()).toEqual({ Islam: 1, Judaism: 2 });
      expect(city.getReligion().getMajority()).toBe("Judaism");
    });

    it("adds new citizens to the majority, and takes lost ones from those following none first", () => {
      const city = cityOf(playerWith(), { population: 3 });
      city.getReligion().addPressure("Islam", 120);

      city.setPopulation(5);
      expect(city.getReligion().getFollowers()).toEqual({ Islam: 4 });

      city.getReligion().addPressure("Judaism", 60);
      city.setPopulation(3);
      expect(city.getReligion().getFollowers()).toEqual({ Islam: 3 });
      expect(city.getReligion().getNonFollowers()).toBe(0);
    });

    it("gives a city following another civilization's religion that religion's follower belief", () => {
      const player = founder();
      found(player, "Islam", "Tithe", "Feed the World");
      const foreign = cityOf(playerWith(), { buildings: ["Shrine"] });

      expect(Beliefs.getCityBonuses(foreign)).toEqual({});
      foreign.getReligion().convertAll("Islam");
      expect(Beliefs.getCityBonuses(foreign)).toEqual({ food: 1 });
    });
  });

  describe("religious units", () => {
    type TestUnit = Unit & { deleted: boolean; spreads: number; strength: number };

    // A Missionary, Inquisitor or Great Prophet of the player's, standing in the city (or in `lands`).
    const religiousUnit = (
      player: TestPlayer,
      name: string,
      options: { city?: City; religion?: string; lands?: City } = {}
    ) => {
      let religion = options.religion;
      const unit = {
        deleted: false,
        spreads: name === "Missionary" ? 2 : name === "Great Prophet" ? 4 : 0,
        strength: 100,
        getName: () => name,
        getPlayer: () => player,
        getId: () => PROPHET_ID,
        getTile: () => ({
          getCity: () => options.city,
          getAdjacentTiles: (): unknown[] => [],
          getCityTerritoryOf: () => options.lands ?? options.city
        }),
        getReligion: () => religion,
        setReligion: (name: string) => (religion = name),
        getSpreadsLeft: () => unit.spreads,
        hasSpread: () => name === "Great Prophet" && unit.spreads < 4,
        canSpread: () => name === "Missionary" || name === "Great Prophet",
        getAvailableMovement: () => 2,
        getReligiousStrength: () => unit.strength,
        weakenReligiousStrength: (percent: number) => (unit.strength -= percent),
        useReligiousAction: () => unit.spreads--,
        delete: () => {
          unit.deleted = true;
          player.ownUnits = player.ownUnits.filter((other) => other !== (unit as unknown));
        }
      } as unknown as TestUnit;
      player.ownUnits.push(unit);
      return unit;
    };

    // Rome founded Islam; Paris, size 4, is another civilization's city following nothing.
    const islamAndParis = () => {
      const rome = founder();
      found(rome, "Islam", "Tithe", "Feed the World");
      const france = playerWith();
      const paris = cityOf(france, { name: "Paris", population: 4, x: 30 });
      return { rome, france, paris };
    };

    it("lets a Missionary spread its religion twice, about 3 citizens each time, then uses it up", () => {
      const { rome, paris } = islamAndParis();
      const missionary = religiousUnit(rome, "Missionary", { city: paris, religion: "Islam" });

      expect(ReligiousUnits.spread(missionary)).toBe(true);
      expect(paris.getReligion().getFollowersOf("Islam")).toBe(3);
      expect(paris.getReligion().getMajority()).toBe("Islam");
      expect(missionary.deleted).toBe(false);

      expect(ReligiousUnits.spread(missionary)).toBe(true);
      expect(paris.getReligion().getFollowersOf("Islam")).toBe(4);
      expect(missionary.deleted).toBe(true);
      expect(ReligiousUnits.canSpread(missionary)).toBe(false);
    });

    it("gives Interfaith Dialogue 2 Science per other religion's follower a Missionary reaches", () => {
      const rome = founder();
      found(rome, "Islam", "Interfaith Dialogue", "Feed the World");
      const science = jest.fn();
      (rome as unknown as Record<string, unknown>).addScience = science;
      const paris = cityOf(playerWith(), { name: "Paris", population: 4, x: 30 });
      paris.getReligion().addPressure("Judaism", 180);

      ReligiousUnits.spread(religiousUnit(rome, "Missionary", { city: paris, religion: "Islam" }));
      expect(science).toHaveBeenCalledWith(6);
      ReligiousUnits.spread(religiousUnit(rome, "Great Prophet", { city: paris }));
      expect(science).toHaveBeenCalledTimes(1);
    });

    it("lets a Great Prophet clear out other religions as it spreads its owner's, harder with Messiah", () => {
      const { rome, paris } = islamAndParis();
      paris.getReligion().convertAll("Judaism");
      paris.setPopulation(8);
      const prophet = religiousUnit(rome, "Great Prophet", { city: paris });

      ReligiousUnits.spread(prophet);
      expect(paris.getReligion().getFollowers()).toEqual({ Islam: 4 });

      prophetOf(rome, rome.ownCities[0]);
      rome.getReligion().enhanceReligion("Asceticism", "Messiah", PROPHET_ID);
      const strong = religiousUnit(rome, "Great Prophet", { city: paris });
      ReligiousUnits.spread(strong);
      expect(paris.getReligion().getFollowersOf("Islam")).toBe(8);
    });

    it("pays Reliquary's 50 Faith when a Great Prophet's last spread uses it up", () => {
      const { rome, paris } = islamAndParis();
      prophetOf(rome, rome.ownCities[0]);
      rome.getReligion().enhanceReligion("Asceticism", "Reliquary", PROPHET_ID);
      const prophet = religiousUnit(rome, "Great Prophet", { city: paris });
      prophet.spreads = 1;
      rome.accumulated.faith = 0;

      ReligiousUnits.spread(prophet);

      expect(prophet.deleted).toBe(true);
      expect(rome.accumulated.faith).toBe(50);
    });

    it("keeps other religions out of a city its owner's Inquisitor guards, and removes heresy there", () => {
      const { rome, france, paris } = islamAndParis();
      paris.getReligion().addPressure("Judaism", 60);
      const inquisitor = religiousUnit(france, "Inquisitor", { city: paris, religion: "Judaism" });
      paris.getTile().addUnit(inquisitor);
      const missionary = religiousUnit(rome, "Missionary", { city: paris, religion: "Islam" });
      expect(ReligiousUnits.canSpread(missionary)).toBe(false);
      expect(ReligiousUnits.canSpread(religiousUnit(france, "Missionary", { city: paris, religion: "Judaism" }))).toBe(
        true
      );

      paris.getTile().removeUnit(inquisitor);
      ReligiousUnits.spread(missionary);
      expect(paris.getReligion().getFollowers()).toEqual({ Islam: 3, Judaism: 1 });
      expect(
        ReligiousUnits.canRemoveHeresy(religiousUnit(rome, "Inquisitor", { city: paris, religion: "Islam" }))
      ).toBe(false);

      expect(ReligiousUnits.removeHeresy(inquisitor)).toBe(true);
      expect(paris.getReligion().getFollowers()).toEqual({ Judaism: 1 });
      expect(inquisitor.deleted).toBe(true);
    });

    it("sells Missionaries in a following city, Inquisitors once enhanced, 30% off with Holy Order", () => {
      const { rome, paris } = islamAndParis();
      const holyCity = rome.ownCities[0];
      expect(ReligiousUnits.getFaithOptions(paris)).toEqual([]);
      expect(ReligiousUnits.getFaithOptions(holyCity)).toEqual([{ name: "Missionary", faithCost: 200 }]);

      prophetOf(rome, holyCity);
      rome.getReligion().enhanceReligion("Asceticism", "Holy Order", PROPHET_ID);
      expect(ReligiousUnits.getFaithOptions(holyCity)).toEqual([
        { name: "Missionary", faithCost: 140 },
        { name: "Inquisitor", faithCost: 140 }
      ]);
      paris.getReligion().convertAll("Islam");
      expect(ReligiousUnits.getFaithOptions(paris)).toEqual([
        { name: "Missionary", faithCost: 200 },
        { name: "Inquisitor", faithCost: 200 }
      ]);
    });

    it("wears Missionaries and Great Prophets down by a quarter each turn in foreign lands, losing them at none", () => {
      const { rome, paris } = islamAndParis();
      const abroad = religiousUnit(rome, "Missionary", { lands: paris, religion: "Islam" });
      const home = religiousUnit(rome, "Missionary", { lands: rome.ownCities[0], religion: "Islam" });
      const prophet = religiousUnit(rome, "Great Prophet", { lands: paris });
      const inquisitor = religiousUnit(rome, "Inquisitor", { lands: paris, religion: "Islam" });

      ReligiousUnits.applyAttrition(rome);
      expect(abroad.strength).toBe(75);
      expect(home.strength).toBe(100);
      expect(ReligiousUnits.describeSpread(abroad)).toBe("Spread Islam (2 left, 75% strength)");

      for (let turn = 0; turn < 3; turn++) ReligiousUnits.applyAttrition(rome);
      expect(abroad.deleted).toBe(true);
      expect(home.deleted).toBe(false);
      expect(prophet.deleted).toBe(true);
      expect(inquisitor.strength).toBe(100);
    });

    it("stops a Great Prophet that has spread from enhancing", () => {
      const { rome } = islamAndParis();
      const prophet = religiousUnit(rome, "Great Prophet", { city: rome.ownCities[0] });
      expect(rome.getReligion().canEnhanceWith(prophet)).toBe(true);
      prophet.spreads = 3;
      expect(rome.getReligion().canEnhanceWith(prophet)).toBe(false);
    });
  });

  describe("founder beliefs", () => {
    it("gives Church Property 2 Gold for each city, and Tithe 1 for every 4 followers", () => {
      const church = founder();
      cityOf(church, { population: 3 });
      foundAndFollow(church, "Islam", "Church Property", "Feed the World");
      expect(Beliefs.getEmpireYields(church)).toEqual({ gold: 4 });

      const tithe = founder();
      cityOf(tithe, { population: 7 });
      foundAndFollow(tithe, "Judaism", "Tithe", "Asceticism");
      expect(Beliefs.getEmpireYields(tithe)).toEqual({ gold: 2 });
    });

    it("gives Ceremonial Burial 1 Happiness for every 2 cities", () => {
      const player = founder();
      cityOf(player);
      cityOf(player);
      foundAndFollow(player, "Islam", "Ceremonial Burial", "Feed the World");

      expect(Beliefs.getHappiness(player)).toContainEqual({ source: "Ceremonial Burial", amount: 1 });
      expect(Beliefs.getEmpireBonuses(player)).toEqual({ happiness: 1 });
    });

    it("pays Initiation Rites' 100 Gold for the holy city, then once for each city converted", () => {
      const player = founder();
      const other = cityOf(player);
      found(player, "Islam", "Initiation Rites", "Feed the World");
      expect(player.accumulated.gold).toBe(100);

      // Rome's 12 pressure a turn converts the 1-citizen city in 5 turns; it stays converted after.
      for (let turn = 0; turn < 8; turn++) Religions.spreadPressure();
      expect(other.getReligion().getMajority()).toBe("Islam");
      expect(player.accumulated.gold).toBe(200);
    });

    it("gives Pilgrimage 2 Faith per foreign city following, World Church 1 Culture per 5 foreign followers", () => {
      const player = founder();
      found(player, "Islam", "Pilgrimage", "Feed the World");
      const foreign = cityOf(playerWith(), { population: 5 });
      foreign.getReligion().convertAll("Islam");
      expect(Beliefs.getEmpireYields(player)).toEqual({ faith: 2 });

      const church = founder();
      found(church, "Judaism", "World Church", "Asceticism");
      cityOf(playerWith(), { population: 10 }).getReligion().convertAll("Judaism");
      expect(Beliefs.getEmpireYields(church)).toEqual({ culture: 2 });
    });

    it("gives Peace Loving 1 Happiness per 8 followers in foreign cities not at war with the founder", () => {
      const player = founder();
      found(player, "Islam", "Peace Loving", "Feed the World");
      cityOf(playerWith(), { population: 8 }).getReligion().convertAll("Islam");
      expect(Beliefs.getEmpireBonuses(player)).toEqual({ happiness: 1 });

      player.atWar = true;
      expect(Beliefs.getEmpireBonuses(player)).toEqual({});
    });
  });

  describe("follower beliefs", () => {
    it("gives building beliefs their yields only with enough followers", () => {
      const player = founder();
      const small = cityOf(player, { buildings: ["Shrine", "Temple"], population: 2 });
      const large = cityOf(player, { buildings: ["Shrine", "Temple"], population: 5 });
      foundAndFollow(player, "Islam", "Tithe", "Asceticism");

      expect(Beliefs.getCityHappiness(small)).toBe(0);
      expect(Beliefs.getCityHappiness(large)).toBe(1);
    });

    it("gives Feed the World +1 Food from each Shrine and Temple", () => {
      const player = founder();
      const city = cityOf(player, { buildings: ["Shrine", "Temple"] });
      foundAndFollow(player, "Islam", "Tithe", "Feed the World");

      expect(Beliefs.getCityBonuses(city)).toEqual({ food: 2 });
    });

    it("gives Divine Inspiration +2 Faith for each World Wonder", () => {
      const player = founder();
      const city = cityOf(player, { buildings: ["Pyramids", "Shrine"] });
      foundAndFollow(player, "Islam", "Tithe", "Divine Inspiration");

      expect(Beliefs.getCityBonuses(city)).toEqual({ faith: 2 });
    });

    it("adds Religious Community's 1% Production per follower, up to 15%", () => {
      const player = founder();
      const city = cityOf(player, { population: 20 });
      foundAndFollow(player, "Islam", "Tithe", "Religious Community");

      const stats = { production: 100 } as Parameters<typeof Beliefs.applyToCityStats>[1];
      Beliefs.applyToCityStats(city, stats);
      expect(stats.production).toBe(115);
    });

    it("speeds growth 15% with Swords into Plowshares only while at peace", () => {
      const player = founder();
      found(player, "Islam", "Tithe", "Swords into Plowshares");
      const holyCity = player.ownCities[0];

      expect(Beliefs.getFoodRequiredToGrow(115, holyCity)).toBe(100);
      player.atWar = true;
      expect(Beliefs.getFoodRequiredToGrow(115, holyCity)).toBe(115);
    });
  });

  describe("faith purchasing", () => {
    const unit = (name: string) => Unit.getAllUnitData().find((data) => data.name === name);

    it("unlocks a faith building with each of Cathedrals, Monasteries, Mosques and Pagodas", () => {
      const player = founder();
      const city = player.ownCities[0];
      found(player, "Islam", "Tithe", "Mosques");

      expect(Beliefs.getFaithBuildings(city)).toEqual([{ building: "Mosque", faith_cost: 200 }]);
    });

    it("lets Holy Warriors buy pre-Industrial land military units, and nothing else", () => {
      const player = founder();
      const city = player.ownCities[0];
      expect(Beliefs.canBuyUnitWithFaith(city, unit("Swordsman"))).toBe(false);

      found(player, "Islam", "Tithe", "Holy Warriors");

      expect(Beliefs.canBuyUnitWithFaith(city, unit("Warrior"))).toBe(true);
      expect(Beliefs.canBuyUnitWithFaith(city, unit("Swordsman"))).toBe(true);
      expect(Beliefs.canBuyUnitWithFaith(city, unit("Rifleman"))).toBe(false);
      expect(Beliefs.canBuyUnitWithFaith(city, unit("Settler"))).toBe(false);
      expect(Beliefs.canBuyUnitWithFaith(city, unit("Trireme"))).toBe(false);
    });
  });
});
