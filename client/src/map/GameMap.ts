import { Game } from "../Game";
import { Unit } from "../Unit";
import { NetworkEvents, WebsocketClient } from "../network/Client";
import { Actor } from "../scene/Actor";
import { River } from "./River";
import { Tile } from "./Tile";
import { Line } from "../scene/Line";
import PriorityQueue from "ts-priority-queue";
import { AbstractPlayer } from "../player/AbstractPlayer";
import { City } from "../city/City";
import { TileOutline } from "./TileOutline";
import { Vector } from "../util/Vector";

export class GameMap {
  private static instance: GameMap;

  private oddEdgeAxis = [
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 0],
  ];
  private evenEdgeAxis = [
    [-1, -1],
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 1],
    [-1, 0],
  ];

  private tiles: Tile[][];
  private mapWidth: number;
  private mapHeight: number;
  private previousGScore;
  private previousFScore;
  private tileOutlines: Map<Tile, TileOutline[]>;

  private topLayerMapChunks: Map<Actor, Tile[]>;
  private topLayerTileActorList: Tile[] = [];
  private unitActorList: Unit[] = [];

  public static getInstance() {
    return this.instance;
  }

  /**
   * Initializes the GameMap singleton object, starts a map request to the server.
   */
  public static init() {
    GameMap.instance = new GameMap();
    this.instance.requestMapFromServer();
  }

  private constructor() {
    this.previousGScore = undefined;
    this.previousFScore = undefined;
    this.topLayerMapChunks = new Map<Actor, Tile[]>();
    this.tileOutlines = new Map<Tile, TileOutline[]>();

    NetworkEvents.on({
      eventName: "newCity",
      callback: (data) => {
        const tile = this.tiles[data["tileX"]][data["tileY"]];
        const player = AbstractPlayer.getPlayerByName(data["player"]);

        const city = new City({ tile: tile, player: player });
        tile.setCity(city);
        // Add the city actor to the scene (borders, nametag)
        Game.getCurrentScene().addActor(city);
      },
    });
  }

  public getTiles() {
    return this.tiles;
  }

  public getWidth() {
    return this.tiles.length;
  }

  public getHeight() {
    return this.tiles[0].length;
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
      let edgeX = gridX + edgeAxis[i][0];
      let edgeY = gridY + edgeAxis[i][1];

      if (
        edgeX == -1 ||
        edgeY == -1 ||
        edgeX > this.mapWidth - 1 ||
        edgeY > this.mapHeight - 1 ||
        gridX + edgeAxis[i][0] < 0
      ) {
        continue;
      }
      adjTiles.push(this.tiles[gridX + edgeAxis[i][0]][gridY + edgeAxis[i][1]]);
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
      initialValues: [startTile],
    });

    //cameFrom.fill(undefined, 0, totalNodes);

    while (openSet.length > 0) {
      let currentTile = openSet.dequeue();

      if (currentTile == goalTile) {
        this.previousGScore = gScore;
        this.previousFScore = fScore;
        return this.reconstructPath(unit, cameFrom, currentTile);
      }

      for (let neighborTile of currentTile.getAdjacentTiles()) {
        if (!neighborTile) continue;

        let d = (current: Tile, neighbor: Tile) =>
          unit.getTileWeight(current, neighbor);

        let tentativeGScore =
          gScore[currentTile.getGridX()][currentTile.getGridY()] +
          d(currentTile, neighborTile);
        //console.log(neighborTile.getNodeIndex());
        //console.log(gScore[neighborTile.getNodeIndex()]);

        if (
          tentativeGScore <
          gScore[neighborTile.getGridX()][neighborTile.getGridY()]
        ) {
          cameFrom[neighborTile.getGridX()][neighborTile.getGridY()] =
            currentTile;
          gScore[neighborTile.getGridX()][neighborTile.getGridY()] =
            tentativeGScore;
          fScore[neighborTile.getGridX()][neighborTile.getGridY()] =
            tentativeGScore + h(neighborTile);

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

    return totalPath;
  }

  private requestMapFromServer() {
    const scene = Game.getCurrentScene();
    this.tiles = [];
    const baseLayerTiles = [];
    const riverActors = [];

    WebsocketClient.sendMessage({ event: "requestMap" });

    NetworkEvents.on({
      eventName: "mapSize",
      callback: (data) => {
        this.mapWidth = parseInt(data["width"]);
        this.mapHeight = parseInt(data["height"]);

        for (let x = 0; x < this.mapWidth; x++) {
          this.tiles[x] = [];
          for (let y = 0; y < this.mapHeight; y++) {
            //this.tiles[x][y] = undefined;
          }
        }
      },
    });

    NetworkEvents.on({
      eventName: "mapChunk",
      callback: async (data) => {
        const tileList = data["tiles"] as Array<JSON>;
        const lastChunk = JSON.parse(data["lastChunk"]);
        const chunkX = data["chunkX"] * 32;
        const chunkY = data["chunkY"] * 25;

        const topLayerTiles = [];

        // X,Y values relative to a map chunk. (starts at 0.)
        let relativeX = 0;
        let relativeY = 0;

        for (const tileJSON of tileList) {
          const tileTypes: string[] = tileJSON["tileTypes"];
          const riverSides: boolean[] = tileJSON["riverSides"];
          const jsonUnits = tileJSON["units"];

          const gridX = parseInt(tileJSON["x"]);
          const gridY = parseInt(tileJSON["y"]);
          const movementCost = parseInt(tileJSON["movementCost"]);

          // For non-chunk tiles, that uses non-relative position. (Base-layer, river)
          let yPos = gridY * 25;
          let xPos = gridX * 32;
          if (gridY % 2 != 0) {
            xPos += 16;
          }

          //For chunk tiles, that uses relative position to canvas (top-layer)
          let yPosRelative = relativeY * 25;
          let xPosRelative = relativeX * 32;
          if (relativeY % 2 != 0) {
            xPosRelative += 16;
          }

          // Increment our relative x,y values each tile.
          relativeY += 1;

          if (relativeY > 3) {
            relativeY = 0;
            relativeX++;
          }

          const tile = new Tile({
            tileTypes: [tileTypes[0]], // Only assign the base tile type, for now....
            riverSides: riverSides,
            x: xPos,
            y: yPos,
            gridX: gridX,
            gridY: gridY,
            movementCost: movementCost,
          });
          this.tiles[gridX][gridY] = tile;

          baseLayerTiles.push(tile);
          if (tile.hasRiver()) {
            for (let numberedRiverSide of tile.getNumberedRiverSides()) {
              riverActors.push(
                new River({ tile: tile, side: numberedRiverSide })
              );
            }
          }
          if (tileTypes.length > 1) {
            const topLayerTileTypes = [...tileTypes];
            topLayerTileTypes.shift();
            const topLayerTile = new Tile({
              tileTypes: topLayerTileTypes,
              x: xPosRelative,
              y: yPosRelative,
              gridX: gridX,
              gridY: gridY,
              movementCost: movementCost,
            });

            topLayerTiles.push(topLayerTile);
            this.topLayerTileActorList.push(topLayerTile);
          }

          for (const jsonUnit of jsonUnits) {
            const unit = new Unit({
              name: jsonUnit["name"],
              id: jsonUnit["id"],
              attackType: jsonUnit["attackType"],
              tile: tile,
              actionsJSONList: jsonUnit["actions"],
            });
            tile.addUnit(unit);
            this.unitActorList.push(unit);
          }
        }

        // Create top-layer tile chunk
        for (let tile of topLayerTiles) {
          await tile.loadImage();
        }

        const mapActors = [...topLayerTiles];
        //Include empty actor for chunks with no top-layers.
        const placeholderActor = new Actor({
          color: "black",
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        });
        mapActors.push(placeholderActor);

        //TODO: Instead of a single map actor, we need to do this in chunks (4x4?). B/c it's going to be slow on map updates.
        const canvasWidth = 32 * 4 + 16;
        const canvasHeight = 25 * 4 + 7; // +7 For the last row of chunks.
        const mapChunk = Actor.mergeActors({
          actors: mapActors,
          spriteRegion: false,
          canvasWidth: canvasWidth,
          canvasHeight: canvasHeight,
        });

        mapChunk.setPosition(chunkX, chunkY);
        this.topLayerMapChunks.set(mapChunk, topLayerTiles);

        if (lastChunk) {
          this.initAdjacentTiles();

          // Add base-layer & river tile actors
          for (let tile of baseLayerTiles) {
            await tile.loadImage();
          }

          const bottomLayerActors = [...baseLayerTiles, ...riverActors];
          const bottomLayerActor = Actor.mergeActors({
            actors: bottomLayerActors,
            spriteRegion: false,
          });

          scene.addActor(bottomLayerActor);

          // Add the top-layer chunks
          this.topLayerMapChunks.forEach((_, chunkActor) => {
            scene.addActor(chunkActor);
          });

          for (const unit of this.unitActorList) {
            scene.addActor(unit);
          }

          // Now combine the base tile-type layer & the rest of the layers above..
          for (let topLayerTile of this.topLayerTileActorList) {
            const baseLayerTile =
              this.tiles[topLayerTile.getGridX()][topLayerTile.getGridY()];

            baseLayerTile.setTileTypes(
              baseLayerTile.getTileTypes().concat(topLayerTile.getTileTypes())
            );
          }

          Game.getCurrentScene().call("mapLoaded");
        }
      },
    });
  }

  public drawBorder(tiles: Tile[]) {
    // Create outline from the outer border tiles.

    //1. Get outter tiles
    // Condition: At least 1 adj tile is NOT in tiles list.
    const outerTiles: Tile[] = tiles.filter((tile) => {
      return !tile
        .getAdjacentTiles()
        .every((adjTile) => tiles.includes(adjTile));
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
        color: "red",
        cityOutline: true,
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

      Game.getCurrentScene().removeLine(outline.line);
      outlines.splice(outlines.indexOf(outline), 1); // Remove outline from list (NO CITY OUTLINES EVER!!! UNLESS SPECIFIED)

      // Reset any outlines effected by this outline
      for (const [_, effectedOutlines] of outline
        .getEffectedOutlines()
        .entries()) {
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
        z: options.z ?? 2,
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
      Game.getCurrentScene().addLine(outline.line);
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
      tile.getCenterPosition()[0],
      tile.getCenterPosition()[1],
      line.getVectors(),
      amount
    );
    line.setPosition({
      x1: shiftedTileVectors[0].x,
      y1: shiftedTileVectors[0].y,
      x2: shiftedTileVectors[1].x,
      y2: shiftedTileVectors[1].y,
    });
  }

  private isOutlineDrawn(tile: Tile, edge: number) {
    for (const tileOutline of this.tileOutlines.get(tile)) {
      if (tileOutline.edge === edge) return true;
    }

    return false;
  }

  public async redrawMap(modifiedTiles: Tile[]) {
    for (const tile of modifiedTiles) {
      this.topLayerMapChunks.forEach(async (topLayerTiles, chunk) => {
        // Check if tile is contained in the topLayerTiles
        // Use getX(), getY() for the chunkActor & tile

        if (
          tile.getX() >= chunk.getX() &&
          tile.getX() + tile.getWidth() <= chunk.getX() + chunk.getWidth() &&
          tile.getY() >= chunk.getY() &&
          tile.getY() + tile.getHeight() <= chunk.getY() + chunk.getHeight()
        ) {
          //Game.getCurrentScene().removeActor(chunk);
          const xPosRelative = tile.getX() - chunk.getX();
          const yPosRelative = tile.getY() - chunk.getY();
          const topLayerTile = new Tile({
            tileTypes: tile.getTileTypes().slice(1),
            x: xPosRelative,
            y: yPosRelative,
            gridX: tile.getGridX(),
            gridY: tile.getGridY(),
            movementCost: tile.getMovementCost(),
          });

          this.topLayerTileActorList.push(topLayerTile); // Not needed, but for continuity.
          const chunkTileActors = [...topLayerTiles, topLayerTile];

          // Create top-layer tile chunk
          for (let tile of chunkTileActors) {
            await tile.loadImage();
          }

          //TODO: Instead of a single map actor, we need to do this in chunks (4x4?). B/c it's going to be slow on map updates.
          const canvasWidth = 32 * 4 + 16;
          const canvasHeight = 25 * 4 + 7; // +7 For the last row of chunks.
          const updatedMapChunk = Actor.mergeActors({
            actors: chunkTileActors,
            spriteRegion: false,
            canvasWidth: canvasWidth,
            canvasHeight: canvasHeight,
          });
          updatedMapChunk.setPosition(chunk.getX(), chunk.getY());

          Game.getCurrentScene().addActor(updatedMapChunk);
          Game.getCurrentScene().removeActor(chunk);

          // Update the chunk map
          this.topLayerMapChunks.delete(chunk);
          this.topLayerMapChunks.set(updatedMapChunk, chunkTileActors);
        }
      });
    }
  }

  /**
   * Iterate through every tile & assign it's adjacent neighboring tiles through: setAdjacentTile()
   */
  private initAdjacentTiles() {
    for (let x = 0; x < this.mapWidth; x++) {
      for (let y = 0; y < this.mapHeight; y++) {
        // Set the 6 edges of the hexagon.

        let edgeAxis: number[][];
        if (y % 2 == 0) edgeAxis = this.evenEdgeAxis;
        else edgeAxis = this.oddEdgeAxis;

        for (let i = 0; i < edgeAxis.length; i++) {
          let edgeX = x + edgeAxis[i][0];
          let edgeY = y + edgeAxis[i][1];

          if (
            edgeX == -1 ||
            edgeY == -1 ||
            edgeX > this.mapWidth - 1 ||
            edgeY > this.mapHeight - 1
          ) {
            this.tiles[x][y].setAdjacentTile(i, null);
            continue;
          }

          this.tiles[x][y].setAdjacentTile(
            i,
            this.tiles[x + edgeAxis[i][0]][y + edgeAxis[i][1]]
          );
        }
      }
    }
  }

  public getTopLayerChunks() {
    return this.topLayerMapChunks;
  }
}
