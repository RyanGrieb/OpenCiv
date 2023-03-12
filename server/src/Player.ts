import { WebSocket } from "ws";
import { ServerEvents } from "./Events";
import { Game } from "./Game";

export class Player {
  private name: string;
  private wsConnection: WebSocket;

  constructor(name: string, wsConnection: WebSocket) {
    this.name = name;
    this.wsConnection = wsConnection;

    this.wsConnection.on("close", (data) => {
      console.log(name + " quit");
      ServerEvents.call("playerQuit", {}, this.wsConnection);
      Game.getPlayers().delete(this.name);

      // Send playerQuit data to other connected players
      for (const player of Array.from(Game.getPlayers().values())) {
        if (player === this) {
          continue;
        }
        player.sendNetworkEvent({ event: "playerQuit", playerName: this.name });
      }
    });
  }

  public sendNetworkEvent(event: Record<string, any>) {
    this.wsConnection.send(JSON.stringify(event));
  }

  public getName(): string {
    return this.name;
  }

  public getWebsocket() {
    return this.wsConnection;
  }
}
