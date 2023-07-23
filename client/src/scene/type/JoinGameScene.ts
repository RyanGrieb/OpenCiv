import { GameImage } from "../../Assets";
import { Game } from "../../Game";
import { NetworkEvents, WebsocketClient } from "../../network/Client";
import { Button } from "../../ui/Button";
import { Label } from "../../ui/Label";
import { TextBox } from "../../ui/Textbox";
import { Actor } from "../Actor";
import { Scene } from "../Scene";
import { SceneBackground } from "../SceneBackground";
export class JoinGameScene extends Scene {
  public onInitialize(): void {
    super.onInitialize();
    this.addActor(SceneBackground.generateRandomGrassland());

    /* const serverList = new ListBox({
      x: Game.getWidth() / 2 - 800 / 2,
      y: 25,
      width: 800,
      height: Game.getHeight() - 175,
      rowHeight: 50,
    });
    const testNames = ["server1", "test", "foo"];
    for (let i = 0; i < testNames.length; i++) {
      const row = serverList.getRows()[i];
      serverList
        .getRows()
        [i].setText({
          text: testNames[i],
          x: row.getTextX(),
          y: row.getTextY(),
        });
    }*/

    //this.addActor(serverList);

    const backgroundActor = new Actor({
      image: Game.getImage(GameImage.POPUP_BOX),
      x: Game.getWidth() / 2 - 600 / 2,
      y: Game.getHeight() / 2 - 500 / 2,
      width: 600,
      height: 500,
    });

    this.addActor(backgroundActor);

    const serverTextBox = new TextBox({
      x: Game.getWidth() / 2 - 400 / 2,
      y: Game.getHeight() / 2 - 100,
      width: 400,
      height: 50,
    });

    serverTextBox.setSelected(true);
    serverTextBox.setText("localhost");

    this.addActor(serverTextBox);

    const infoLabel = new Label({
      text: "Enter server code: (e.g. ED2FG)",
      font: "24px serif",
      fontColor: "white",
    });
    infoLabel.conformSize().then(() => {
      infoLabel.setPosition(
        Game.getWidth() / 2 - infoLabel.getWidth() / 2,
        serverTextBox.getY() - 30
      );
    });
    this.addActor(infoLabel);

    this.addActor(
      new Button({
        text: "Join",
        x: Game.getWidth() / 2 - 242 / 2,
        y: Game.getHeight() / 2 - 25,
        width: 242,
        height: 62,
        fontColor: "white",
        onClicked: () => {
          infoLabel.setText("Connecting...", true);
          infoLabel.conformSize().then(() => {
            infoLabel.setPosition(
              Game.getWidth() / 2 - infoLabel.getWidth() / 2,
              serverTextBox.getY() - 30
            );
          });

          WebsocketClient.init(serverTextBox.getText());
        },
      })
    );

    this.addActor(
      new Button({
        text: "Server List",
        x: Game.getWidth() / 2 - 242 / 2 - 150,
        y: Game.getHeight() / 2 + 150,
        width: 242,
        height: 62,
        fontColor: "white",
        onClicked: () => {},
      })
    );

    this.addActor(
      new Button({
        text: "Back",
        x: Game.getWidth() / 2 - 242 / 2 + 150,
        y: Game.getHeight() / 2 + 150,
        width: 242,
        height: 62,
        fontColor: "white",
        onClicked: () => {
          Game.setScene("main_menu");
        },
      })
    );

    NetworkEvents.on({
      eventName: "websocketError",
      parentObject: this,
      callback: (data) => {
        infoLabel.setText("Connection Failed.", true);
        infoLabel.conformSize().then(() => {
          infoLabel.setPosition(
            Game.getWidth() / 2 - infoLabel.getWidth() / 2,
            serverTextBox.getY() - 30
          );
        });
      },
    });

    NetworkEvents.on({
      eventName: "messageBox",
      parentObject: this,
      callback: (data) => {
        const messageName = data["messageName"];
        if (messageName === "gameInProgress") {
          infoLabel.setText("Connection Failed: Game in progress.");
          infoLabel.conformSize().then(() => {
            infoLabel.setPosition(
              Game.getWidth() / 2 - infoLabel.getWidth() / 2,
              serverTextBox.getY() - 30
            );
          });
        }
      },
    });
  }
}
