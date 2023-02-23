import { Game } from "../../game";
import { NetworkEvents, WebsocketClient } from "../../network/client";
import { Button } from "../../ui/button";
import { ListBox } from "../../ui/listbox";
import { Scene } from "../scene";
import { SceneBackground } from "../sceneBackground";

export class LobbyScene extends Scene {
  public onInitialize(): void {
    super.onInitialize();
    this.addActor(SceneBackground.generateRandomGrassland());

    const playerList = new ListBox({
      x: Game.getWidth() / 2 - 600 / 2,
      y: 25,
      width: 600,
      height: Game.getHeight() - 175,
      rowHeight: 50,
    });

    this.addActor(playerList);

    this.addActor(
      new Button({
        text: "Start Game",
        x: Game.getWidth() / 2 - 242 / 2,
        y: playerList.getY() + playerList.getHeight() + 10,
        width: 242,
        height: 62,
        fontColor: "white",
        onClicked: () => {
          // TODO: Change text of this button & prevent repeated clicks.
          WebsocketClient.sendMessage(JSON.stringify({ event: "setState", state: "in_game" }));
        },
      })
    );

    this.addActor(
      new Button({
        text: "Back",
        x: Game.getWidth() / 2 - 242 / 2,
        y: playerList.getY() + playerList.getHeight() + 75,
        width: 242,
        height: 62,
        fontColor: "white",
        onClicked: () => {
          Game.setScene("join_game");
          //TODO: Disconnect player
        },
      })
    );

    WebsocketClient.sendMessage(JSON.stringify({ event: "playerNames" }));
    NetworkEvents.on({
      eventName: "playerNames",
      callback: (data) => {
        console.log(data);
        const playerNames = data["names"];
        // Update listbox
        for (let i = 0; i < playerNames.length; i++) {
          playerList.getRows()[i].setText(playerNames[i]);
        }
      },
    });
  }
}
