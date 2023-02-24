import { GameImage, SpriteRegion } from "../../assets";
import { Game } from "../../game";
import { NetworkEvents, WebsocketClient } from "../../network/client";
import { Button } from "../../ui/button";
import { ListBox } from "../../ui/listbox";
import { Actor } from "../actor";
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

    this.updatePlayerList();

    NetworkEvents.on({
      eventName: "playerJoin",
      callback: this.updatePlayerList,
    });
    NetworkEvents.on({
      eventName: "playerQuit",
      callback: this.updatePlayerList,
    });
    NetworkEvents.on({
      eventName: "playerLeave",
      callback: this.updatePlayerList,
    });

    NetworkEvents.on({
      eventName: "playerNames",
      callback: (data) => {
        const playerNames = data["names"];
        const requestingName = data["requestingName"];
        playerList.clearRowText();

        for (let i = 0; i < playerNames.length; i++) {
          const currentRow = playerList.getRows()[i];
          const playerName = playerNames[i];

          if (playerName === requestingName) {
            // TODO: Indicate this row is the users player
            currentRow.addActorIcon(
              new Actor({
                image: Game.getImage(GameImage.SPRITESHEET),
                spriteRegion: SpriteRegion.STAR,
                x: currentRow.x + currentRow.width - 32 - 8,
                y: currentRow.y - 32 / 2 + currentRow.height / 2,
                width: 32,
                height: 32,
              })
            );
          }
          currentRow.setText(playerName);
        }
      },
    });
  }

  public onDestroyed(newScene: Scene): void {
    super.onDestroyed(newScene);
    // Disconnect from the server if we go back
    if (newScene.constructor.name !== "InGameScene") {
      WebsocketClient.disconnect();
    }
  }

  private updatePlayerList() {
    WebsocketClient.sendMessage(JSON.stringify({ event: "playerNames" }));
  }
}
