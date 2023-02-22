import { Game } from "../../game";
import { NetworkEvents, WebsocketClient } from "../../network/client";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { ListBox } from "../../ui/listbox";
import { TextBox } from "../../ui/textbox";
import { Scene } from "../scene";
import { SceneBackground } from "../sceneBackground";
export class JoinGameScene extends Scene {
  public onInitialize(): void {
    super.onInitialize();
    this.addActor(SceneBackground.generateRandomGrassland());

    const serverList = new ListBox({
      x: Game.getWidth() / 2 - 800 / 2,
      y: 25,
      width: 800,
      height: Game.getHeight() - 175,
      rowHeight: 50,
    });
    const testNames = ["server1", "test", "foo"];
    for (let i = 0; i < testNames.length; i++) {
      serverList.getRows()[i].setText(testNames[i]);
    }

    //this.addActor(serverList);

    const serverTextBox = new TextBox({
      x: Game.getWidth() / 2 - 400 / 2,
      y: Game.getHeight() / 2 - 100,
      width: 400,
      height: 50,
    });

    serverTextBox.setSelected(true);

    this.addActor(serverTextBox);

    const infoLabel = new Label({ text: "Enter server code: (e.g. ED2FG)", fontColor: "white" });
    infoLabel.conformSize().then(() => {
      infoLabel.setPosition(
        Game.getWidth() / 2 - infoLabel.getWidth() / 2,
        serverTextBox.getY() - infoLabel.getHeight() + 10
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
          infoLabel.setText("Connecting...");
          infoLabel.conformSize().then(() => {
            infoLabel.setPosition(
              Game.getWidth() / 2 - infoLabel.getWidth() / 2,
              serverTextBox.getY() - infoLabel.getHeight() + 10
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
          Game.setScene("mp_options");
        },
      })
    );

    NetworkEvents.on("connectionClosed", (event) => {
      infoLabel.setText("Connection Failed.");
      infoLabel.conformSize().then(() => {
        infoLabel.setPosition(
          Game.getWidth() / 2 - infoLabel.getWidth() / 2,
          serverTextBox.getY() - infoLabel.getHeight() + 10
        );
      });
    });
  }
}
