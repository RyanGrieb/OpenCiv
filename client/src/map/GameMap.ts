import { Game } from "../Game";
import { RemoveUnitEvent, Unit, UnitCreationData } from "../Unit";
import { NetworkEvents, WebsocketClient } from "../network/Client";
import { Actor } from "../scene/Actor";
import { River } from "./River";
import { Road } from "./Road";
import { Tile, TileYieldsData } from "./Tile";
import { Line } from "../scene/Line";
import PriorityQueue from "ts-priority-queue";
import { AbstractPlayer } from "../player/AbstractPlayer";
import { City } from "../city/City";
import { TileOutline } from "./TileOutline";
import { Vector } from "../util/Vector";
import { MapWrap } from "./MapWrap";
import { FogOfWarLayer } from "./FogOfWarLayer";

// width/height/x/y/movementCost arrive as strings and are run through parseInt() below.
interface MapSizeEvent {
  width: string;
  height: string;
  // Whether the server made the east and west edges adjacent - see GameOptions.wrapMap.
  wrap?: boolean;
}

interface TileYieldsEvent {
  yields: TileYieldsData;
}

interface TileData {
  tileTypes: string[];
  riverSides: boolean[];
  units: UnitCreationData[];
  x: string;
  y: string;
  movementCost: string;
  yields?: any[];
  city?: CityData;
  // Whether the sending player currently sees this tile, vs. only remembering it from earlier -
  // see PlayerVisibility on the server. Absent only means "yes" (pre-fog callers, tests).
  visible?: boolean;
}

// A tile's coordinates are always sent as chunk-grouped batches - the initial map sync and every
// later reveal both arrive shaped this way. See GameMap.sendTileChunk() on the server.
interface MapChunkEvent {
  tiles: TileData[];
  chunkX: number;
  chunkY: number;
}

interface FogTilesEvent {
  tiles: { x: number; y: number }[];
}

interface CityData {
  tileX: number;
  tileY: number;
  player: string;
  cityName: string;
  territory: { tileX: number; tileY: number }[];
  workedTiles?: { x: number; y: number }[];
  health: number;
  maxHealth: number;
  strength: number;
}

interface TileUpdatedEvent {
  tile: TileData;
}

export class GameMap {
  private static instance: GameMap;

  // Tiles are streamed in from the server in square batches this many tiles across - must match
  // the server's MAP_CHUNK_SIZE (server/src/GameOptions.ts). No shared package to import it from.
  private static readonly CHUNK_SIZE = 4;
  private static readonly CHUNK_PIXEL_WIDTH = 32 * GameMap.CHUNK_SIZE + 16;
  private static readonly CHUNK_PIXEL_HEIGHT = 25 * GameMap.CHUNK_SIZE + 7;

  private oddEdgeAxis = [
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 0]
  ];
  private evenEdgeAxis = [
    [-1, -1],
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 1],
    [-1, 0]
  ];

  private tiles: Tile[][];
  private mapWidth: number;
  private mapHeight: number;
  private previousGScore: number[][];
  private previousFScore: number[][];
  private tileOutlines: Map<Tile, TileOutline[]>;

  // Merged per-chunk actors currently in the scene, keyed by "chunkGridX,chunkGridY" - replaced
  // wholesale by rebuildChunkVisuals() whenever anything in that chunk changes (a tile is
  // discovered, or one already known flips visible/fogged).
  private baseLayerChunks: Map<string, Actor> = new Map();
  private topLayerChunks: Map<string, Actor> = new Map();

  // The soft-edged fog over the whole map - created once the map's size is known.
  private fogOfWar: FogOfWarLayer;

  // Every chunk-visual rebuild goes through this queue rather than running concurrently - they all
  // share the same offscreen canvas (see Tile.generateImageFromTileTypes / Actor.mergeActors), and
  // fog reveals can now trigger many of these in quick succession during ordinary play, not just
  // once at map load.
  private renderQueue: Promise<void> = Promise.resolve();

  // Chunk packets ingested since the last "mapSyncComplete" - awaited there so "mapLoaded" only
  // fires once every tile, unit and city from the initial sync actually exists.
  private pendingChunkIngestions: Promise<void>[] = [];

  // Shared between the mapChunk-embedded units and the live "createUnit"
  // event so the same unit is never constructed twice, regardless of which
  // path sees its id first.
  private knownUnitIds: Set<number> = new Set();

  // Cities this client knows about, keyed "tileX,tileY" of the city's center tile. A city arrives
  // again with every territory tile revealed, so it's built once and then kept up to date - see
  // syncCity().
  private knownCities: Map<string, City> = new Map();

  public static getInstance() {
    return this.instance;
  }

  /**
   * Initializes the GameMap singleton object, starts a map request to the server.
   */
  public static init() {
    GameMap.instance = new GameMap();
    // No wrapping until this game's mapSize says otherwise, so the last game's can't carry over.
    MapWrap.init(0, 0, false);
    this.instance.requestMapFromServer();
    this.instance.requestTileYieldsFromServer();
  }

  private constructor() {
    this.previousGScore = undefined;
    this.previousFScore = undefined;
    this.tileOutlines = new Map<Tile, TileOutline[]>();

    NetworkEvents.on<CityData>({
      eventName: "newCity",
      parentObject: this,
      callback: (data) => {
        this.syncCity(data);
      }
    });

    // A city's borders grew (see server City.sendTerritoryUpdate()).
    NetworkEvents.on<CityData>({
      eventName: "cityTerritoryUpdated",
      parentObject: this,
      callback: (data) => {
        this.syncCity(data);
      }
    });

    // A melee unit took the city (see server City.captureBy()): it's rebuilt in its new owner's colors.
    NetworkEvents.on<CityData>({
      eventName: "cityCaptured",
      parentObject: this,
      callback: (data) => {
        const key = `${data.tileX},${data.tileY}`;
        this.knownCities.get(key)?.remove();
        this.knownCities.delete(key);
        this.syncCity(data);
      }
    });

    // Whenever a tile's yield-affecting state changes server-side (settling a city,
    // and eventually tile improvements too), the server resends that tile's JSON so
    // the hover tooltip doesn't keep showing whatever was in the initial mapChunk
    // snapshot - see GameMap.broadcastTileUpdate() on the server.
    NetworkEvents.on<TileUpdatedEvent>({
      eventName: "tileUpdated",
      parentObject: this,
      callback: (data) => {
        const gridX = parseInt(data.tile.x);
        const gridY = parseInt(data.tile.y);
        const tile = this.tiles[gridX]?.[gridY];
        if (!tile) return;

        tile.setYields(data.tile.yields);

        // A finished improvement changes what's drawn - and a road also changes its neighbors' spokes.
        if (JSON.stringify(tile.getTileTypes()) === JSON.stringify(data.tile.tileTypes)) return;
        tile.setTileTypes(data.tile.tileTypes);
        this.redrawMap([tile, ...tile.getAdjacentTiles().filter(Boolean)]);
      }
    });

    // A unit created after the initial mapChunk fetch (e.g. one finished by
    // production) has no other way to reach the client - dedupe by id
    // against knownUnitIds since nothing guarantees this can't race a
    // still-in-flight mapChunk response.
    NetworkEvents.on<UnitCreationData>({
      eventName: "createUnit",
      parentObject: this,
      callback: (data) => {
        if (this.knownUnitIds.has(data.id)) return;

        // Map not built yet: the mapChunk snapshot will include this unit.
        const tile = this.tiles[data.tileX]?.[data.tileY];
        if (!tile) return;

        this.knownUnitIds.add(data.id);
        const unit = new Unit(tile, data);
        tile.addUnit(unit);
        Game.getInstance().getCurrentScene().addActor(unit);
      }
    });

    NetworkEvents.on<RemoveUnitEvent>({
      eventName: "removeUnit",
      parentObject: this,
      callback: (data) => {
        const unitTile = GameMap.getInstance().getTiles()[data.unitX]?.[data.unitY];
        const unit = unitTile?.getUnitByID(data.id);
        if (!unit) return;

        //FIXME: Tell client player to stop drawing lines.
        unit.unselect();
        unitTile.removeUnit(unit);
        this.forgetUnit(unit);
      }
    });
  }

  // Common teardown for a unit this client no longer tracks - a genuine removal (death, upgrade)
  // or a fog reveal taking it back. Drops it from bookkeeping and the scene, and unregisters its
  // NetworkEvents listeners so a stale instance can't react if the same unit id resurfaces later
  // under a freshly-constructed Unit.
  private forgetUnit(unit: Unit) {
    this.knownUnitIds.delete(unit.getID());
    if (unit.getPlayer()) {
      unit.getPlayer().removeUnit(unit);
    }
    NetworkEvents.removeCallbacksByParentObject(unit);
    Game.getInstance().getCurrentScene().removeActor(unit);
  }

  public getTiles() {
    return this.tiles;
  }

  public getFogOfWar(): FogOfWarLayer {
    return this.fogOfWar;
  }

  public getWidth() {
    return this.mapWidth;
  }

  public getHeight() {
    return this.mapHeight;
  }

  /**
   * Returns an array of adjacent tiles to the given grid coordinates.
   * @param {number} gridX - The x coordinate of the tile on the grid.
   * @param {number} gridY - The y coordinate of the tile on the grid.
   * @returns {Tile[]} An array of adjacent tiles to the given grid coordinates.
   */
  public getAdjacentTiles(gridX: number, gridY: number): Tile[] {
    const adjTiles: Tile[] = [];
    let edgeAxis: number[][];
    if (gridY % 2 == 0) edgeAxis = this.evenEdgeAxis;
    else edgeAxis = this.oddEdgeAxis;

    for (let i = 0; i < edgeAxis.length; i++) {
      // Only x wraps - the north and south edges stay the poles.
      let edgeX = MapWrap.wrapGridX(gridX + edgeAxis[i][0]);
      let edgeY = gridY + edgeAxis[i][1];

      if (edgeX < 0 || edgeY == -1 || edgeX > this.mapWidth - 1 || edgeY > this.mapHeight - 1) {
        continue;
      }
      adjTiles.push(this.tiles[edgeX][edgeY]);
    }

    return adjTiles;
  }

  // https://en.wikipedia.org/wiki/A*_search_algorithm
  public constructShortestPath(unit: Unit, startTile: Tile, goalTile: Tile) {
    if (!startTile || !goalTile) return [];

    //TODO: Maybe we get the distance of the last path & apply it to h? Since it's just going to be a single tile off from the previous.
    let h = (n: Tile) => Math.floor(Tile.gridDistance(n, goalTile));

    // For node n, gScore[n] is the cost of the cheapest path from start to n currently known.
    let gScore: number[][] = [];
    let fScore: number[][] = [];
    let cameFrom: Tile[][] = [];

    for (let x = 0; x < this.getWidth(); x++) {
      gScore[x] = [];
      fScore[x] = [];
      cameFrom[x] = [];
      for (let y = 0; y < this.getHeight(); y++) {
        gScore[x][y] = Number.MAX_VALUE;
        fScore[x][y] = 0;

        if (this.previousGScore || this.previousFScore) {
          //gScore = this.previousGScore; // Use previous gScore value
          //fScore = this.previousFScore; // Use previous fScore value
        }
      }
    }

    gScore[startTile.getGridX()][startTile.getGridY()] = 0;
    // For node n, fScore[n] := gScore[n] + h(n). fScore[n] represents our current best guess as to
    // how cheap a path could be from start to finish if it goes through n.
    fScore[startTile.getGridX()][startTile.getGridY()] = h(startTile);

    // Openset is a pirority queue of tiles w/ the lowerest fscore
    // fscore[myTile.getNodeIndex()]
    let openSet = new PriorityQueue({
      comparator: (a: Tile, b: Tile) => {
        const fscoreA = fScore[a.getGridX()][a.getGridY()];
        const fscoreB = fScore[b.getGridX()][b.getGridY()];

        if (fscoreA < fscoreB) {
          return -1; // a should have higher priority (lower fscore)
        } else if (fscoreA > fscoreB) {
          return 1; // b should have higher priority (lower fscore)
        } else {
          return 0; // fscoreA and fscoreB are equal
        }
      },
      initialValues: [startTile]
    });

    //cameFrom.fill(undefined, 0, totalNodes);

    while (openSet.length > 0) {
      let currentTile = openSet.dequeue();

      if (currentTile == goalTile) {
        this.previousGScore = gScore;
        this.previousFScore = fScore;
        return this.reconstructPath(unit, cameFrom, currentTile);
      }

      // Unknown tiles (undiscovered - never linked as an adjacent tile in the first place, see
      // linkTileAdjacency()) simply never appear here, so a path can never be routed through fog.
      for (let neighborTile of currentTile.getAdjacentTiles()) {
        if (!neighborTile) continue;

        let d = (current: Tile, neighbor: Tile) => unit.getTileWeight(current, neighbor);

        let tentativeGScore = gScore[currentTile.getGridX()][currentTile.getGridY()] + d(currentTile, neighborTile);
        //console.log(neighborTile.getNodeIndex());
        //console.log(gScore[neighborTile.getNodeIndex()]);

        if (tentativeGScore < gScore[neighborTile.getGridX()][neighborTile.getGridY()]) {
          cameFrom[neighborTile.getGridX()][neighborTile.getGridY()] = currentTile;
          gScore[neighborTile.getGridX()][neighborTile.getGridY()] = tentativeGScore;
          fScore[neighborTile.getGridX()][neighborTile.getGridY()] = tentativeGScore + h(neighborTile);

          //if (!QueueUtils.valuePresent(openSet, neighborTile)) {
          openSet.queue(neighborTile);
          //}
        }
      }
    }

    return [];
  }

  private reconstructPath(unit: Unit, cameFrom: Tile[][], currentTile: Tile) {
    const totalPath = [currentTile];
    let movementCost = 0;

    movementCost += unit.getTileWeight(currentTile, undefined);

    while (currentTile != undefined) {
      currentTile = cameFrom[currentTile.getGridX()][currentTile.getGridY()];
      if (currentTile) {
        totalPath.unshift(currentTile);

        movementCost += unit.getTileWeight(currentTile, undefined);
      }
    }

    //FIXME: This may break pathing on large maps
    if (movementCost >= 9999) {
      return [];
    }

    // Mirrors the server: A* still finds an expensive "path" across water for a land unit, or land for a ship.
    if (totalPath.slice(1).some((tile) => !unit.canEnter(tile))) return [];

    // A blocked tile can't be entered, and blocked routes are no longer queued, so the goal is
    // simply unreachable. Occupancy isn't reflected in movementCost above (that would treat the
    // unit's own tile as self-blocking), so it has to be checked separately here: tiles along the
    // way only need to be passable (same-type allies can be walked through), the goal must be free.
    const goalIndex = totalPath.length - 1;
    const blocked = totalPath.some((tile, index) => {
      if (index === 0) return false;
      return index === goalIndex ? tile.isBlockedFor(unit) : tile.isImpassableFor(unit);
    });
    if (blocked) {
      return [];
    }

    return totalPath;
  }

  private requestTileYieldsFromServer() {
    WebsocketClient.sendMessage({ event: "requestTileYields" });
    NetworkEvents.on<TileYieldsEvent>({
      eventName: "tileYields",
      parentObject: this,
      callback: (data) => {
        console.log("Received tile yields from server.");
        console.log(data);
        Tile.setTileYields(data.yields);
      }
    });
  }

  private requestMapFromServer() {
    this.tiles = [];

    WebsocketClient.sendMessage({ event: "requestMap" });

    NetworkEvents.on<MapSizeEvent>({
      eventName: "mapSize",
      parentObject: this,
      callback: (data) => {
        this.mapWidth = parseInt(data.width);
        this.mapHeight = parseInt(data.height);

        MapWrap.init(this.mapWidth, Tile.WIDTH, data.wrap ?? false);

        const scene = Game.getInstance().getCurrentScene();
        scene.removeActor(this.fogOfWar);
        this.fogOfWar = new FogOfWarLayer(this.mapWidth, this.mapHeight, MapWrap.isWrapped());
        scene.addActor(this.fogOfWar);

        this.tiles = [];
        for (let x = 0; x < this.mapWidth; x++) {
          this.tiles[x] = [];
        }
      }
    });

    // A chunk packet only ever carries tiles the sending player has discovered - which tiles those
    // are, and whether each is currently visible or only remembered, is entirely up to fog of war
    // (see PlayerVisibility on the server). This same event covers both the initial map sync and
    // any later reveal, so this is the one place tiles enter the client's map.
    NetworkEvents.on<MapChunkEvent>({
      eventName: "mapChunk",
      parentObject: this,
      callback: (data) => {
        this.pendingChunkIngestions.push(
          this.enqueueRender(() => this.ingestChunkTiles(data.chunkX, data.chunkY, data.tiles))
        );
      }
    });

    // Marks the end of the initial map sync - its own event rather than a flag on the last chunk,
    // since a player can legitimately start the game having discovered too few tiles to fill even
    // one chunk. Waits for every chunk ingested so far (tiles, units, cities all included) before
    // declaring the map loaded.
    NetworkEvents.on({
      eventName: "mapSyncComplete",
      parentObject: this,
      callback: async () => {
        await Promise.all(this.pendingChunkIngestions);
        this.pendingChunkIngestions = [];
        Game.getInstance().getCurrentScene().call("mapLoaded");
      }
    });

    // A tile this player had discovered fell out of sight. Its terrain is still remembered (the
    // client simply keeps showing it, dimmed), but anything that was standing on it is forgotten -
    // never this player's own units, since their own sight always covers a tile they occupy.
    NetworkEvents.on<FogTilesEvent>({
      eventName: "fogTiles",
      parentObject: this,
      callback: (data) => {
        // Only the fog layer changes: the chunk art underneath is the same remembered terrain.
        this.enqueueRender(async () => {
          for (const coord of data.tiles) {
            const tile = this.tiles[coord.x]?.[coord.y];
            if (!tile) continue;

            tile.setVisible(false);
            this.fogOfWar?.setTileState(coord.x, coord.y, FogOfWarLayer.FOGGED);

            for (const unit of [...tile.getUnits()]) {
              tile.removeUnit(unit);
              this.forgetUnit(unit);
            }
          }
        });
      }
    });
  }

  /**
   * Folds a batch of discovered tiles into the client's map: creates any tile the client doesn't
   * already know about (linking it into the adjacency graph as it goes), updates the rest in
   * place, then rebuilds that chunk's visuals and spawns whatever units/cities the batch revealed.
   */
  private async ingestChunkTiles(chunkGridX: number, chunkGridY: number, tileList: TileData[]) {
    const scene = Game.getInstance().getCurrentScene();
    const pendingUnits: { tile: Tile; unitJSON: UnitCreationData }[] = [];
    const pendingCities: CityData[] = [];

    for (const tileJSON of tileList) {
      const gridX = parseInt(tileJSON.x);
      const gridY = parseInt(tileJSON.y);
      const tileTypes = tileJSON.tileTypes;
      const movementCost = parseInt(tileJSON.movementCost);
      const visible = tileJSON.visible ?? true;

      let tile = this.tiles[gridX]?.[gridY];

      if (!tile) {
        let yPos = gridY * 25;
        let xPos = gridX * 32;
        if (gridY % 2 != 0) {
          xPos += 16;
        }

        tile = new Tile({
          tileTypes: tileTypes,
          riverSides: tileJSON.riverSides,
          x: xPos,
          y: yPos,
          gridX: gridX,
          gridY: gridY,
          movementCost: movementCost,
          yields: tileJSON.yields
        });

        this.tiles[gridX][gridY] = tile;
        this.linkTileAdjacency(tile);
      } else {
        tile.setTileTypes(tileTypes);
        tile.setYields(tileJSON.yields);
      }

      tile.setVisible(visible);
      this.fogOfWar?.setTileState(gridX, gridY, visible ? FogOfWarLayer.VISIBLE : FogOfWarLayer.FOGGED);

      // Any tile within a city's territory carries that city's data (see server Tile.getTileJSON),
      // not just its center - a "city" tileType only ever appears on the center tile itself.
      if (tileJSON.city) {
        pendingCities.push(tileJSON.city);
      }

      for (const unitJSON of tileJSON.units) {
        pendingUnits.push({ tile, unitJSON });
      }
    }

    await this.rebuildChunkVisuals(chunkGridX, chunkGridY);

    for (const cityJSON of pendingCities) {
      this.syncCity(cityJSON);
    }

    for (const { tile, unitJSON } of pendingUnits) {
      if (this.knownUnitIds.has(unitJSON.id)) continue;
      this.knownUnitIds.add(unitJSON.id);

      const unit = new Unit(tile, unitJSON);
      tile.addUnit(unit);
      scene.addActor(unit);
    }
  }

  /**
   * Folds a city's data into the client, from "newCity" or from any tile in its territory carrying
   * it. A city is built the first time it's heard of - with only as much of its territory as this
   * player has discovered, and without its center tile if that hasn't been scouted yet. Called
   * again for every later reveal, which is what grows the borders a tile at a time and eventually
   * attaches the center.
   */
  private syncCity(cityJSON: CityData) {
    const key = `${cityJSON.tileX},${cityJSON.tileY}`;
    const centerTile = this.tiles[cityJSON.tileX]?.[cityJSON.tileY];
    const territory = this.getKnownTiles(cityJSON.territory.map((coord) => [coord.tileX, coord.tileY]));

    const existingCity = this.knownCities.get(key);
    if (existingCity) {
      existingCity.setTerritory(territory);
      existingCity.setCenterTile(centerTile);
      return;
    }

    // Nothing to draw yet - no center tile and no discovered territory. Can't happen today (a
    // city only ever reaches this client attached to a tile it just discovered), but it would
    // leave an invisible, nameless city actor lying around.
    if (!centerTile && territory.length < 1) return;

    const city = this.getCityFromJSONData(cityJSON, centerTile, territory);
    this.knownCities.set(key, city);
    Game.getInstance().getCurrentScene().addActor(city);

    WebsocketClient.sendMessage({ event: "requestCityStats", cityName: city.getName() });
  }

  // Whichever of the given coordinates this client has actually discovered.
  private getKnownTiles(coords: [number, number][]): Tile[] {
    const tiles: Tile[] = [];
    for (const [x, y] of coords) {
      const tile = this.tiles[x]?.[y];
      if (tile) tiles.push(tile);
    }
    return tiles;
  }

  /**
   * Links a freshly-created tile to whichever of its 6 neighbors already exist, and fixes up those
   * neighbors' own adjacency arrays to point back at it. A neighbor that hasn't been discovered yet
   * is simply left unlinked - not "null", since it may well exist once revealed later, at which
   * point ITS creation performs the same bidirectional fixup pointing back at this tile.
   */
  private linkTileAdjacency(tile: Tile) {
    const gridX = tile.getGridX();
    const gridY = tile.getGridY();
    const edgeAxis = gridY % 2 == 0 ? this.evenEdgeAxis : this.oddEdgeAxis;

    for (let i = 0; i < edgeAxis.length; i++) {
      // Only x wraps - the north and south edges stay the poles.
      const edgeX = MapWrap.wrapGridX(gridX + edgeAxis[i][0]);
      const edgeY = gridY + edgeAxis[i][1];

      if (edgeX < 0 || edgeY < 0 || edgeX > this.mapWidth - 1 || edgeY > this.mapHeight - 1) {
        tile.setAdjacentTile(i, null);
        continue;
      }

      // Undiscovered neighbors are still filled in as null rather than left as a hole: callers
      // walk all 6 edges expecting an entry for each (GameMap.drawBorder's every() would otherwise
      // skip the holes and mistake a partly-fogged border tile for an interior one, losing its
      // outline). The bidirectional fixup below replaces this null once the neighbor arrives.
      const neighbor = this.tiles[edgeX]?.[edgeY] ?? null;

      tile.setAdjacentTile(i, neighbor);
      if (neighbor) neighbor.setAdjacentTile(GameMap.oppositeEdgeIndex(i), tile);
    }
  }

  // The hex edge directly across from a given one - true regardless of row parity, since edges
  // (unlike the offset-coordinate axis deltas above) are a parity-independent property of the
  // hexagon. Mirrors the river-side "oppositeSides" table on the server's Tile.setRiverSide().
  private static oppositeEdgeIndex(index: number): number {
    return (index + 3) % 6;
  }

  /**
   * Rebuilds one chunk's merged base (terrain + rivers) and top (resources/city/improvements) actors
   * from scratch, from whatever this client currently knows about that chunk's 16 cells. Called
   * whenever a tile in the chunk is newly discovered or changes visibility - safe to call
   * repeatedly since it always derives the result fresh rather than patching the previous one.
   */
  private async rebuildChunkVisuals(chunkGridX: number, chunkGridY: number) {
    const scene = Game.getInstance().getCurrentScene();
    const chunkKey = this.chunkKeyFor(chunkGridX, chunkGridY);

    const baseRenderTiles: Tile[] = [];
    const riverActors: River[] = [];
    const topRenderActors: Actor[] = [];

    for (let dx = 0; dx < GameMap.CHUNK_SIZE; dx++) {
      for (let dy = 0; dy < GameMap.CHUNK_SIZE; dy++) {
        const gridX = chunkGridX + dx;
        const gridY = chunkGridY + dy;
        if (gridX >= this.mapWidth || gridY >= this.mapHeight) continue;

        const tile = this.tiles[gridX]?.[gridY];
        if (!tile) continue; // Undiscovered - nothing drawn, so the background shows through.

        let xPosRelative = dx * 32;
        const yPosRelative = dy * 25;
        if (dy % 2 != 0) {
          xPosRelative += 16;
        }

        const tileTypes = tile.getTileTypes();

        // Rendering-only tiles, positioned relative to this chunk's own small canvas rather than
        // the tile's real world position - mirrors how Actor.mergeActors draws each input actor at
        // its own (x,y) onto the shared offscreen canvas, then the merged result is repositioned
        // as a whole via setPosition() below.
        const baseRenderTile = new Tile({
          tileTypes: [Tile.getVariantTileType(tileTypes[0], gridX, gridY)],
          riverSides: tile.getRiverSides(),
          x: xPosRelative,
          y: yPosRelative,
          gridX: gridX,
          gridY: gridY,
          movementCost: tile.getMovementCost()
        });
        await baseRenderTile.loadImage();
        baseRenderTiles.push(baseRenderTile);

        if (baseRenderTile.hasRiver()) {
          for (const side of baseRenderTile.getNumberedRiverSides()) {
            riverActors.push(new River({ tile: baseRenderTile, side: side }));
          }
        }

        // A road runs over a farm's fields but under trees, resources and their improvements, as on old_java.
        const overlayTypes = tileTypes.slice(1);
        const underRoad = overlayTypes.filter((type) => Tile.UNDER_ROAD_TILE_TYPES.includes(type));
        const overRoad = overlayTypes.filter((type) => !Tile.UNDER_ROAD_TILE_TYPES.includes(type));
        topRenderActors.push(
          ...(await this.createOverlayTile(tile, underRoad, xPosRelative, yPosRelative)),
          ...Road.createActors(tile, xPosRelative, yPosRelative),
          ...(await this.createOverlayTile(tile, overRoad, xPosRelative, yPosRelative))
        );
      }
    }

    const previousBase = this.baseLayerChunks.get(chunkKey);
    if (previousBase) scene.removeActor(previousBase);

    if (baseRenderTiles.length > 0) {
      const bottomLayerActor = Actor.mergeActors({
        actors: [...baseRenderTiles, ...riverActors],
        spriteRegion: false,
        canvasWidth: GameMap.CHUNK_PIXEL_WIDTH,
        canvasHeight: GameMap.CHUNK_PIXEL_HEIGHT
      });
      bottomLayerActor.setPosition(chunkGridX * 32, chunkGridY * 25);
      // Explicit so the fog layer (z 1) reliably sorts above the map: an undefined z doesn't compare.
      bottomLayerActor.setZValue(0);
      scene.addActor(bottomLayerActor);
      this.baseLayerChunks.set(chunkKey, bottomLayerActor);
    } else {
      this.baseLayerChunks.delete(chunkKey);
    }

    const previousTop = this.topLayerChunks.get(chunkKey);
    if (previousTop) scene.removeActor(previousTop);

    if (topRenderActors.length > 0) {
      const topLayerMerged = Actor.mergeActors({
        actors: topRenderActors,
        spriteRegion: false,
        canvasWidth: GameMap.CHUNK_PIXEL_WIDTH,
        canvasHeight: GameMap.CHUNK_PIXEL_HEIGHT
      });
      topLayerMerged.setPosition(chunkGridX * 32, chunkGridY * 25);
      topLayerMerged.setZValue(0);
      scene.addActor(topLayerMerged);
      this.topLayerChunks.set(chunkKey, topLayerMerged);
    } else {
      this.topLayerChunks.delete(chunkKey);
    }
  }

  // The given tile types of a tile drawn as one image at (x, y) on a chunk's canvas - none if empty.
  private async createOverlayTile(tile: Tile, tileTypes: string[], x: number, y: number): Promise<Tile[]> {
    if (tileTypes.length === 0) return [];

    const overlay = new Tile({
      tileTypes,
      x,
      y,
      gridX: tile.getGridX(),
      gridY: tile.getGridY(),
      movementCost: tile.getMovementCost()
    });
    await overlay.loadImage();
    return [overlay];
  }

  // Serializes chunk-visual work through one queue: these all share the same offscreen canvas
  // (Actor.mergeActors, Tile.generateImageFromTileTypes), so two rebuilds racing on it would
  // corrupt each other's output. A failed render is swallowed so it can't wedge the queue.
  private enqueueRender(task: () => Promise<void>): Promise<void> {
    const result = this.renderQueue.then(task);
    this.renderQueue = result.catch(() => {});
    return result;
  }

  private chunkKeyFor(gridX: number, gridY: number): string {
    const chunkGridX = Math.floor(gridX / GameMap.CHUNK_SIZE) * GameMap.CHUNK_SIZE;
    const chunkGridY = Math.floor(gridY / GameMap.CHUNK_SIZE) * GameMap.CHUNK_SIZE;
    return `${chunkGridX},${chunkGridY}`;
  }

  private static parseChunkKey(key: string): [number, number] {
    const [chunkGridX, chunkGridY] = key.split(",").map(Number);
    return [chunkGridX, chunkGridY];
  }

  public drawBorder(tiles: Tile[], color: string, z?: number) {
    // Create outline from the outer border tiles.

    //1. Get outter tiles
    // Condition: At least 1 adj tile is NOT in tiles list.
    const outerTiles: Tile[] = tiles.filter((tile) => {
      return !tile.getAdjacentTiles().every((adjTile) => tiles.includes(adjTile));
    });

    //2. Apply outline to the outer tiles. We want to only apply outlines on the exterior
    // So the edges e.g. [0,1,1,0,0,0] cannot include a tile from tiles
    for (const tile of outerTiles) {
      const outlineEdges = [0, 0, 0, 0, 0, 0];
      for (let i = 0; i < 6; i++) {
        const adjTile = tile.getAdjacentTiles()[i];

        if (adjTile && tiles.includes(adjTile)) {
          continue;
        }

        let index = i;

        outlineEdges[index] = 1;
      }

      this.setOutline({
        tile: tile,
        edges: outlineEdges,
        thickness: 1,
        color: color,
        cityOutline: true,
        z: z
      });
    }
  }

  /**
   * BUG: If we hover inside a city territory, then place an adjacent city, we remove city lines improperly, causing no effect to occur.
   */
  public removeOutline(options: { tile: Tile; cityOutline: boolean }) {
    const outlines = this.tileOutlines.get(options.tile);

    if (!outlines) return;

    for (const outline of [...outlines]) {
      if (outline.cityOutline && !options.cityOutline) continue;

      Game.getInstance().getCurrentScene().removeLine(outline.line);
      outlines.splice(outlines.indexOf(outline), 1); // Remove outline from list (NO CITY OUTLINES EVER!!! UNLESS SPECIFIED)

      // Reset any outlines effected by this outline
      for (const [_, effectedOutlines] of outline.getEffectedOutlines().entries()) {
        for (const effectedOutline of effectedOutlines) {
          effectedOutline.line.setZValue(2);
          effectedOutline.line.setToOriginalPositions();
        }
      }
    }

    if (outlines.length < 1) {
      //console.log(
      //  `Deleting tile from this.tileOutlines: (${options.tile.getGridX()},${options.tile.getGridY()})`
      //);
      this.tileOutlines.delete(options.tile);
    }
  }

  public drawUnitSelectionOutline(tile: Tile, color: string, z: number = 3) {
    GameMap.getInstance().setOutline({
      tile: tile,
      edges: [1, 1, 1, 1, 1, 1],
      thickness: 1,
      color: color,
      cityOutline: false,
      z: z
    });
  }

  public setOutline(options: {
    tile: Tile;
    edges: number[];
    thickness: number;
    color: string;
    cityOutline: boolean;
    z?: number;
  }) {
    const tile = options.tile;
    const tileOutlines: TileOutline[] = [];
    const oppositeSides: number[] = [3, 4, 5, 0, 1, 2];

    for (let i = 0; i < 6; i++) {
      if (!options.edges[i]) continue;

      const iNext = i < 5 ? i + 1 : 0;
      let line = new Line({
        color: options.color,
        girth: options.thickness,
        x1: tile.getVectors()[i].x,
        y1: tile.getVectors()[i].y,
        x2: tile.getVectors()[iNext].x,
        y2: tile.getVectors()[iNext].y,
        z: options.z ?? 2
      });

      // Draw non-city outlines closer to the tile
      if (!options.cityOutline) {
        this.setLinePositionCloserToTile(line, tile, 1);
      }

      tileOutlines.push(new TileOutline(line, i, options.cityOutline));
    }

    // Before drawing the new line, check if we have overlapping tile outlines - FROM THE OUTSIDE
    if (options.cityOutline) {
      for (const outline of tileOutlines) {
        const adjTile = tile.getAdjacentTiles()[outline.edge];

        if (this.tileOutlines.has(adjTile)) {
          const oppositeAdjEdge = oppositeSides[outline.edge];

          // If were drawing on the same line
          if (this.isOutlineDrawn(adjTile, oppositeAdjEdge)) {
            //Draw lines closer to parent tile, such that they don't overlap each other. Also reduce girth on both lines
            this.setLinePositionCloserToTile(outline.line, tile, 0.5);

            // Modify adjTile line, and set what effected it (so we can reset it later).
            for (const adjTileOutline of this.tileOutlines.get(adjTile)) {
              if (adjTileOutline.edge === oppositeAdjEdge) {
                const adjLine = adjTileOutline.line;
                adjLine.setZValue(outline.line.getZIndex() + 1);
                this.setLinePositionCloserToTile(adjLine, adjTile, 0.5);
                adjLine.increaseDistance(0.75); //Increase length of line since the adjLine has more distance to cover
                outline.addEffectedOutlines(adjTile, adjTileOutline);
              }
            }
          }
        }
      }
    }

    for (const outline of tileOutlines) {
      Game.getInstance().getCurrentScene().addLine(outline.line);
    }

    // Update our tileOutlines map
    if (this.tileOutlines.has(tile)) {
      this.tileOutlines.get(tile).push(...tileOutlines);
    } else {
      this.tileOutlines.set(tile, tileOutlines);
    }
  }

  private setLinePositionCloserToTile(line: Line, tile: Tile, amount: number) {
    // FIXME: This functions works, but the naming of shiftVectorsAwayFromCenter() is confusing.
    const shiftedTileVectors = Vector.shiftVectorsAwayFromCenter(
      tile.getCenterPosition().x,
      tile.getCenterPosition().y,
      line.getVectors(),
      amount
    );
    line.setPosition({
      x1: shiftedTileVectors[0].x,
      y1: shiftedTileVectors[0].y,
      x2: shiftedTileVectors[1].x,
      y2: shiftedTileVectors[1].y
    });
  }

  private isOutlineDrawn(tile: Tile, edge: number) {
    for (const tileOutline of this.tileOutlines.get(tile)) {
      if (tileOutline.edge === edge) return true;
    }

    return false;
  }

  // Rebuilds the chunk visuals of whichever chunks the given tiles belong to. Kept as the public
  // entry point Tile.setCity() already calls; reimplemented on top of rebuildChunkVisuals() now
  // that the base/top layers are chunked instead of one map-spanning canvas.
  public redrawMap(modifiedTiles: Tile[]): Promise<void> {
    const chunkKeys = new Set<string>();
    for (const tile of modifiedTiles) {
      chunkKeys.add(this.chunkKeyFor(tile.getGridX(), tile.getGridY()));
    }

    return this.enqueueRender(async () => {
      for (const key of chunkKeys) {
        await this.rebuildChunkVisuals(...GameMap.parseChunkKey(key));
      }
    });
  }

  private getCityFromJSONData(data: CityData, centerTile: Tile, territory: Tile[]): City {
    const player = AbstractPlayer.getPlayerByName(data.player);
    const cityName = data.cityName;

    const workedTiles = this.getKnownTiles((data.workedTiles ?? []).map((coord) => [coord.x, coord.y]));
    console.log(`[GameMap] Creating city ${cityName} with ${workedTiles.length} worked tiles.`);

    return new City({
      tile: centerTile,
      territory: territory,
      workedTiles: workedTiles,
      player: player,
      name: cityName,
      health: data.health,
      maxHealth: data.maxHealth,
      strength: data.strength
    });
  }
}
