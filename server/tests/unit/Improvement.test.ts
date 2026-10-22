import { Improvement, ImprovementData } from '../../src/map/Improvement';
import { Tile } from '../../src/map/Tile';
import { Unit } from '../../src/unit/Unit';
import { Player } from '../../src/Player';
import { City } from '../../src/city/City';

describe('Improvement', () => {
  const player = (techs: string[] = []) =>
    ({ hasResearchedTech: (tech: string) => techs.includes(tech) }) as unknown as Player;
  const allTechs = player(['Animal Husbandry', 'Mining', 'Calendar', 'Trapping', 'Masonry', 'The Wheel', 'Construction', 'Bronze Working', 'Iron Working', 'Guilds']);

  const tileOf = (...tileTypes: string[]) => {
    const tile = new Tile(tileTypes[0], 0, 0);
    tileTypes.slice(1).forEach((type) => tile.addTileType(type));
    return tile;
  };
  const improvement = (name: string) => Improvement.getImprovementData(name) as ImprovementData;
  // The tile sits in `owner`'s territory - the Builder's own unless said otherwise, and nobody's for null.
  const buildable = (tile: Tile, builder = allTechs, owner: Player | null = builder) => {
    tile.setCityTerritoryOf((owner ? { getPlayer: () => owner } : undefined) as unknown as City);

    return Improvement.getBuildableImprovementData()
      .filter((data) => Improvement.canBuild(data, tile, builder))
      .map((data) => data.name);
  };

  it('offers a farm, trading post and road on open grassland', () => {
    expect(buildable(tileOf('grass'))).toEqual(['Farm', 'Trading Post', 'Road']);
  });

  it('only offers a farm before any tech is researched', () => {
    expect(buildable(tileOf('grass'), player())).toEqual(['Farm']);
  });

  it('adds a mine to a plain hill', () => {
    expect(buildable(tileOf('grass_hill'))).toContain('Mine');
  });

  it("only offers a resource's own improvement on a resource tile", () => {
    expect(buildable(tileOf('grass', 'cattle'))).toEqual(['Pasture', 'Road']);
    expect(buildable(tileOf('plains_hill', 'iron'))).toEqual(['Mine', 'Road']);
  });

  it("treats a resource the Builder's civilization hasn't revealed yet as plain land", () => {
    const withoutIronWorking = player(['Mining']);
    const tile = tileOf('plains_hill', 'iron');

    expect(buildable(tile, withoutIronWorking)).toEqual(buildable(tileOf('plains_hill'), withoutIronWorking));

    // The Mine goes on top, and the Iron under it shows up once Iron Working is in.
    Improvement.complete(improvement('Mine'), tile, withoutIronWorking);
    expect(tile.getTileTypes()).toEqual(['plains_hill', 'iron', 'mine']);
  });

  it('needs forest cleared before a farm, but builds a trading post, lumber mill or plantation among the trees', () => {
    expect(buildable(tileOf('grass', 'forest'))).toEqual(['Trading Post', 'Road', 'Lumber Mill', 'Remove Forest']);
    expect(buildable(tileOf('grass', 'citrus', 'jungle'))).toEqual(['Plantation', 'Road', 'Remove Jungle']);
    expect(buildable(tileOf('grass', 'jungle'))).toEqual(['Trading Post', 'Road', 'Remove Jungle']);
  });

  it('only builds roads and clears trees outside any borders', () => {
    expect(buildable(tileOf('grass'), allTechs, null)).toEqual(['Road']);
    expect(buildable(tileOf('grass', 'forest'), allTechs, null)).toEqual(['Road', 'Remove Forest']);
  });

  it("builds nothing in another civilization's territory", () => {
    expect(buildable(tileOf('grass', 'forest'), allTechs, player())).toEqual([]);
  });

  it('builds nothing on water or mountains', () => {
    expect(buildable(tileOf('ocean'))).toEqual([]);
    expect(buildable(tileOf('mountain'))).toEqual([]);
  });

  it('turns a resource into its improved tile type', () => {
    const tile = tileOf('grass', 'cattle');
    Improvement.complete(improvement('Pasture'), tile);

    expect(tile.getTileTypes()).toEqual(['grass', 'improved_cattle']);
    expect(tile.getImprovement()).toBe('Pasture');
    expect(tile.getTotalStatValue(['food'])).toBe(3);
    expect(tile.getTotalStatValue(['production'])).toBe(1);
  });

  it('needs a marsh drained before anything but a road or a Camp on Truffles, once Masonry is in', () => {
    expect(buildable(tileOf('grass', 'marsh'))).toEqual(['Road', 'Remove Marsh']);
    expect(buildable(tileOf('grass', 'marsh'), player(['Masonry']))).toEqual(['Remove Marsh']);
    expect(buildable(tileOf('grass', 'truffles', 'marsh'), player(['Trapping']))).toEqual(['Camp']);

    const tile = tileOf('grass', 'marsh');
    Improvement.complete(improvement('Remove Marsh'), tile);
    expect(tile.getTileTypes()).toEqual(['grass']);
    expect(buildable(tile)).toContain('Farm');
  });

  it('builds a Mine on Salt, Silver and Gems, and a Plantation on Wine, Incense and Bananas', () => {
    const cases: [string[], string, string][] = [
      [['desert', 'salt'], 'Mine', 'salt_mine'],
      [['tundra', 'silver'], 'Mine', 'silver_mine'],
      [['plains', 'gems'], 'Mine', 'gems_mine'],
      [['grass', 'wine'], 'Plantation', 'wine_plantation'],
      [['desert', 'incense'], 'Plantation', 'incense_plantation'],
      [['grass', 'bananas', 'jungle'], 'Plantation', 'banana_plantation']
    ];
    for (const [types, name, improved] of cases) {
      const tile = tileOf(...types);
      expect(buildable(tile)).toContain(name);
      expect(buildable(tile)).not.toContain(name === 'Mine' ? 'Plantation' : 'Mine');

      Improvement.complete(improvement(name), tile);
      expect(tile.getTileTypes()).toEqual(types.map((type) => (type === types[1] ? improved : type)));
      expect(Improvement.getImprovedResource(tile)).toBe(types[1]);
    }
  });

  it('builds nothing but a road on an oasis', () => {
    expect(buildable(tileOf('desert', 'oasis'))).toEqual(['Road']);
  });

  it('builds a Camp on Deer, Bison, Ivory, Furs and Truffles once Trapping is in, keeping the trees', () => {
    expect(buildable(tileOf('grass', 'deer', 'forest'))).toEqual(['Camp', 'Road', 'Remove Forest']);
    expect(buildable(tileOf('grass', 'truffles', 'jungle'))).toEqual(['Camp', 'Road', 'Remove Jungle']);
    expect(buildable(tileOf('plains', 'bison'), player(['Animal Husbandry']))).toEqual([]);

    for (const resource of ['deer', 'bison', 'ivory', 'furs', 'truffles']) {
      const tile = tileOf('plains', resource);
      expect(buildable(tile)).toEqual(['Camp', 'Road']);

      Improvement.complete(improvement('Camp'), tile);
      expect(tile.getTileTypes()).toEqual(['plains', `${resource}_camp`]);
      expect(tile.getImprovement()).toBe('Camp');
      expect(Improvement.getImprovedResource(tile)).toBe(resource);
    }
  });

  it('farms wheat on plains and flood plains, turning it into improved wheat', () => {
    expect(buildable(tileOf('plains', 'wheat'), player())).toEqual(['Farm']);
    expect(buildable(tileOf('floodplains', 'wheat'))).toEqual(['Farm', 'Road']);

    const tile = tileOf('plains', 'wheat');
    expect(tile.getTotalStatValue(['food'])).toBe(2);
    Improvement.complete(improvement('Farm'), tile);

    expect(tile.getTileTypes()).toEqual(['plains', 'improved_wheat']);
    expect(tile.getImprovement()).toBe('Farm');
    expect(tile.getTotalStatValue(['food'])).toBe(3);
    expect(tile.getTotalStatValue(['production'])).toBe(1);
    expect(buildable(tile)).toEqual(['Road']);
  });

  it("adds a farm's food and stops another improvement going on top", () => {
    const tile = tileOf('grass');
    Improvement.complete(improvement('Farm'), tile);

    expect(tile.getTotalStatValue(['food'])).toBe(3);
    expect(buildable(tile)).toEqual(['Road']);
  });

  it('keeps a road alongside an improvement', () => {
    const tile = tileOf('grass');
    Improvement.complete(improvement('Road'), tile);

    expect(tile.hasRoad()).toBe(true);
    expect(tile.getImprovement()).toBeUndefined();
    expect(buildable(tile)).toEqual(['Farm', 'Trading Post']);
  });

  it('clears the forest off a tile', () => {
    const tile = tileOf('grass', 'forest');
    Improvement.complete(improvement('Remove Forest'), tile);

    expect(tile.getTileTypes()).toEqual(['grass']);
    expect(buildable(tile)).toContain('Farm');
  });

  it('describes every removal job as Removing, not Building', () => {
    for (const data of Improvement.getAllImprovementData().filter((data) => data.removes_feature)) {
      expect(data.status).toMatch(/^Removing /);
    }
  });

  it('keeps build progress per improvement until cleared', () => {
    const tile = tileOf('grass');
    tile.addBuildProgress('Farm');

    expect(tile.addBuildProgress('Farm')).toBe(2);
    expect(tile.getBuildProgress('Road')).toBe(0);
    tile.clearBuildProgress('Farm');
    expect(tile.getBuildProgress('Farm')).toBe(0);
  });

  describe('Fishing Boats', () => {
    const sailor = player(['Sailing']);
    const seaBuildable = (tile: Tile, builder = sailor, owner: Player | null = builder) => {
      tile.setCityTerritoryOf((owner ? { getPlayer: () => owner } : undefined) as unknown as City);

      return Improvement.getBuildableImprovementData('sea')
        .filter((data) => Improvement.canBuild(data, tile, builder))
        .map((data) => data.name);
    };

    it('go on every sea resource in your own waters once you have Sailing', () => {
      for (const resource of ['fish', 'crab', 'whales', 'turtles', 'pearls']) {
        expect(seaBuildable(tileOf('shallow_ocean', resource))).toEqual(['Fishing Boats']);
      }
      expect(seaBuildable(tileOf('shallow_ocean', 'fish'), player())).toEqual([]);
    });

    it('need a resource, your own borders, and no Fishing Boats there already', () => {
      expect(seaBuildable(tileOf('shallow_ocean'))).toEqual([]);
      expect(seaBuildable(tileOf('shallow_ocean', 'fish'), sailor, null)).toEqual([]);
      expect(seaBuildable(tileOf('shallow_ocean', 'fish'), sailor, player())).toEqual([]);

      const improved = tileOf('shallow_ocean', 'fish');
      Improvement.complete(improvement('Fishing Boats'), improved);
      expect(seaBuildable(improved)).toEqual([]);
    });

    it('turn the resource into its improved tile', () => {
      const tile = tileOf('shallow_ocean', 'pearls');
      Improvement.complete(improvement('Fishing Boats'), tile);

      expect(tile.getTileTypes()).toEqual(['shallow_ocean', 'improved_pearls']);
      expect(tile.getImprovement()).toBe('Fishing Boats');
    });

    it("aren't offered to a Builder, and a Work Boat gets nothing else", () => {
      expect(buildable(tileOf('shallow_ocean', 'fish'), player(['Sailing']))).toEqual([]);
      expect(Improvement.getBuildableImprovementData('sea').map((data) => data.name)).toEqual(['Fishing Boats']);
    });
  });

  describe('roads', () => {
    it('cost a third of a move between two road tiles, ignoring terrain', () => {
      const from = tileOf('grass', 'road');
      const to = tileOf('grass_hill', 'forest', 'road');

      expect(Tile.getWeight(from, to)).toBeCloseTo(1 / 3);
      expect(Tile.getWeight(from, tileOf('grass_hill'))).toBe(2);
    });

    it('let a unit take exactly three road steps per move', () => {
      let movement = 2;
      for (let step = 0; step < 6; step++) movement = Unit.spendMovement(movement, Tile.ROAD_MOVEMENT_COST);

      expect(movement).toBe(0);
    });
  });

  describe('railroads', () => {
    const railroadTech = player(['The Wheel', 'Railroad']);

    it('are offered once Railroad is researched, and lay a road along with the rails', () => {
      const tile = tileOf('grass');
      expect(buildable(tile, railroadTech)).toContain('Railroad');
      expect(buildable(tile)).not.toContain('Railroad');

      Improvement.complete(improvement('Railroad'), tile, railroadTech);

      expect(tile.containsTileType('railroad')).toBe(true);
      expect(tile.hasRoad()).toBe(true);
      expect(buildable(tile, railroadTech)).not.toContain('Road');
      expect(buildable(tile, railroadTech)).not.toContain('Railroad');
    });

    it('cost a tenth of a move between two railroad tiles, a third onto a plain road', () => {
      const from = tileOf('grass', 'road', 'railroad');

      expect(Tile.getWeight(from, tileOf('grass_hill', 'road', 'railroad'))).toBeCloseTo(1 / 10);
      expect(Tile.getWeight(from, tileOf('grass', 'road'))).toBeCloseTo(1 / 3);
    });

    it('let a unit take exactly ten railroad steps per move', () => {
      let movement = 1;
      for (let step = 0; step < 9; step++) movement = Unit.spendMovement(movement, Tile.RAILROAD_MOVEMENT_COST);
      expect(movement).toBeGreaterThan(0);

      expect(Unit.spendMovement(movement, Tile.RAILROAD_MOVEMENT_COST)).toBe(0);
    });
  });
});
