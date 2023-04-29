import { Game } from "../../Game";
import { ServerEvents } from "../../Events";
import { State } from "../State";
import { GameMap } from "../../map/GameMap";
import { Server } from "http";

export class InGameState extends State {
  public onInitialize() {
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
      player.sendNetworkEvent({ event: "setScene", scene: "in_game" });
    });
  }

  public onDestroyed() {
    return super.onDestroyed();
  }
}
