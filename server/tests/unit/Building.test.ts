import { Building } from '../../src/city/Building';

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
});
