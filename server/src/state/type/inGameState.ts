import { Game } from "../../game";
import { State } from "../state";

export class InGameState extends State {
  public onInitialize() {
    console.log("InGame state initialized");
    Game.on("playerJoin", (data) => {
      const playerName = data["playerName"];
      console.log(
        playerName + " has joined the while the game is running... account for this later.."
      );
    });

    Game.getPlayers().forEach((player, playerName) => {
      player.sendNetworkEvent(JSON.stringify({ event: "setScene", scene: "in_game" }));
    });
  }

  public onDestroyed() {}
}
