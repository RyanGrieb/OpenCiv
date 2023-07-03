import { Game } from "../../Game";
import { ServerEvents } from "../../Events";
import { State } from "../State";
import { GameMap } from "../../map/GameMap";
import { Server } from "http";
import { Unit } from "../../Unit";

export class InGameState extends State {
  private currentTurn: number;
  private turnTime: number;

  public onInitialize() {
    this.currentTurn = 0;
    this.turnTime = 0;

    // Set loading screen for players
    Game.getPlayers().forEach((player) => {
      player.sendNetworkEvent({ event: "setScene", scene: "loading_scene" });
    });

    GameMap.init();

    console.log("InGame state initialized");
    //TODO: Instead of an error message, make the player a spectator
    ServerEvents.on({
      eventName: "connection",
      callback: (data, websocket) => {
        console.log("Connection attempted while game in progress...");
        websocket.send(
          JSON.stringify({
            event: "messageBox",
            messageName: "gameInProgress",
            message: "Connection Error: Game in progress.",
          })
        );
        websocket.close();
      },
    });

    ServerEvents.on({
      eventName: "requestMap",
      callback: (data, websocket) => {
        const player = Game.getPlayerFromWebsocket(websocket);
        GameMap.sendMapChunksToPlayer(player);
      },
    });

    ServerEvents.on({
      eventName: "playersData",
      callback: (data, websocket) => {
        const playersDataJSON = [];

        Game.getPlayers().forEach((player) => {
          playersDataJSON.push({
            name: player.getName(),
            clientPlayer: player.getWebsocket() === websocket,
          });
        });

        websocket.send(
          JSON.stringify({
            event: "playersData",
            players: playersDataJSON,
          })
        );
      },
    });

    Game.getPlayers().forEach((player) => {
      const spawnTile = GameMap.getRandomTileWith({
        avoidTileTypes: [
          "ocean",
          "shallow_ocean",
          "freshwater",
          "mountain",
          "snow",
          "snow_hill",
          "tundra",
          "tundra_hill",
        ],
      });

      spawnTile.addUnit(new Unit({ name: "settler", tile: spawnTile }));
      //spawnTile.addUnit(new Unit({ name: "archer", attackType: "ranged" }));

      player.onLoadedIn(() => {
        player.zoomToLocation(spawnTile.getX(), spawnTile.getY(), 7);

        let allLoaded = true;
        // Trigger allPlayersLoaded event
        Game.getPlayers().forEach((player) => {
          if (!player.isLoadedIn()) {
            allLoaded = false;
          }
        });

        if (allLoaded) {
          ServerEvents.call("allPlayersLoaded", {});
        }
      });

      player.sendNetworkEvent({ event: "setScene", scene: "in_game" });
    });

    ServerEvents.on({
      eventName: "allPlayersLoaded",
      callback: () => {
        // Increment the turn
        this.incrementTurn();
      },
    });
  }

  public incrementTurn() {
    this.currentTurn++;
    this.turnTime += 60;
    Game.getPlayers().forEach((player) => {
      player.sendNetworkEvent({
        event: "newTurn",
        turn: this.currentTurn,
        turnTime: this.turnTime,
      });
    });
  }
  public onDestroyed() {
    return super.onDestroyed();
  }
}
