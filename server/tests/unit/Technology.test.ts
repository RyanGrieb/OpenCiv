import { Building } from '../../src/city/Building';
import { Improvement } from '../../src/map/Improvement';
import { Technology } from '../../src/research/Technology';
import { Unit } from '../../src/unit/Unit';
import { ConfigLoader } from '../../src/util/ConfigLoader';

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
      notes: [],
      unlocks: {
        units: [],
        buildings: [
          { name: 'Chapel', asset_name: 'BUILDING_CHAPEL' },
          { name: 'Granary', asset_name: 'BUILDING_GRANARY' },
          { name: 'Shrine', asset_name: 'BUILDING_SHRINE' },
        ],
        wonders: [],
        improvements: [],
      },
      slot: 1,
      row: 0,
    });
  });

  it('lists what a tech unlocks from the unit, building and improvement configs', () => {
    expect(Technology.getUnlocks('Animal Husbandry')).toEqual({
      units: [{ name: 'Caravan', asset_name: 'UNIT_CARAVAN' }],
      buildings: [],
      wonders: [],
      improvements: [{ name: 'Pasture', asset_name: 'ICON_EMPTY_PASTURE' }],
    });

    const construction = Technology.getUnlocks('Construction');
    expect(construction.units.map((unit) => unit.name)).toEqual(['Composite Bowman']);
    expect(construction.buildings.map((building) => building.name)).toEqual(['Colosseum']);
    expect(construction.wonders.map((wonder) => wonder.name)).toEqual(['Terracotta Army']);
    expect(construction.improvements.map((improvement) => improvement.name)).toEqual(['Lumber Mill']);
  });

  it('lists a unique unit only for its own civ, in place of the unit it replaces', () => {
    const ironWorkingUnits = (civName?: string) =>
      Technology.getUnlocks('Iron Working', civName).units.map((unit) => unit.name);

    expect(ironWorkingUnits('Rome')).toEqual(['Legion']);
    expect(ironWorkingUnits('Germany')).toEqual(['Swordsman']);
    expect(ironWorkingUnits()).toEqual(['Swordsman']);
  });

  it('points every obsolete_tech, unique_to and replaces at a tech, civ and unit that exist', () => {
    const techNames = new Set(Technology.getAllTechnologies().map((tech) => tech.getName()));
    const unitNames = new Set(Unit.getAllUnitData().map((unit) => unit.name));
    const civNames = new Set(
      ConfigLoader.load<{ civilizations: { name: string }[] }>('./config/civilizations.yml').civilizations.map(
        (civ) => civ.name
      )
    );

    for (const unit of Unit.getAllUnitData()) {
      if (unit.obsolete_tech) expect(techNames).toContain(unit.obsolete_tech);
      if (unit.unique_to) expect(civNames).toContain(unit.unique_to);
      if (unit.replaces) expect(unitNames).toContain(unit.replaces);
    }
  });

  it('only gates units, buildings and improvements behind technologies that exist', () => {
    const unlocked = Technology.getAllTechnologies().flatMap((tech) => {
      const unlocks = Technology.getUnlocks(tech.getName());
      return [...unlocks.units, ...unlocks.buildings, ...unlocks.wonders, ...unlocks.improvements];
    });

    // Every gated entry must land under some tech - a typo'd required_tech would silently vanish from the window.
    const requiredTechs = [
      // A unique unit only shows for its own civ, which this list isn't asked for.
      ...Unit.getAllUnitData()
        .filter((unit) => !unit.unique_to)
        .map((unit) => unit.required_tech),
      ...Building.getAllBuildings().map((building) => building.getRequiredTech()),
      // Clearing forest or jungle isn't an improvement, so the window leaves those out.
      ...Improvement.getAllImprovementData()
        .filter((improvement) => !improvement.removes_feature)
        .map((improvement) => improvement.required_tech),
    ];
    const gatedCount = requiredTechs.filter((tech) => tech).length;
    expect(unlocked).toHaveLength(gatedCount);
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
