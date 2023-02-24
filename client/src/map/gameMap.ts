import { Game } from "../game";
import { NetworkEvents, WebsocketClient } from "../network/client";
import { Actor } from "../scene/actor";
import { Tile } from "./tile";

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
      callback: (data) => {
        const tileList = data["tiles"] as Array<JSON>;
        const lastChunk = JSON.parse(data["lastChunk"]);

        for (const tileJSON of tileList) {
          const tileType = tileJSON["tileType"];
          const x = parseInt(tileJSON["x"]);
          const y = parseInt(tileJSON["y"]);

          let yPos = y * 24;
          let xPos = x * 32;
          if (y % 2 != 0) {
            xPos += 16;
          }

          const tile = new Tile({ tileType: tileType, x: xPos, y: yPos });
          this.tiles[x][y] = tile;
          tileActorList.push(tile);
        }

        if (lastChunk) {
          this.mapActor = Actor.mergeActors(tileActorList);
          scene.addActor(this.mapActor);
        }
      },
    });
  }
}
