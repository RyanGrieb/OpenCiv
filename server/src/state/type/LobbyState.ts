import { Game } from "../../Game";
import { ServerEvents } from "../../Events";
import { Player } from "../../Player";
import { State } from "../State";

let playerIndex = 1;

export class LobbyState extends State {
  public onInitialize() {
    console.log("Lobby state initialized");
    playerIndex = 1;

    ServerEvents.on({
      eventName: "connection",
      parentObject: this,
      callback: (data, websocket) => {
        // Initialize player name
        const playerName = "Player" + playerIndex;
        playerIndex++;

        console.log(playerName + " has joined the lobby");

        const newPlayer = new Player(playerName, websocket);
        Game.getPlayers().set(playerName, newPlayer);

        // Send playerJoin data to other connected players
        for (const player of Array.from(Game.getPlayers().values())) {
          player.sendNetworkEvent({
            event: "playerJoin",
            playerName: playerName,
          });
        }

        newPlayer.sendNetworkEvent({ event: "setScene", scene: "lobby" });
      },
    });
  }

  public onDestroyed() {
    return super.onDestroyed();
  }
}
