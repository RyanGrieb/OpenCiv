import { Game } from "../../Game";
import { City } from "../../city/City";
import { GameMap } from "../../map/GameMap";
import { Tile } from "../../map/Tile";
import { NetworkEvents, WebsocketClient } from "../../network/Client";
import { AbstractPlayer } from "../../player/AbstractPlayer";
import { ClientPlayer } from "../../player/ClientPlayer";
import { ExternalPlayer } from "../../player/ExternalPlayer";
import { Button } from "../../ui/Button";
import { CityDisplayInfo } from "../../ui/CityDisplayInfo";
import { Label } from "../../ui/Label";
import { StatusBar } from "../../ui/StatusBar";
import { Camera } from "../Camera";
import { Scene } from "../Scene";

export class InGameScene extends Scene {
  private players: AbstractPlayer[];
  private clientPlayer: ClientPlayer;
  private tileInformationLabel: Label;
  private statusBar: StatusBar;
  private cityDisplayInfo: CityDisplayInfo;
  private nextTurnButton: Button;
  private closeCityDisplayButton: Button;

  public onInitialize(): void {
    this.players = [];
    if (this.firstLoad) {
      const camera = new Camera({
        wasd_controls: true,
        mouse_controls: true,
        //initial_position: [1, 1],
      });
      this.setCamera(camera);
    } else {
      this.restoreCamera();
    }

    // Initialize all existing players
    WebsocketClient.sendMessage({ event: "connectedPlayers" });

    NetworkEvents.on({
      eventName: "connectedPlayers",
      parentObject: this,
      callback: (data) => {
        for (let i = 0; i < data["players"].length; i++) {
          const playerJSON = data["players"][i];
          if (playerJSON["name"] === data["requestingName"]) {
            this.clientPlayer = new ClientPlayer(playerJSON);
            this.players.push(this.clientPlayer);
          } else {
            this.players.push(new ExternalPlayer(playerJSON));
          }
        }
      },
    });

    GameMap.init();

    this.on("mapLoaded", () => {
      this.tileInformationLabel = new Label({
        text: "N/A",
        font: "16px serif",
        fontColor: "white",
        x: 0,
        y: 0,
        z: 5,
      });
      this.tileInformationLabel.conformSize().then(() => {
        this.tileInformationLabel.setPosition(
          2,
          Game.getHeight() - this.tileInformationLabel.getHeight() - 6
        );
        this.addActor(this.tileInformationLabel);
      });

      this.statusBar = new StatusBar();
      this.addActor(this.statusBar);

      this.nextTurnButton = new Button({
        text: this.clientPlayer.hasRequestedNextTurn()
          ? "Waiting..."
          : "Next Turn",
        x: Game.getWidth() / 2 - 150 / 2,
        y: Game.getHeight() - 44,
        z: 6,
        width: 150,
        height: 42,
        fontColor: "white",
        onClicked: () => {
          // Undo next turn request.
          if (this.clientPlayer.hasRequestedNextTurn()) {
            this.nextTurnButton.setText("Next Turn");
            WebsocketClient.sendMessage({
              event: "nextTurnRequest",
              value: false,
            });
            this.clientPlayer.setRequestedNextTurn(false);
          } else {
            WebsocketClient.sendMessage({
              event: "nextTurnRequest",
              value: true,
            });
            this.nextTurnButton.setText("Waiting...");
            this.clientPlayer.setRequestedNextTurn(true);
          }
        },
      });
      this.addActor(this.nextTurnButton);

      this.closeCityDisplayButton = new Button({
        text: "Return to Map",
        x: Game.getWidth() / 2 - 275 / 2,
        y: Game.getHeight() - 88,
        z: 5,
        width: 275,
        height: 52,
        fontColor: "white",
        onClicked: () => {
          this.toggleCityUI();
        },
      });

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
      //DEBUG top layer chunks -
      /* GameMap.getInstance()
        .getTopLayerChunks()
        .forEach((tiles, chunkActor) => {
          this.addActor(
            new Actor({
              image: Game.getImage(GameImage.DEBUG),
              x: chunkActor.getX(),
              y: chunkActor.getY(),
              width: chunkActor.getWidth(),
              height: chunkActor.getHeight(),
              transparency: 0.25,
            })
          );
        });*/

      if (this.firstLoad) {
        WebsocketClient.sendMessage({ event: "loadedIn" });
      }

      NetworkEvents.on({
        eventName: "newTurn",
        parentObject: this,
        callback: (data) => {
          this.nextTurnButton.setText("Next Turn");
          this.clientPlayer.setRequestedNextTurn(false);
        },
      });
    });
  }

  public focusOnTile(tile: Tile, zoomAmount: number) {
    const x = tile.getCenterPosition()[0];
    const y = tile.getCenterPosition()[1];

    Game.getCurrentScene().getCamera().zoomToLocation(x, y, zoomAmount);
  }

  public toggleCityUI(city?: City) {
    if (!this.cityDisplayInfo && city) {
      this.openCityUI(city);
    } else {
      this.closeCityUI();
    }
  }

  public getPlayers() {
    return this.players;
  }

  public getClientPlayer() {
    return this.clientPlayer;
  }

  private openCityUI(city: City) {
    if (city.getPlayer() != this.clientPlayer || !city.hasStats()) {
      return;
    }

    this.cityDisplayInfo = new CityDisplayInfo(city);
    this.addActor(this.cityDisplayInfo);

    //Center camera on city
    this.focusOnTile(city.getTile(), 3);
    this.getCamera().lock(true);

    this.removeActor(this.nextTurnButton);
    this.removeActor(this.tileInformationLabel);

    this.addActor(this.closeCityDisplayButton);
  }

  private closeCityUI() {
    this.removeActor(this.cityDisplayInfo);
    this.cityDisplayInfo = undefined;
    this.getCamera().lock(false);

    this.addActor(this.nextTurnButton);
    this.addActor(this.tileInformationLabel);

    this.removeActor(this.closeCityDisplayButton);
  }
}
