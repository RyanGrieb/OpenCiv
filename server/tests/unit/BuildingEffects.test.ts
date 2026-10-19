import { Building } from "../../src/city/Building";
import { BuildingEffects } from "../../src/city/BuildingEffects";
import { BuildingEffectText } from "../../src/city/BuildingEffectText";
import { City, CityStats } from "../../src/city/City";
import { Tile } from "../../src/map/Tile";
import { Player } from "../../src/Player";
import { Unit } from "../../src/unit/Unit";

// Real buildings.yml throughout, with as much of a city and player as the effects look at.
describe("BuildingEffects", () => {
  const playerWith = (options: { techs?: string[]; atWarWith?: Player[] } = {}) => {
    const player = {
      ownCities: [] as City[],
      getCities: () => player.ownCities,
      hasResearchedTech: (tech: string) => (options.techs ?? []).includes(tech),
      isBarbarian: () => false,
      getDiplomacy: () => ({ isAtWarWith: (other: Player) => (options.atWarWith ?? []).includes(other) })
    };
    return player as unknown as Player & { ownCities: City[] };
  };

  const cityOf = (player: Player & { ownCities: City[] }, buildingNames: string[], population = 1) => {
    const city = {
      getBuildings: () => buildingNames.map((name) => Building.createFromName(name)),
      getPlayer: () => player,
      getPopulation: () => population
    } as unknown as City;
    player.ownCities.push(city);
    return city;
  };

  const tileOf = (...tileTypes: string[]) => {
    const tile = new Tile(tileTypes[0], 0, 0);
    tileTypes.slice(1).forEach((type) => tile.addTileType(type));
    return tile;
  };

  const ownedTile = (city: City, ...tileTypes: string[]) => {
    const tile = tileOf(...tileTypes);
    tile.setCityTerritoryOf(city);
    return tile;
  };

  const bonusesOn = (tile: Tile) => Object.assign({}, ...BuildingEffects.getTileBonuses(tile));

  const emptyStats = (overrides: Partial<CityStats>): CityStats => ({
    population: 1,
    science: 0,
    gold: 0,
    production: 0,
    faith: 0,
    culture: 0,
    food: 0,
    happiness: 0,
    defense: 0,
    foodSurplus: 0,
    foodRequiredToGrow: 0,
    cultureStored: 0,
    cultureRequiredToExpand: 0,
    ...overrides
  });

  describe("tile bonuses", () => {
    it("gives a Lighthouse city +1 Food on its coast and ocean, but not lakes or land", () => {
      const city = cityOf(playerWith(), ["Lighthouse"]);

      expect(bonusesOn(ownedTile(city, "shallow_ocean"))).toEqual({ food: 1 });
      expect(bonusesOn(ownedTile(city, "ocean"))).toEqual({ food: 1 });
      expect(bonusesOn(ownedTile(city, "freshwater"))).toEqual({});
      expect(bonusesOn(ownedTile(city, "grass"))).toEqual({});
    });

    it("adds the bonus to the tile yields its city works", () => {
      const city = cityOf(playerWith(), ["Harbor"]);
      const tile = ownedTile(city, "ocean");
      const production = tile.getStats().find((stat) => stat.production !== undefined).production;

      expect(production).toBe(1);
    });

    it("gives nothing to a tile outside the building's city", () => {
      cityOf(playerWith(), ["Lighthouse"]);

      expect(bonusesOn(tileOf("ocean"))).toEqual({});
    });

    it("gives Petra +1 Food and +1 Production on desert, but not desert floodplains", () => {
      const city = cityOf(playerWith(), ["Petra"]);

      expect(bonusesOn(ownedTile(city, "desert"))).toEqual({ food: 1, production: 1 });
      expect(bonusesOn(ownedTile(city, "desert", "floodplains"))).toEqual({});
    });

    it("only boosts a resource its owner can see: Stables' Horses need Animal Husbandry", () => {
      const blind = cityOf(playerWith(), ["Stables"]);
      const sighted = cityOf(playerWith({ techs: ["Animal Husbandry"] }), ["Stables"]);

      expect(bonusesOn(ownedTile(blind, "grass", "horses"))).toEqual({});
      expect(bonusesOn(ownedTile(sighted, "grass", "horses"))).toEqual({ production: 1 });
      expect(bonusesOn(ownedTile(blind, "grass", "sheep"))).toEqual({ production: 1 });
    });

    it("counts an improved resource too, e.g. Wheat under a Farm for the Granary", () => {
      const city = cityOf(playerWith(), ["Granary"]);

      expect(bonusesOn(ownedTile(city, "plains", "improved_wheat"))).toEqual({ food: 1 });
    });

    it("gives a Granary +1 Food on Deer, with or without a Camp", () => {
      const city = cityOf(playerWith(), ["Granary"]);

      expect(bonusesOn(ownedTile(city, "tundra", "deer", "forest"))).toEqual({ food: 1 });
      expect(bonusesOn(ownedTile(city, "tundra", "deer_camp", "forest"))).toEqual({ food: 1 });
    });

    it("gives a University +2 Science on jungle", () => {
      const city = cityOf(playerWith(), ["Library", "University"]);

      expect(bonusesOn(ownedTile(city, "grass", "jungle"))).toEqual({ science: 2 });
    });
  });

  describe("city yields", () => {
    it("gives a Library +1 Science per 2 citizens, rounded down", () => {
      const stats = emptyStats({});
      BuildingEffects.applyToCityStats(cityOf(playerWith(), ["Library"], 5), stats);

      expect(stats.science).toBe(2);
    });

    it("scales by the percentages of every building in the city, rounded down", () => {
      const stats = emptyStats({ science: 10, gold: 7 });
      BuildingEffects.applyToCityStats(cityOf(playerWith(), ["Market", "University", "National College"]), stats);

      // 10 * 1.83 and 7 * 1.25
      expect(stats.science).toBe(18);
      expect(stats.gold).toBe(8);
    });

    it("applies an empire-wide percentage in every one of the owner's cities", () => {
      const player = playerWith();
      cityOf(player, ["Temple of Artemis"]);
      const otherCity = cityOf(player, []);
      const stats = emptyStats({ food: 10 });

      BuildingEffects.applyToCityStats(otherCity, stats);

      expect(stats.food).toBe(11);
    });

    it("never scales a food shortfall", () => {
      const player = playerWith();
      const city = cityOf(player, ["Temple of Artemis"]);
      const stats = emptyStats({ food: -3 });

      BuildingEffects.applyToCityStats(city, stats);

      expect(stats.food).toBe(-3);
    });
  });

  describe("units", () => {
    const horseman = { name: "Horseman", combat_strength: 12 };
    const warrior = { name: "Warrior", combat_strength: 8 };
    const trireme = { name: "Trireme", combat_strength: 7, domain: "sea" as const };
    const settler = { name: "Settler" };

    it("speeds up mounted units in a city with Stables, and land military units with a Forge", () => {
      const stables = cityOf(playerWith(), ["Stables"]);
      const forge = cityOf(playerWith(), ["Forge"]);

      expect(BuildingEffects.getUnitProductionPercent(stables, horseman)).toBe(15);
      expect(BuildingEffects.getUnitProductionPercent(stables, warrior)).toBe(0);
      expect(BuildingEffects.getUnitProductionPercent(forge, warrior)).toBe(15);
      expect(BuildingEffects.getUnitProductionPercent(forge, trireme)).toBe(0);
      expect(BuildingEffects.getUnitProductionPercent(forge, settler)).toBe(0);
    });

    it("stacks Stables and a Forge on a mounted unit", () => {
      expect(BuildingEffects.getUnitProductionPercent(cityOf(playerWith(), ["Stables", "Forge"]), horseman)).toBe(30);
    });

    it("makes the Great Pyramids owner's Builders work at 125% speed", () => {
      const player = playerWith();
      expect(BuildingEffects.getBuildTurns(7, player)).toBe(7);

      cityOf(player, ["Great Pyramids"]);
      expect(BuildingEffects.getBuildTurns(7, player)).toBe(6);
      expect(BuildingEffects.getBuildTurns(5, player)).toBe(4);
    });

    it("gives the Great Lighthouse owner's ships +1 Movement and +1 Sight", () => {
      const player = playerWith();
      cityOf(player, ["Great Lighthouse"]);

      expect(BuildingEffects.getNavalMovementBonus(player)).toBe(1);
      expect(BuildingEffects.getNavalSightBonus(player)).toBe(1);
      expect(BuildingEffects.getNavalMovementBonus(playerWith())).toBe(0);
    });
  });

  describe("combat", () => {
    it("gives the Himeji Castle owner's units +15% inside their own borders only", () => {
      const player = playerWith();
      const city = cityOf(player, ["Himeji Castle"]);
      const foreignCity = cityOf(playerWith(), []);

      expect(BuildingEffects.getTerritoryCombatModifiers(player, ownedTile(city, "grass"))).toEqual([
        { label: "Himeji Castle", value: 0.15 }
      ]);
      expect(BuildingEffects.getTerritoryCombatModifiers(player, ownedTile(foreignCity, "grass"))).toEqual([]);
      expect(BuildingEffects.getTerritoryCombatModifiers(player, tileOf("grass"))).toEqual([]);
    });

    it("gives the Statue of Zeus owner's units +15% attacking cities", () => {
      const player = playerWith();
      cityOf(player, ["Statue of Zeus"]);

      expect(BuildingEffects.getCityAttackModifiers(player)).toEqual([{ label: "Statue of Zeus", value: 0.15 }]);
      expect(BuildingEffects.getCityAttackModifiers(playerWith())).toEqual([]);
    });
  });

  describe("Great Wall", () => {
    const unitOf = (player: Player, domain = "land") =>
      ({ getPlayer: () => player, getDomain: () => domain }) as unknown as Unit;

    it("costs an enemy land unit 1 extra move on each tile of its builder's territory", () => {
      const enemy = playerWith();
      const owner = playerWith({ atWarWith: [enemy] });
      const tile = ownedTile(cityOf(owner, ["Great Wall"]), "grass");

      expect(BuildingEffects.getEnemyMovementCost(tile, unitOf(enemy))).toBe(1);
      expect(BuildingEffects.getEnemyMovementCost(tile, unitOf(enemy, "sea"))).toBe(0);
      expect(BuildingEffects.getEnemyMovementCost(tile, unitOf(owner))).toBe(0);
    });

    it("leaves units of a civilization at peace alone", () => {
      const neighbor = playerWith();
      const owner = playerWith();
      const tile = ownedTile(cityOf(owner, ["Great Wall"]), "grass");

      expect(BuildingEffects.getEnemyMovementCost(tile, unitOf(neighbor))).toBe(0);
    });
  });

  it("makes borders 25% cheaper in every city of the Angkor Wat owner", () => {
    const player = playerWith();
    expect(BuildingEffects.getBorderCost(20, player)).toBe(20);

    cityOf(player, ["Angkor Wat"]);
    expect(BuildingEffects.getBorderCost(20, player)).toBe(15);
  });

  describe("tooltip text", () => {
    const linesFor = (name: string) => BuildingEffectText.describe(Building.createFromName(name).getEffects());

    it.each([
      ["Library", ["+1 Science per 2 citizens"]],
      ["Market", ["+25% Gold"]],
      ["Temple of Artemis", ["+10% Food in all cities"]],
      ["Aqueduct", ["Keeps 40% of its Food after growing"]],
      ["Lighthouse", ["+1 Food on Sea tiles"]],
      ["Petra", ["+1 Food and +1 Production on Desert tiles (not Floodplains)"]],
      ["Stables", ["+1 Production on Horses, Sheep and Cattle", "+15% Production toward mounted units"]],
      ["Great Pyramids", ["2 free Builders", "Builders work 25% faster"]],
      ["Statue of Zeus", ["A free Spearman", "+15% Combat Strength for units attacking cities"]],
      ["Great Library", ["A free Technology"]],
      ["Alhambra", ["+20% Culture", "A free Castle in the city", "The Drill I promotion for land units trained here"]],
      ["Barracks", ["+15 XP for land units trained here"]],
      ["Angkor Wat", ["Borders grow with 25% less Culture in all cities"]],
      ["Monument", []]
    ])("describes %s", (name, lines) => {
      expect(linesFor(name)).toEqual(lines);
    });

    it("sends the lines, and the effects not in the game yet, with the building", () => {
      expect(Building.createFromName("Market").toJSON().effect_lines).toEqual(["+25% Gold"]);
      expect(Building.createFromName("Oracle").toJSON().not_yet).toEqual(["A free Social Policy"]);
      expect(Building.createFromName("Monument").toJSON()).not.toHaveProperty("effect_lines");
      expect(Building.createFromName("Monument").toJSON()).not.toHaveProperty("not_yet");
    });
  });
});
