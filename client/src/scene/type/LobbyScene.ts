import { GameImage, SpriteRegion } from "../../Assets";
import { Game } from "../../Game";
import { NetworkEvents, WebsocketClient } from "../../network/Client";
import { Button } from "../../ui/Button";
import { ListBox } from "../../ui/Listbox";
import { SelectCivilizationGroup } from "../../ui/SelectCivilizationGroup";
import { Actor } from "../Actor";
import { Scene } from "../Scene";
import { SceneBackground } from "../SceneBackground";

export class LobbyScene extends Scene {
  private selectCivGroup: SelectCivilizationGroup;

  public onInitialize(): void {
    super.onInitialize();
    this.addActor(SceneBackground.generateRandomGrassland());

    const playerList = new ListBox({
      x: Game.getWidth() / 2 - 600 / 2,
      y: 25,
      width: 600,
      height: Game.getHeight() - 230,
      rowHeight: 50,
      textFont: "20px serif",
      fontColor: "white",
    });

    this.addActor(playerList);

    this.addActor(
      new Button({
        text: "Choose Civilization",
        x: Game.getWidth() / 2 - 242 / 2,
        y: playerList.getY() + playerList.getHeight() + 10,
        width: 242,
        height: 62,
        fontColor: "white",
        onClicked: () => {
          console.log("Choose civilization");

          if (!this.selectCivGroup || !this.hasActor(this.selectCivGroup)) {
            this.selectCivGroup = new SelectCivilizationGroup(
              playerList.getX() + playerList.getWidth() / 2 - 432 / 2,
              playerList.getY() + playerList.getHeight() / 2 - 440 / 2,
              432,
              440
            );
            this.addActor(this.selectCivGroup);
          } else {
            this.removeActor(this.selectCivGroup);
          }
        },
      })
    );

    this.addActor(
      new Button({
        text: "Ready Up",
        x: Game.getWidth() / 2 - 242 / 2,
        y: playerList.getY() + playerList.getHeight() + 75,
        width: 242,
        height: 62,
        fontColor: "white",
        onClicked: () => {
          // TODO: Change text of this button & prevent repeated clicks.
          WebsocketClient.sendMessage({ event: "setState", state: "in_game" });
        },
      })
    );

    this.addActor(
      new Button({
        text: "Back",
        x: Game.getWidth() / 2 - 242 / 2,
        y: playerList.getY() + playerList.getHeight() + 140,
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
      parentObject: this,
      callback: this.updatePlayerList,
    });
    NetworkEvents.on({
      eventName: "playerQuit",
      parentObject: this,
      callback: this.updatePlayerList,
    });
    NetworkEvents.on({
      eventName: "playerLeave",
      parentObject: this,
      callback: this.updatePlayerList,
    });

    NetworkEvents.on({
      eventName: "playerNames",
      parentObject: this,
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

          currentRow.addActorIcon(
            new Actor({
              image: Game.getImage(GameImage.SPRITESHEET),
              spriteRegion: SpriteRegion.UNKNOWN_ICON,
              x: currentRow.x + 8,
              y: currentRow.y - 32 / 2 + currentRow.height / 2,
              width: 32,
              height: 32,
            })
          );

          currentRow.setText(playerName).then(() => {
            currentRow.setTextPosition(
              currentRow.x + 48,
              currentRow.y +
                currentRow.height / 2 -
                currentRow.getTextHeight() / 2
            );
          });
        }
      },
    });
  }

  public onDestroyed(newScene: Scene) {
    const exitReceipt = super.onDestroyed(newScene);
    // Disconnect from the server if we go back
    if (newScene.constructor.name !== "LoadingScene") {
      WebsocketClient.disconnect();
    }

    return exitReceipt;
  }

  private updatePlayerList() {
    WebsocketClient.sendMessage({ event: "playerNames" });
  }
}
