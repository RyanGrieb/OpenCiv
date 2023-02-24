import { WebsocketClient } from "../../network/client";
import { Scene } from "../scene";

export class InGameScene extends Scene {
  public onInitialize(): void {
    WebsocketClient.sendMessage(JSON.stringify({}));
  }
}
