import { WebSocket } from "ws";
import { Game } from "./game";

export class Player {
  private name: string;
  private wsConnection: WebSocket;

  constructor(name: string, wsConnection: WebSocket) {
    this.name = name;
    this.wsConnection = wsConnection;

    this.wsConnection.on("close", (data) => {
      console.log(name + " quit");
      Game.getPlayers().delete(this.name);

      // Send playerQuit data to other connected players
      for (const player of Array.from(Game.getPlayers().values())) {
        if (player === this) {
          continue;
        }
        player.sendNetworkEvent(JSON.stringify({ event: "playerQuit", playerName: this.name }));
      }
    });
  }

  public sendNetworkEvent(event: string) {
    this.wsConnection.send(event);
  }

  public getName(): string {
    return this.name;
  }
}
