import PriorityQueue from "ts-priority-queue";
import { Game } from "../Game";
import { Unit } from "../Unit";
import { NetworkEvents, WebsocketClient } from "../network/Client";
import { Actor } from "../scene/Actor";
import { River } from "./River";
import { Tile } from "./Tile";

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
  private mapActor: Actor;
  private mapWidth: number;
  private mapHeight: number;
  private previousGScore;
  private previousFScore;

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
  }

  public refreshMap() {
    Game.getCurrentScene().removeActor(this.mapActor);
    const tileActorList = [];

    for (let x = 0; x < this.mapWidth; x++) {
      for (let y = 0; y < this.mapHeight; y++) {
        let yPos = y * 24;
        let xPos = x * 33;
        if (y % 2 != 0) {
          xPos += 16;
        }

        const tile = new Tile({
          tileTypes: this.tiles[x][y].getTileTypes(),
          x: xPos,
          y: yPos,
          movementCost: this.tiles[x][y].getMovementCost(),
        });
        tileActorList.push(tile);
      }
    }

    this.mapActor = Actor.mergeActors({
      actors: tileActorList,
      spriteRegion: false,
    });
    Game.getCurrentScene().addActor(this.mapActor);
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

    for (let x = 0; x < GameMap.getInstance().getWidth(); x++) {
      gScore[x] = [];
      fScore[x] = [];
      cameFrom[x] = [];
      for (let y = 0; y < GameMap.getInstance().getHeight(); y++) {
        gScore[x][y] = Number.MAX_VALUE;
        fScore[x][y] = 0;

        if (this.previousGScore || this.previousFScore) {
          gScore = this.previousGScore; // Use previous gScore value
          fScore = this.previousFScore; // Use previous fScore value
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
    const tileActorList: Tile[] = [];
    const topLayerTileActorList: Tile[] = [];
    const unitActorList: Unit[] = [];
    const riverActors: River[] = [];

    NetworkEvents.on({
      eventName: "mapChunk",
      callback: async (data) => {
        const tileList = data["tiles"] as Array<JSON>;
        const lastChunk = JSON.parse(data["lastChunk"]);

        for (const tileJSON of tileList) {
          const tileTypes: string[] = tileJSON["tileTypes"];
          const riverSides: boolean[] = tileJSON["riverSides"];
          const jsonUnits = tileJSON["units"];

          const x = parseInt(tileJSON["x"]);
          const y = parseInt(tileJSON["y"]);
          const movementCost = parseInt(tileJSON["movementCost"]);

          let yPos = y * 25;
          let xPos = x * 32;
          if (y % 2 != 0) {
            xPos += 16;
          }

          const tile = new Tile({
            tileTypes: [tileTypes[0]], // Only assign the base tile type, for now....
            riverSides: riverSides,
            x: xPos,
            y: yPos,
            movementCost: movementCost,
          });
          this.tiles[x][y] = tile;
          tileActorList.push(tile);
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
              x: xPos,
              y: yPos,
              movementCost: movementCost,
            });
            topLayerTileActorList.push(topLayerTile);
          }

          for (const jsonUnit of jsonUnits) {
            const unit = new Unit({
              name: jsonUnit["name"],
              id: jsonUnit["id"],
              attackType: jsonUnit["attackType"],
              tile: tile,
            });
            tile.addUnit(unit);
            unitActorList.push(unit);
          }
        }

        if (lastChunk) {
          this.initAdjacentTiles();

          console.log("Loading tile images..");

          for (let tile of tileActorList) {
            await tile.loadImage();
          }

          for (let tile of topLayerTileActorList) {
            await tile.loadImage();
          }

          console.log("All tile images loaded, generating map");

          const mapActors: Actor[] = [
            ...tileActorList,
            ...riverActors,
            ...topLayerTileActorList,
          ];
          //TODO: Instead of a single map actor, we need to do this in chunks (4x4?). B/c it's going to be slow on map updates.
          this.mapActor = Actor.mergeActors({
            actors: mapActors,
            spriteRegion: false,
          });
          scene.addActor(this.mapActor);

          for (const unit of unitActorList) {
            scene.addActor(unit);
          }

          // Now combine the base tile-type layer & the rest of the layers above..
          for (let topLayerTile of topLayerTileActorList) {
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
}
