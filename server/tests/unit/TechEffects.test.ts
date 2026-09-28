import { City } from '../../src/city/City';
import { Tile } from '../../src/map/Tile';
import { Player } from '../../src/Player';
import { TechEffects } from '../../src/research/TechEffects';
import { Technology } from '../../src/research/Technology';

// Real config files throughout: map_resources.yml's reveal_tech and techs.yml's tile_bonuses.
describe('TechEffects', () => {
  const player = (...techs: string[]) =>
    ({ hasResearchedTech: (tech: string) => techs.includes(tech) }) as unknown as Player;

  const tileOf = (...tileTypes: string[]) => {
    const tile = new Tile(tileTypes[0], 0, 0);
    tileTypes.slice(1).forEach((type) => tile.addTileType(type));
    return tile;
  };
  const ownedBy = (tile: Tile, owner: Player) => {
    tile.setCityTerritoryOf({ getPlayer: () => owner } as unknown as City);
    return tile;
  };
  const yieldsOf = (tile: Tile, viewer?: Player) => {
    const stats: Record<string, number> = Object.assign({}, ...tile.getStats(viewer));
    return Object.fromEntries(Object.entries(stats).filter(([, value]) => value !== 0));
  };

  describe('revealing strategic resources', () => {
    it.each([
      ['horses', 'Animal Husbandry'],
      ['iron', 'Iron Working']
    ])('hides %s until %s', (resource, tech) => {
      expect(TechEffects.isResourceHidden(resource, player())).toBe(true);
      expect(TechEffects.isResourceHidden(resource, player(tech))).toBe(false);
    });

    it('never hides a bonus or luxury resource', () => {
      expect(TechEffects.isResourceHidden('wheat', player())).toBe(false);
      expect(TechEffects.isResourceHidden('cotton', player())).toBe(false);
    });

    it('gives no yield for a resource the player cannot see yet', () => {
      const tile = tileOf('plains_hill', 'iron');

      expect(yieldsOf(tile, player())).toEqual({ production: 2 });
      expect(yieldsOf(tile, player('Iron Working'))).toEqual({ production: 3 });
    });

    it('leaves a hidden resource out of the tile sent to that player', () => {
      const tile = tileOf('grass', 'horses');

      expect(tile.getTileJSON({ observer: player() }).tileTypes).toEqual(['grass']);
      expect(tile.getTileJSON({ observer: player('Animal Husbandry') }).tileTypes).toEqual(['grass', 'horses']);
    });

    it('goes by the owner when no player is named', () => {
      const tile = ownedBy(tileOf('plains_hill', 'iron'), player());

      expect(yieldsOf(tile)).toEqual({ production: 2 });
    });
  });

  describe("Civil Service's fresh-water farms", () => {
    const riverFarm = () => {
      const tile = tileOf('grass', 'farm');
      jest.spyOn(tile, 'hasRiver').mockReturnValue(true);
      return tile;
    };

    it('adds 1 food to a farm on a river once Civil Service is in', () => {
      expect(yieldsOf(riverFarm(), player())).toEqual({ food: 3 });
      expect(yieldsOf(riverFarm(), player('Civil Service'))).toEqual({ food: 4 });
    });

    it('counts a lake next to the farm as fresh water', () => {
      const farm = tileOf('grass', 'farm');
      farm.setAdjacentTile(2, tileOf('freshwater'));

      expect(yieldsOf(farm, player('Civil Service'))).toEqual({ food: 4 });
    });

    it('leaves a dry farm alone', () => {
      expect(yieldsOf(tileOf('grass', 'farm'), player('Civil Service'))).toEqual({ food: 3 });
    });

    it('only boosts farms', () => {
      const tile = tileOf('grass');
      jest.spyOn(tile, 'hasRiver').mockReturnValue(true);

      expect(yieldsOf(tile, player('Civil Service'))).toEqual({ food: 2 });
    });

    it('marks the tiles a tech changes, so they get resent', () => {
      expect(TechEffects.changesTile('Civil Service', riverFarm())).toBe(true);
      expect(TechEffects.changesTile('Civil Service', tileOf('grass', 'farm'))).toBe(false);
      expect(TechEffects.changesTile('Iron Working', tileOf('grass', 'iron'))).toBe(true);
      expect(TechEffects.changesTile('Iron Working', tileOf('grass', 'horses'))).toBe(false);
    });
  });

  describe('roads across rivers', () => {
    const riverRoad = () => {
      const from = tileOf('grass', 'road');
      const to = tileOf('grass', 'road');
      from.setAdjacentTile(0, to);
      from.getRiverSides()[0] = true;
      return [from, to];
    };

    it('only bridge a river once the player has Engineering', () => {
      const [from, to] = riverRoad();

      expect(Tile.roadCarriesAcross(from, to, player())).toBe(false);
      expect(Tile.roadCarriesAcross(from, to, player('Engineering'))).toBe(true);
    });

    it('need no Engineering where no river runs between the tiles', () => {
      const from = tileOf('grass', 'road');
      const to = tileOf('grass', 'road');
      from.setAdjacentTile(0, to);

      expect(Tile.roadCarriesAcross(from, to, player())).toBe(true);
    });
  });

  it('gives every tech in the tree something to unlock or do', () => {
    const techsWithEffects = new Set(Technology.getAllTileBonuses().map((entry) => entry.techName));
    techsWithEffects.add(Tile.BRIDGE_TECH);

    for (const tech of Technology.getAllTechnologies()) {
      const unlocks = Technology.getUnlocks(tech.getName());
      const unlockCount = Object.values(unlocks).reduce((total, list) => total + list.length, 0);

      expect({ tech: tech.getName(), doesSomething: unlockCount > 0 || techsWithEffects.has(tech.getName()) }).toEqual({
        tech: tech.getName(),
        doesSomething: true
      });
    }
  });
});
