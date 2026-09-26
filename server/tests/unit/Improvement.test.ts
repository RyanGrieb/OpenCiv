import { Improvement, ImprovementData } from '../../src/map/Improvement';
import { Tile } from '../../src/map/Tile';
import { Unit } from '../../src/unit/Unit';
import { Player } from '../../src/Player';
import { City } from '../../src/city/City';

describe('Improvement', () => {
  const player = (techs: string[] = []) =>
    ({ hasResearchedTech: (tech: string) => techs.includes(tech) }) as unknown as Player;
  const allTechs = player(['Animal Husbandry', 'Mining', 'Calendar', 'Trapping', 'Masonry', 'The Wheel', 'Construction', 'Bronze Working', 'Guilds']);

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
    expect(tile.getTotalStatValue(['production'])).toBe(2);
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

  it('keeps build progress per improvement until cleared', () => {
    const tile = tileOf('grass');
    tile.addBuildProgress('Farm');

    expect(tile.addBuildProgress('Farm')).toBe(2);
    expect(tile.getBuildProgress('Road')).toBe(0);
    tile.clearBuildProgress('Farm');
    expect(tile.getBuildProgress('Farm')).toBe(0);
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
});
