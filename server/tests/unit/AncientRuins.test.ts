import random from 'random';
import { AncientRuins } from '../../src/map/AncientRuins';
import { Barbarians } from '../../src/barbarian/Barbarians';
import { GameMap } from '../../src/map/GameMap';
import { Tile } from '../../src/map/Tile';
import { Player } from '../../src/Player';
import { Game } from '../../src/Game';
import { Unit } from '../../src/unit/Unit';
import { ServerEvents } from '../../src/Events';
import { WebSocket } from 'ws';

const MAP_SIZE = 20;

// A real GameMap over an all-grass grid, without running terrain generation.
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

describe('AncientRuins', () => {
  let map: GameMap;
  let players: Map<string, Player>;
  let human: Player;

  const tileAt = (x: number, y: number) => map.getTiles()[x][y];
  const ruins = () => AncientRuins.getInstance();
  const hasRuins = (tile: Tile) => tile.containsTileType(AncientRuins.TILE_TYPE);
  const allRuinTiles = () => map.getTiles().flat().filter(hasRuins);

  const placeUnit = (name: string, tile: Tile, player: Player) => {
    const unit = Unit.createFromName(name, tile, player);
    tile.addUnit(unit);
    return unit;
  };

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

    AncientRuins.destroyInstance();
    Barbarians.destroyInstance();
  });

  afterEach(() => {
    ServerEvents.clear();
    jest.restoreAllMocks();
  });

  describe('placement', () => {
    it('scatters ruins over the land at game start, spaced apart', () => {
      AncientRuins.init();

      const placed = allRuinTiles();
      const spacing = AncientRuins.getConfig().min_distance_between_ruins;

      expect(placed.length).toBeGreaterThan(0);
      expect(placed.length).toBeLessThanOrEqual(ruins().getRuinCount());
      for (const tile of placed) {
        const tooClose = map.getTilesInRange(tile, spacing - 1).filter((other) => other !== tile && hasRuins(other));
        expect(tooClose).toEqual([]);
      }
    });

    it('keeps its distance from the players\' starting units', () => {
      placeUnit('Settler', tileAt(10, 10), human);

      AncientRuins.init();

      const minDistance = AncientRuins.getConfig().min_distance_from_players;
      expect(map.getTilesInRange(tileAt(10, 10), minDistance - 1).filter(hasRuins)).toEqual([]);
      expect(allRuinTiles().length).toBeGreaterThan(0);
    });

    it('never goes on water, mountains, resources or barbarian camps', () => {
      AncientRuins.init();
      allRuinTiles().forEach((tile) => tile.removeTileType(AncientRuins.TILE_TYPE));

      tileAt(10, 10).clearTileTypes();
      tileAt(10, 10).addTileType('ocean');
      tileAt(4, 4).clearTileTypes();
      tileAt(4, 4).addTileType('mountain');
      tileAt(4, 15).addTileType('sheep');
      tileAt(15, 4).addTileType(Barbarians.CAMP_TILE_TYPE);

      expect(ruins().canPlaceRuins(tileAt(10, 10))).toBe(false);
      expect(ruins().canPlaceRuins(tileAt(4, 4))).toBe(false);
      expect(ruins().canPlaceRuins(tileAt(4, 15))).toBe(false);
      expect(ruins().canPlaceRuins(tileAt(15, 4))).toBe(false);
      expect(ruins().canPlaceRuins(tileAt(15, 15))).toBe(true);
    });
  });

  describe('exploring', () => {
    let ruinTile: Tile;
    let approachTile: Tile;

    beforeEach(() => {
      AncientRuins.init();
      allRuinTiles().forEach((tile) => tile.removeTileType(AncientRuins.TILE_TYPE));

      ruinTile = tileAt(10, 10);
      ruinTile.addTileType(AncientRuins.TILE_TYPE);
      approachTile = ruinTile.getAdjacentTiles().find((tile) => tile !== null);
    });

    it('removes the ruins and gives gold to a unit that walks in', () => {
      const warrior = placeUnit('Warrior', approachTile, human);
      const addMessage = jest.spyOn(human.getNotifications(), 'addMessage');

      warrior.stepTowards(ruinTile);

      expect(warrior.getTile()).toBe(ruinTile);
      expect(hasRuins(ruinTile)).toBe(false);
      expect(human.getAccumulatedStats().gold).toBe(AncientRuins.getConfig().gold_reward);
      expect(addMessage).toHaveBeenCalledWith('TILE_ANCIENT_RUINS', expect.stringContaining('gold'));
    });

    it('can be explored by a civilian too', () => {
      const settler = placeUnit('Settler', approachTile, human);

      settler.stepTowards(ruinTile);

      expect(hasRuins(ruinTile)).toBe(false);
      expect(human.getAccumulatedStats().gold).toBe(AncientRuins.getConfig().gold_reward);
    });

    it('only pays out once', () => {
      const warrior = placeUnit('Warrior', approachTile, human);

      warrior.stepTowards(ruinTile);
      ServerEvents.call('unitMoved', { unit: warrior, tile: ruinTile });

      expect(human.getAccumulatedStats().gold).toBe(AncientRuins.getConfig().gold_reward);
    });

    it('is ignored by barbarians', () => {
      jest.spyOn(random, 'float').mockReturnValue(1);
      Barbarians.init();
      const barbarian = placeUnit('Warrior', approachTile, Barbarians.getInstance().getPlayer());

      barbarian.stepTowards(ruinTile);

      expect(barbarian.getTile()).toBe(ruinTile);
      expect(hasRuins(ruinTile)).toBe(true);
    });
  });
});
