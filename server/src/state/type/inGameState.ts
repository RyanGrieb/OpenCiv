import { Game } from "../../game";
import { ServerEvents } from "../../events";
import { State } from "../state";

export class InGameState extends State {
  public onInitialize() {
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

    Game.getPlayers().forEach((player, playerName) => {
      player.sendNetworkEvent({ event: "setScene", scene: "in_game" });
    });

    // TODO: Initialize game map
  }

  public onDestroyed() {
    return super.onDestroyed();
  }
}
