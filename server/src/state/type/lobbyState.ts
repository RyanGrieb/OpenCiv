import { Game } from "../../game";
import { ServerEvents } from "../../events";
import { Player } from "../../player";
import { State } from "../state";

let playerIndex = 1;

export class LobbyState extends State {
  public onInitialize() {
    console.log("Lobby state initialized");

    ServerEvents.on({
      eventName: "connection",
      callback: (data, websocket) => {
        // Initialize player name
        const playerName = "Player" + playerIndex;
        playerIndex++;

        console.log(playerName + " has joined the lobby");

        const newPlayer = new Player(playerName, websocket);
        Game.getPlayers().set(playerName, newPlayer);

        // Send playerJoin data to other connected players
        for (const player of Array.from(Game.getPlayers().values())) {
          player.sendNetworkEvent({ event: "playerJoin", playerName: playerName });
        }

        newPlayer.sendNetworkEvent({ event: "setScene", scene: "lobby" });
      },
    });
  }

  public onDestroyed() {
    super.onDestroyed();
    // We need ot remove the on("Connection")
  }
}
