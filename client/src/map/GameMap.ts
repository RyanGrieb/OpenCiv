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
            });
            topLayerTileActorList.push(topLayerTile);
          }

          for (const jsonUnit of jsonUnits) {
            const unit = new Unit({
              name: jsonUnit["name"],
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
