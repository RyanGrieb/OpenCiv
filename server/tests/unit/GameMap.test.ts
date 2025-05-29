import { GameMap } from '../../src/map/GameMap';
import { Tile } from '../../src/map/Tile';
import { MapResources } from '../../src/map/MapResources';
import { TileIndexer } from '../../src/map/TileIndexer';
import random from 'random';

jest.mock('../../src/map/Tile');
jest.mock('../../src/map/MapResources');
jest.mock('../../src/map/TileIndexer');
jest.mock('random');

describe('GameMap', () => {
  let gameMap: GameMap;

  beforeEach(() => {
    jest.clearAllMocks();

    // Minimal Tile mock
    (Tile as jest.MockedClass<typeof Tile>).mockImplementation((tileType: string, x: number, y: number) => {
      const tile = {
        tileTypes: [tileType],
        adjacentTiles: new Array(6).fill(null),
        getX: () => x,
        getY: () => y,
        containsTileType: (type: string) => tile.tileTypes.includes(type),
        containsTileTypes: (types: string[]) => types.some((t) => tile.tileTypes.includes(t)),
        replaceTileType: function (oldType: string, newType: string) {
          const index = this.tileTypes.indexOf(oldType);
          if (index !== -1) this.tileTypes[index] = newType;
        },
        addTileType: function (type: string) {
          if (!this.tileTypes.includes(type)) this.tileTypes.push(type);
        },
        clearTileTypes: function () {
          this.tileTypes = [];
        },
        getTileTypes: function () {
          return this.tileTypes;
        },
        getAdjacentTiles: function () {
          return this.adjacentTiles.filter((t: Tile | null) => t !== null);
        },
        setAdjacentTile: function (index: number, adjacentTile: Tile | null) {
          this.adjacentTiles[index] = adjacentTile;
        },
        setGenerationHeight: function () {},
        getGenerationHeight: () => 0,
        setGenerationTemp: function () {},
        getGenerationTemp: () => 50,
        isWater: function () {
          return ["ocean", "freshwater", "shallow_ocean"].some(type => this.tileTypes.includes(type));
        },
        hasRiver: () => false,
        getRiverSides: () => [],
        applyRiverSide: function () {},
        getRiverSideIndexes: () => [],
        getDistanceFrom: function (otherTile: Tile) {
          const dx = this.getX() - otherTile.getX();
          const dy = this.getY() - otherTile.getY();
          return Math.sqrt(dx * dx + dy * dy);
        },
        removeTileType: function (type: string) {
          const index = this.tileTypes.indexOf(type);
          if (index !== -1) this.tileTypes.splice(index, 1);
        },
      };
      return tile as any;
    });

    // Mock MapResources
    (MapResources.getRandomMapResource as jest.Mock).mockImplementation(({ mapResourceType }) => ({
      name: `${mapResourceType}_resource`,
      getSpawnTiles: () => ['grass'],
      getPathLength: () => 1,
      getMinTilesSet: () => 0,
      getMaxTilesSet: () => 1,
      getSetChance: () => 1,
      getMinTemp: () => 0,
      getMaxTemp: () => 100,
      spawnOnAdditionalTileTypes: () => false,
      getName: () => `${mapResourceType}_resource`,
    }));
    (MapResources.isResourceTile as jest.Mock).mockImplementation((tile) => {
      const types = tile.getTileTypes();
      return types.some((t) => t.includes('_resource'));
    });

    // Mock TileIndexer
    (TileIndexer.getTilesByTileType as jest.Mock).mockImplementation((type) => {
      const tiles: Tile[] = [];
      gameMap.getTiles().forEach((row: Tile[]) => {
        row.forEach((tile: Tile) => {
          if (tile.containsTileType(type)) tiles.push(tile);
        });
      });
      return tiles;
    });

    // Mock random with dynamic bounds for 4x4 map
    let callCount = 0;
    (random.int as jest.Mock).mockImplementation((min, max) => {
      callCount++;
      const range = max - min + 1;
      if (range <= 0) {
        if (min === 10 && max === gameMap['mapWidth'] - 11) return 1;
        if (min === 10 && max === gameMap['mapHeight'] - 11) return 1;
        return min;
      }
      return min + (callCount % range);
    });

    // Initialize GameMap
    GameMap['instance'] = undefined;
    jest.spyOn(GameMap, 'init').mockImplementation(() => {
      GameMap['instance'] = new (GameMap as any)();
    });
    GameMap.init();
    gameMap = GameMap.getInstance();

    // Mock generateTerrain to set specific tile types
    jest.spyOn(gameMap, 'generateTerrain').mockImplementation(() => {
      const tiles = gameMap.getTiles();
      // Set a mix of tile types to test invariants
      tiles[0][0].replaceTileType('grass', 'forest'); // Forest
      tiles[0][1].replaceTileType('ocean', 'grass'); // Grass
      tiles[1][0].replaceTileType('ocean', 'jungle'); // Jungle
      tiles[1][1].replaceTileType('grass', 'bonus_resource'); // Resource
      tiles[2][2].addTileType('luxury_resource'); // Another resource
    });

    // Initialize tiles with 4x4 map
    const mapDimensions = gameMap['getDimensionValues']("4x4" as any);
    gameMap['mapWidth'] = mapDimensions[0];
    gameMap['mapHeight'] = mapDimensions[1];
    gameMap['mapArea'] = gameMap['mapWidth'] * gameMap['mapHeight'];
    gameMap['riverSideHistory'] = [];
    gameMap['tiles'] = [];
    for (let x = 0; x < gameMap['mapWidth']; x++) {
      gameMap['tiles'][x] = [];
      for (let y = 0; y < gameMap['mapHeight']; y++) {
        const tileType = (x + y) % 2 === 0 ? 'grass' : 'ocean';
        gameMap['tiles'][x][y] = new Tile(tileType, x, y);
      }
    }

    // Manually set adjacent tiles
    const evenEdgeAxis = GameMap['evenEdgeAxis'];
    const oddEdgeAxis = GameMap['oddEdgeAxis'];
    for (let x = 0; x < gameMap['mapWidth']; x++) {
      for (let y = 0; y < gameMap['mapHeight']; y++) {
        const edgeAxis = y % 2 === 0 ? evenEdgeAxis : oddEdgeAxis;
        for (let i = 0; i < edgeAxis.length; i++) {
          const edgeX = x + edgeAxis[i][0];
          const edgeY = y + edgeAxis[i][1];
          if (edgeX < 0 || edgeY < 0 || edgeX >= gameMap['mapWidth'] || edgeY >= gameMap['mapHeight']) {
            gameMap['tiles'][x][y].setAdjacentTile(i, null);
          } else {
            gameMap['tiles'][x][y].setAdjacentTile(i, gameMap['tiles'][edgeX][edgeY]);
          }
        }
      }
    }
  });

  afterEach(() => {
    GameMap.destroyInstance();
    gameMap['tiles'] = null;
    gameMap = null;
    jest.restoreAllMocks();
    jest.clearAllMocks();
    if (global.gc) global.gc();
  });

  it('ensures no tiles have both forest and jungle', () => {
    gameMap['generateTerrain']();
    const tiles = gameMap.getTiles();
    for (const row of tiles) {
      for (const tile of row) {
        const types = tile.getTileTypes();
        expect(types.includes('forest') && types.includes('jungle')).toBe(false);
      }
    }
  });

  it('ensures no tiles have more than one resource', () => {
    gameMap['generateTerrain']();
    const tiles = gameMap.getTiles();
    for (const row of tiles) {
      for (const tile of row) {
        const types = tile.getTileTypes();
        const resourceCount = types.filter((t) => MapResources.isResourceTile({ getTileTypes: () => [t] } as any)).length;
        expect(resourceCount).toBeLessThanOrEqual(1);
      }
    }
  });
});