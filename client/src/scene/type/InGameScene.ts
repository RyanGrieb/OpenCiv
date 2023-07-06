import { Game } from "../../Game";
import { GameMap } from "../../map/GameMap";
import { NetworkEvents, WebsocketClient } from "../../network/Client";
import { AbstractPlayer } from "../../player/AbstractPlayer";
import { ClientPlayer } from "../../player/ClientPlayer";
import { ExternalPlayer } from "../../player/ExternalPlayer";
import { Button } from "../../ui/Button";
import { Label } from "../../ui/Label";
import { StatusBar } from "../../ui/StatusBar";
import { Camera } from "../Camera";
import { Scene } from "../Scene";

export class InGameScene extends Scene {
  private players: AbstractPlayer[];
  private tileInformationLabel: Label;
  private statusBar: StatusBar;

  public onInitialize(): void {
    GameMap.init();
    this.players = [];

    const camera = new Camera({
      wasd_controls: false,
      mouse_controls: true,
      //initial_position: [1, 1],
    });
    this.setCamera(camera);

    // Initialize all existing players
    WebsocketClient.sendMessage({ event: "playersData" });

    NetworkEvents.on({
      eventName: "playersData",
      callback: (data) => {
        for (let i = 0; i < data["players"].length; i++) {
          const playerJSON = data["players"][i];
          if (playerJSON["clientPlayer"]) {
            this.players.push(new ClientPlayer(playerJSON["name"]));
          } else {
            this.players.push(new ExternalPlayer(playerJSON["name"]));
          }
        }
      },
    });

    this.on("mapLoaded", () => {
      this.tileInformationLabel = new Label({
        text: "N/A",
        font: "16px serif",
        fontColor: "white",
        x: 0,
        y: 0,
        z: 1,
      });
      this.tileInformationLabel.conformSize().then(() => {
        this.tileInformationLabel.setPosition(
          2,
          Game.getHeight() - this.tileInformationLabel.getHeight() + 6
        );
        this.addActor(this.tileInformationLabel);
      });

      this.statusBar = new StatusBar();
      this.addActor(this.statusBar);

      this.addActor(
        new Button({
          text: "Next Turn",
          x: Game.getWidth() / 2 - 150 / 2,
          y: Game.getHeight() - 44,
          z: 1,
          width: 150,
          height: 42,
          fontColor: "white",
          onClicked: () => {
            console.log("Next turn");
          },
        })
      );

      this.on("tileHovered", (options) => {
        if (!options.tile) {
          this.tileInformationLabel.setText("");
        } else {
          let tileTypes: string = options.tile.getTileTypes().toString();
          tileTypes = tileTypes.replaceAll("_", " ");
          tileTypes = tileTypes.replaceAll(",", ", ");
          let strArray = tileTypes.split("");
          strArray[0] = strArray[0].toUpperCase();

          for (let i = 1; i < tileTypes.length; i++) {
            if (tileTypes[i - 1] === " ") {
              strArray[i] = tileTypes[i].toUpperCase();
            }
          }

          tileTypes = strArray.join("");

          this.tileInformationLabel.setText(
            "[" +
              options.tile.getGridX() +
              "," +
              options.tile.getGridY() +
              "] " +
              tileTypes +
              (options.tile.hasRiver() ? ", River" : "")
          );
        }
      });

      WebsocketClient.sendMessage({ event: "loadedIn" });
    });
  }
}
