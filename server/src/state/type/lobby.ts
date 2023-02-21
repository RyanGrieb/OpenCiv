import { Game } from "../../game";
import { State } from "../state";

export class Lobby extends State {
  public onInitialize() {
    console.log("Lobby state initialized");
    Game.on("playerJoin", (data) => {
      const playerName = data["playerName"];
      console.log(playerName + " has joined the lobby");
    });
  }

  public onDestroyed() {}
}
