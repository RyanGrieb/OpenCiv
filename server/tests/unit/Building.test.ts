import { Building } from '../../src/city/Building';
import { Technology } from '../../src/research/Technology';

// Deliberately not mocking fs/yaml - exercises the real config/buildings.yml,
// same as City.ts's original getBuildingDataByName did (never covered by
// City.test.ts, since applyFoundingBonuses is only reachable via
// announceCreated(), which that suite never calls).
describe('Building', () => {
  it('creates a Building from a known name, case-insensitively', () => {
    const building = Building.createFromName('palace');

    expect(building).toBeDefined();
    expect(building.getName()).toBe('Palace');
  });

  it('flattens the YAML stats array into a stat-line dictionary', () => {
    const building = Building.createFromName('Palace');

    expect(building.getStatLine()).toEqual({
      science: 3,
      production: 3,
      gold: 2,
      defense: 2,
      culture: 1,
    });
  });

  it('returns undefined for an unrecognized building name', () => {
    expect(Building.createFromName('Nonexistent')).toBeUndefined();
  });

  it('is not a wonder unless the config says so', () => {
    const building = Building.createFromName('Palace');

    expect(building.isWonderBuilding()).toBe(false);
  });

  it('round-trips through toJSON back to the wire shape, omitting is_wonder when false', () => {
    const building = Building.createFromName('Palace');

    expect(building.toJSON()).toEqual({
      name: 'Palace',
      asset_name: 'BUILDING_PALACE',
      stats: [
        { science: 3 },
        { production: 3 },
        { gold: 2 },
        { defense: 2 },
        { culture: 1 },
      ],
    });
  });

  it('reconstructs an equivalent Building from its own toJSON output', () => {
    const original = Building.createFromName('Palace');
    const roundTripped = new Building(original.toJSON());

    expect(roundTripped.getStatLine()).toEqual(original.getStatLine());
    expect(roundTripped.getName()).toBe(original.getName());
  });

  describe('getAllBuildings', () => {
    it('includes every building the config knows about', () => {
      const names = Building.getAllBuildings().map((building) => building.getName());

      expect(names).toEqual(expect.arrayContaining(['Palace', 'Monument', 'Granary', 'Great Library', 'Walls']));
    });

    it('exposes cost and required_tech for a tech-gated building', () => {
      const granary = Building.getAllBuildings().find((building) => building.getName() === 'Granary');

      expect(granary.getCost()).toBe(40);
      expect(granary.getRequiredTech()).toBe('Pottery');
    });

    it('leaves cost and required_tech undefined for a building never offered through production', () => {
      const palace = Building.getAllBuildings().find((building) => building.getName() === 'Palace');

      expect(palace.getCost()).toBeUndefined();
      expect(palace.getRequiredTech()).toBeUndefined();
    });

    it('flags wonders', () => {
      const buildings = Building.getAllBuildings();

      expect(buildings.find((b) => b.getName() === 'Great Library').isWonderBuilding()).toBe(true);
      expect(buildings.find((b) => b.getName() === 'Granary').isWonderBuilding()).toBe(false);
    });

    it('has every required_tech reference a technology that actually exists in techs.yml', () => {
      const techNames = new Set(Technology.getAllTechnologies().map((tech) => tech.getName()));

      for (const building of Building.getAllBuildings()) {
        const requiredTech = building.getRequiredTech();
        if (requiredTech) {
          expect(techNames.has(requiredTech)).toBe(true);
        }
      }
    });
  });
});
