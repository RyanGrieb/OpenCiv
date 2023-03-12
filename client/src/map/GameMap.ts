import { Game } from "../Game";
import { NetworkEvents, WebsocketClient } from "../network/Client";
import { Actor } from "../scene/Actor";
import { Tile } from "./Tile";

export class GameMap {
  private static tiles: Tile[][];
  private static mapActor: Actor;
  private static mapWidth: number;
  private static mapHeight: number;

  public static init() {
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
    const tileActorList = [];

    NetworkEvents.on({
      eventName: "mapChunk",
      callback: async (data) => {
        const tileList = data["tiles"] as Array<JSON>;
        const lastChunk = JSON.parse(data["lastChunk"]);

        for (const tileJSON of tileList) {
          const tileTypes = tileJSON["tileTypes"];
          const x = parseInt(tileJSON["x"]);
          const y = parseInt(tileJSON["y"]);

          let yPos = y * 24;
          let xPos = x * 32;
          if (y % 2 != 0) {
            xPos += 16;
          }

          const tile = new Tile({ tileTypes: tileTypes, x: xPos, y: yPos });
          this.tiles[x][y] = tile;
          tileActorList.push(tile);
        }

        if (lastChunk) {
          console.log("Loading tile images..");
          for (let x = 0; x < this.mapWidth; x++) {
            for (let y = 0; y < this.mapHeight; y++) {
              await this.tiles[x][y].loadImage();
            }
          }

          console.log("All tile images loaded, generating map");
          //TODO: Instead of a single map actor, we need to do this in chunks (4x4?). B/c it's going to be slow on map updates.
          this.mapActor = Actor.mergeActors({ actors: tileActorList, spriteRegion: false });
          scene.addActor(this.mapActor);
        }
      },
    });
  }

  public static refreshMap() {
    Game.getCurrentScene().removeActor(this.mapActor);
    const tileActorList = [];

    for (let x = 0; x < this.mapWidth; x++) {
      for (let y = 0; y < this.mapHeight; y++) {
        let yPos = y * 24;
        let xPos = x * 32;
        if (y % 2 != 0) {
          xPos += 16;
        }

        const tile = new Tile({ tileTypes: this.tiles[x][y].getTileTypes(), x: xPos, y: yPos });
        tileActorList.push(tile);
      }
    }

    this.mapActor = Actor.mergeActors({ actors: tileActorList, spriteRegion: false });
    Game.getCurrentScene().addActor(this.mapActor);
  }
}
