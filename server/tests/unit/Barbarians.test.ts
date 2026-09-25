import random from 'random';
import { Barbarians } from '../../src/barbarian/Barbarians';
import { GameMap } from '../../src/map/GameMap';
import { Tile } from '../../src/map/Tile';
import { Player } from '../../src/Player';
import { Game } from '../../src/Game';
import { Unit } from '../../src/unit/Unit';
import { ServerEvents } from '../../src/Events';
import { WebSocket } from 'ws';

const MAP_SIZE = 20;

// A real GameMap over an all-grass grid, without running terrain generation - so camp placement,
// sight ranges and pathing all run against the real code.
const createMap = () => {
  const map = Object.create(GameMap.prototype);
  map.mapWidth = MAP_SIZE;
  map.mapHeight = MAP_SIZE;
  map.tiles = [];
  for (let x = 0; x < MAP_SIZE; x++) {
    map.tiles[x] = [];
    for (let y = 0; y < MAP_SIZE; y++) {
      map.tiles[x][y] = new Tile('grass', x, y);
    }
  }
  map.initAdjacentTiles();

  return map as GameMap;
};

const createHumanPlayer = (name: string) => {
  const websocket = { on: jest.fn(), send: jest.fn() } as unknown as WebSocket;
  return new Player(name, websocket);
};

describe('Barbarians', () => {
  let map: GameMap;
  let players: Map<string, Player>;
  let human: Player;

  const tileAt = (x: number, y: number) => map.getTiles()[x][y];
  const barbarians = () => Barbarians.getInstance();
  const barbarianUnits = () => barbarians().getPlayer().getUnits();

  beforeEach(() => {
    map = createMap();
    jest.spyOn(GameMap, 'getInstance').mockReturnValue(map);

    players = new Map();
    jest.spyOn(Game, 'getInstance').mockReturnValue({
      getPlayers: () => players,
      getGameOptions: () => ({ revealMap: false })
    } as unknown as Game);

    human = createHumanPlayer('Human');
    players.set(human.getName(), human);

    // No camp appears unless a test places one itself.
    jest.spyOn(random, 'float').mockReturnValue(1);

    Barbarians.destroyInstance();
    // init() places starting camps; clear them so each test places its own.
    Barbarians.init();
    for (const camp of [...barbarians().getCamps()]) {
      camp.tile.removeTileType(Barbarians.CAMP_TILE_TYPE);
      camp.defender?.delete();
    }
    barbarians().getCamps().length = 0;
  });

  afterEach(() => {
    // Drop every listener the test's units and barbarians registered, so none reacts in the next test.
    ServerEvents.clear();
    jest.restoreAllMocks();
  });

  const placeUnit = (name: string, tile: Tile, player: Player) => {
    const unit = Unit.createFromName(name, tile, player);
    tile.addUnit(unit);
    return unit;
  };

  describe('camp placement', () => {
    it('allows open land far from everyone', () => {
      expect(barbarians().canPlaceCamp(tileAt(10, 10))).toBe(true);
    });

    it('never puts a camp on water or mountains', () => {
      tileAt(10, 10).clearTileTypes();
      tileAt(10, 10).addTileType('ocean');
      tileAt(12, 12).clearTileTypes();
      tileAt(12, 12).addTileType('mountain');

      expect(barbarians().canPlaceCamp(tileAt(10, 10))).toBe(false);
      expect(barbarians().canPlaceCamp(tileAt(12, 12))).toBe(false);
    });

    it('keeps its distance from other civilizations\' units', () => {
      placeUnit('Warrior', tileAt(10, 12), human);

      expect(barbarians().canPlaceCamp(tileAt(10, 10))).toBe(false);
      expect(barbarians().canPlaceCamp(tileAt(10, 4))).toBe(true);
    });

    it('keeps its distance from other camps', () => {
      tileAt(10, 12).addTileType(Barbarians.CAMP_TILE_TYPE);

      expect(barbarians().canPlaceCamp(tileAt(10, 10))).toBe(false);
      expect(barbarians().canPlaceCamp(tileAt(10, 4))).toBe(true);
    });

    it('only appears where no civilization can see', () => {
      jest.spyOn(human.getVisibility(), 'isVisible').mockImplementation((tile) => tile === tileAt(10, 10));

      expect(barbarians().canPlaceCamp(tileAt(10, 10))).toBe(false);
      expect(barbarians().canPlaceCamp(tileAt(4, 4))).toBe(true);
    });

    it('places the camp with a barbarian defender standing on it', () => {
      const camp = barbarians().placeCamp();

      expect(camp.tile.containsTileType(Barbarians.CAMP_TILE_TYPE)).toBe(true);
      expect(camp.defender.getPlayer()).toBe(barbarians().getPlayer());
      expect(camp.defender.getTile()).toBe(camp.tile);
      expect(camp.tile.getUnits()).toEqual([camp.defender]);
    });

    it('starts the game with camps already on the map', () => {
      Barbarians.init();

      expect(barbarians().getCamps().length).toBeGreaterThan(0);
      expect(barbarians().getCamps().length).toBeLessThanOrEqual(barbarians().getMaxCamps());
    });

    it('adds camps over time while below the maximum', () => {
      jest.spyOn(random, 'float').mockReturnValue(0);

      barbarians().playTurn();

      expect(barbarians().getCamps()).toHaveLength(1);
    });
  });

  describe('unit choice', () => {
    it('sends Warriors while nobody has better techs', () => {
      expect(barbarians().getSpawnUnitName()).toBe('Warrior');
    });

    it('upgrades once at least half of the players know the tech', () => {
      const other = createHumanPlayer('Other');
      players.set(other.getName(), other);
      jest.spyOn(human, 'hasResearchedTech').mockImplementation((tech) => tech === 'Archery');

      expect(barbarians().getSpawnUnitName()).toBe('Archer');
    });

    it('does not upgrade while fewer than half know it', () => {
      players.set('Other', createHumanPlayer('Other'));
      players.set('Third', createHumanPlayer('Third'));
      jest.spyOn(human, 'hasResearchedTech').mockImplementation((tech) => tech === 'Archery');

      expect(barbarians().getSpawnUnitName()).toBe('Warrior');
    });
  });

  describe('spawning', () => {
    it('sends a unit out next to the camp once its timer runs out, up to the cap', () => {
      const camp = barbarians().placeCamp();

      camp.turnsUntilSpawn = 1;
      barbarians().playTurn();

      expect(camp.roamingUnits).toHaveLength(1);
      expect(barbarianUnits()).toHaveLength(2);

      camp.turnsUntilSpawn = 1;
      barbarians().playTurn();
      camp.turnsUntilSpawn = 1;
      barbarians().playTurn();

      expect(camp.roamingUnits).toHaveLength(2);
      expect(camp.defender.getTile()).toBe(camp.tile);
    });

    it('waits for the timer before spawning', () => {
      const camp = barbarians().placeCamp();

      camp.turnsUntilSpawn = 3;
      barbarians().playTurn();

      expect(camp.roamingUnits).toHaveLength(0);
      expect(camp.turnsUntilSpawn).toBe(2);
    });

    it('replaces a lost defender before sending anyone out', () => {
      const camp = barbarians().placeCamp();
      camp.defender.delete();

      camp.turnsUntilSpawn = 1;
      barbarians().playTurn();

      expect(camp.defender).toBeDefined();
      expect(camp.defender.getTile()).toBe(camp.tile);
      expect(camp.roamingUnits).toHaveLength(0);
    });
  });

  describe('roaming', () => {
    it('closes in on a nearby unit and stops next to it', () => {
      const target = placeUnit('Warrior', tileAt(10, 10), human);
      const raider = placeUnit('Warrior', tileAt(10, 14), barbarians().getPlayer());

      for (let turn = 0; turn < 4; turn++) {
        ServerEvents.call('nextTurn', {});
        barbarians().playTurn();
      }

      expect(target.getTile().getAdjacentTiles()).toContain(raider.getTile());
    });

    it('wanders when nobody is in range', () => {
      const raider = placeUnit('Warrior', tileAt(10, 10), barbarians().getPlayer());

      barbarians().playTurn();

      expect(raider.getTile()).not.toBe(tileAt(10, 10));
    });

    it('leaves the camp defender where it is', () => {
      const camp = barbarians().placeCamp();
      placeUnit('Warrior', camp.tile.getAdjacentTiles()[0].getAdjacentTiles()[0], human);

      barbarians().playTurn();

      expect(camp.defender.getTile()).toBe(camp.tile);
    });
  });

  describe('clearing a camp', () => {
    let camp: ReturnType<Barbarians['placeCamp']>;
    let approachTile: Tile;

    beforeEach(() => {
      camp = barbarians().placeCamp();
      // Stand-in for combat: the defender is gone.
      camp.defender.delete();
      camp.defender = undefined;
      approachTile = camp.tile.getAdjacentTiles().find((tile) => tile !== null);
    });

    it('destroys an unguarded camp a military unit walks into, for gold', () => {
      const warrior = placeUnit('Warrior', approachTile, human);

      warrior.stepTowards(camp.tile);

      expect(barbarians().getCamps()).not.toContain(camp);
      expect(camp.tile.containsTileType(Barbarians.CAMP_TILE_TYPE)).toBe(false);
      expect(human.getAccumulatedStats().gold).toBe(Barbarians.getConfig().camps.clear_reward_gold);
    });

    it('is not cleared by a civilian', () => {
      const settler = placeUnit('Settler', approachTile, human);

      settler.stepTowards(camp.tile);

      expect(barbarians().getCamps()).toContain(camp);
      expect(human.getAccumulatedStats().gold).toBeUndefined();
    });

    it('cannot be entered while the defender holds it', () => {
      camp.defender = placeUnit('Warrior', camp.tile, barbarians().getPlayer());
      const warrior = placeUnit('Warrior', approachTile, human);

      warrior.stepTowards(camp.tile);

      expect(warrior.getTile()).toBe(approachTile);
      expect(barbarians().getCamps()).toContain(camp);
    });
  });

  it('is a player the server runs, with nobody to send packets to', () => {
    const player = barbarians().getPlayer();

    expect(player.hasClient()).toBe(false);
    expect(() => player.sendNetworkEvent({ event: 'test' })).not.toThrow();
    expect(Game.getInstance().getPlayers().has(player.getName())).toBe(false);
  });
});
