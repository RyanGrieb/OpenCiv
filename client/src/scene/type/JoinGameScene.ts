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
  private serverTextBox: TextBox;
  private isConnecting: boolean = false;

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
      image: Game.getInstance().getImage(GameImage.POPUP_BOX),
      x: Game.getInstance().getWidth() / 2 - 600 / 2,
      y: Game.getInstance().getHeight() / 2 - 500 / 2,
      width: 600,
      height: 500
    });

    this.addActor(backgroundActor);

    this.serverTextBox = new TextBox({
      x: Game.getInstance().getWidth() / 2 - 400 / 2,
      y: Game.getInstance().getHeight() / 2 - 100,
      width: 400,
      height: 50
    });

    this.serverTextBox.setSelected(true);
    this.serverTextBox.setText("localhost");

    this.addActor(this.serverTextBox);

    const infoLabel = new Label({
      text: "Enter server IP:",
      font: "24px serif",
      fontColor: "white"
    });
    infoLabel.conformSize().then(() => {
      infoLabel.setPosition(
        Game.getInstance().getWidth() / 2 - infoLabel.getWidth() / 2,
        this.serverTextBox.getY() - 30
      );
      this.addActor(infoLabel);
    });

    const joinButton = new Button({
      text: "Join",
      x: Game.getInstance().getWidth() / 2 - 242 / 2,
      y: Game.getInstance().getHeight() / 2 - 25,
      width: 242,
      height: 62,
      fontColor: "white",
      onClicked: () => {
        if (this.isConnecting) return; // Prevent multiple connection attempts
        this.isConnecting = true;
        infoLabel.setText("Connecting...", true);
        infoLabel.conformSize().then(() => {
          infoLabel.setPosition(
            Game.getInstance().getWidth() / 2 - infoLabel.getWidth() / 2,
            this.serverTextBox.getY() - 30
          );
        });

        WebsocketClient.init(this.serverTextBox.getText());
      }
    });

    this.addActor(joinButton);

    this.addActor(
      new Button({
        text: "Server List",
        x: Game.getInstance().getWidth() / 2 - 242 / 2 - 150,
        y: Game.getInstance().getHeight() / 2 + 150,
        width: 242,
        height: 62,
        fontColor: "white",
        onClicked: () => { }
      })
    );

    this.addActor(
      new Button({
        text: "Back",
        x: Game.getInstance().getWidth() / 2 - 242 / 2 + 150,
        y: Game.getInstance().getHeight() / 2 + 150,
        width: 242,
        height: 62,
        fontColor: "white",
        onClicked: () => {
          Game.getInstance().setScene("main_menu");
        }
      })
    );

    NetworkEvents.on({
      eventName: "websocketError",
      parentObject: this,
      callback: (data) => {
        this.isConnecting = false; // Allow connection retry after error
        infoLabel.setText("Connection Failed.", true);
        infoLabel.conformSize().then(() => {
          infoLabel.setPosition(
            Game.getInstance().getWidth() / 2 - infoLabel.getWidth() / 2,
            this.serverTextBox.getY() - 30
          );
        });
      }
    });

    NetworkEvents.on({
      eventName: "connected",
      parentObject: this,
      callback: () => {
        this.isConnecting = false;
      }
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
              Game.getInstance().getWidth() / 2 - infoLabel.getWidth() / 2,
              this.serverTextBox.getY() - 30
            );
          });
        }
      }
    });
  }

  public redraw() {
    const oldText = this.serverTextBox.getText();
    super.redraw();
    this.serverTextBox.setText(oldText);
  }
}
