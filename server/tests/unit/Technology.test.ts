import { Technology } from '../../src/research/Technology';

// Deliberately not mocking fs/yaml - exercises the real config/techs.yml,
// same approach as Building.test.ts.
describe('Technology', () => {
  it('creates a Technology from a known name, case-insensitively', () => {
    const technology = Technology.createFromName('pottery');

    expect(technology).toBeDefined();
    expect(technology.getName()).toBe('Pottery');
    expect(technology.getCost()).toBe(35);
  });

  it('returns undefined for an unrecognized technology name', () => {
    expect(Technology.createFromName('Nonexistent')).toBeUndefined();
  });

  it('loads every technology, including tech-gated ones with prerequisites', () => {
    const technologies = Technology.getAllTechnologies();

    expect(technologies).toHaveLength(30);

    // Matches Civ5's actual root set - everything else requires "Agriculture"
    // (a free starting tech this config doesn't model), so these four are the
    // only ones with no modeled prerequisites at all.
    const rootTechs = technologies.filter((tech) => tech.getPrerequisites().length === 0);
    expect(rootTechs.map((tech) => tech.getName()).sort()).toEqual(
      ['Animal Husbandry', 'Archery', 'Mining', 'Pottery']
    );
  });

  it('has every prerequisite reference a technology that actually exists in the config', () => {
    const technologies = Technology.getAllTechnologies();
    const names = new Set(technologies.map((tech) => tech.getName()));

    for (const technology of technologies) {
      for (const prerequisite of technology.getPrerequisites()) {
        expect(names.has(prerequisite)).toBe(true);
      }
    }
  });

  it('round-trips through toJSON back to the wire shape', () => {
    const technology = Technology.createFromName('Pottery');

    expect(technology.toJSON()).toEqual({
      name: 'Pottery',
      asset_name: 'BUILDING_GRANARY',
      cost: 35,
      prerequisites: [],
      description: 'Enables long-term storage of food and materials.',
      slot: 1,
      row: 0,
    });
  });

  it('gives every technology a slot within the 10-column grid, unique within its own row', () => {
    const technologies = Technology.getAllTechnologies();
    const slotsByRow = new Map<number, number[]>();

    for (const technology of technologies) {
      expect(technology.getSlot()).toBeGreaterThanOrEqual(0);
      expect(technology.getSlot()).toBeLessThanOrEqual(9);

      const slots = slotsByRow.get(technology.getRow()) ?? [];
      slots.push(technology.getSlot());
      slotsByRow.set(technology.getRow(), slots);
    }

    for (const slots of slotsByRow.values()) {
      expect(new Set(slots).size).toBe(slots.length);
    }
  });

  it('places every technology in a row strictly after all of its prerequisites', () => {
    const technologies = Technology.getAllTechnologies();
    const techByName = new Map(technologies.map((tech) => [tech.getName(), tech]));

    for (const technology of technologies) {
      for (const prerequisiteName of technology.getPrerequisites()) {
        const prerequisite = techByName.get(prerequisiteName)!;
        expect(technology.getRow()).toBeGreaterThan(prerequisite.getRow());
      }
    }
  });
});
