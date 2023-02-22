import { WebSocket } from "ws";

export class Player {
  private name: string;
  private wsConnection: WebSocket;

  constructor(name: string, wsConnection: WebSocket) {
    this.name = name;
    this.wsConnection = wsConnection;
  }

  public sendNetworkEvent(event: string) {
    this.wsConnection.send(event);
  }

  public getName(): string {
    return this.name;
  }
}
