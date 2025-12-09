import { GameImage, SpriteRegion } from "../../Assets";
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
import { Actor } from "../Actor";
import { ActorGroup } from "../ActorGroup";
import { Camera } from "../Camera";
import { Scene } from "../Scene";

export class InGameScene extends Scene {
  private players: AbstractPlayer[];
  private clientPlayer: ClientPlayer;
  private tileInformationLabel: Label;
  private tileYieldActors: Actor[] = [];
  private statusBar: StatusBar;
  private cityDisplayInfo: CityDisplayInfo;
  private nextTurnButton: Button;
  private closeCityDisplayButton: Button;
  private escMenu: ActorGroup;
  private isUIOpen: boolean = false;
  private activeGameplayUI: { close: () => void };

  public onInitialize(): void {
    this.players = [];
    if (this.firstLoad) {
      const camera = new Camera({
        wasd_controls: false,
        mouse_controls: true,
        arrow_controls: true
        //initial_position: [1, 1],
      });
      this.setCamera(camera);
    } else {
      this.restoreCamera();
    }

    this.on("keyup", (options) => {
      if (options.key === "Escape") {
        if (this.activeGameplayUI) {
          this.activeGameplayUI.close();
        } else {
          this.toggleEscMenu();
        }
      }
    });

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
      }
    });

    GameMap.init();

    this.on("mapLoaded", () => {
      this.tileInformationLabel = new Label({
        text: "N/A",
        font: "16px serif",
        fontColor: "white",
        shadowColor: "black",
        lineWidth: 4,
        x: 0,
        y: 0,
        z: 5
      });

      this.tileInformationLabel.conformSize().then(() => {
        this.tileInformationLabel.setPosition(
          2,
          Game.getInstance().getHeight() - this.tileInformationLabel.getHeight() - 6
        );
        this.addActor(this.tileInformationLabel);
      });

      this.statusBar = new StatusBar();
      this.addActor(this.statusBar);

      this.nextTurnButton = new Button({
        text: this.clientPlayer.hasRequestedNextTurn() ? "Waiting..." : "Next Turn",
        x: Game.getInstance().getWidth() / 2 - 150 / 2,
        y: Game.getInstance().getHeight() - 44,
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
              value: false
            });
            this.clientPlayer.setRequestedNextTurn(false);
          } else {
            WebsocketClient.sendMessage({
              event: "nextTurnRequest",
              value: true
            });
            this.nextTurnButton.setText("Waiting...");
            this.clientPlayer.setRequestedNextTurn(true);
          }
        }
      });
      this.addActor(this.nextTurnButton);

      this.closeCityDisplayButton = new Button({
        text: "Return to Map",
        x: Game.getInstance().getWidth() / 2 - 275 / 2,
        y: Game.getInstance().getHeight() - 88,
        z: 5,
        width: 275,
        height: 52,
        fontColor: "white",
        onClicked: () => {
          this.toggleCityUI();
        }
      });

      this.on("tileHovered", (options) => {
        // Remove previous yield icons
        for (const actor of this.tileYieldActors) {
          this.removeActor(actor);
        }

        this.tileYieldActors = [];

        if (options.tile && !this.isUIOpen) {
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

          // Get tile yields
          const yields = options.tile.getTileYield();

          // Map stat keys to SpriteRegion
          const statSpriteRegions: Record<string, SpriteRegion> = {
            food: SpriteRegion.FOOD_ICON,
            production: SpriteRegion.PRODUCTION_ICON,
            gold: SpriteRegion.GOLD_ICON,
            faith: SpriteRegion.FAITH_ICON,
            morale: SpriteRegion.MORALE_ICON,
            science: SpriteRegion.SCIENCE_ICON,
            culture: SpriteRegion.CULTURE_ICON,
          };

          // Set the label text (without yields)
          this.tileInformationLabel.setText(
            `[${options.tile.getGridX()},${options.tile.getGridY()}] ` +
            tileTypes +
            (options.tile.hasRiver() ? ", River" : "")
          );



          this.tileInformationLabel.conformSize().then(() => {
            // Positioning for icons (right after the label)
            let iconX = this.tileInformationLabel.getX() + this.tileInformationLabel.getWidth();
            const iconY = this.tileInformationLabel.getY() - 10;

            if (yields) {
              for (const [key, value] of Object.entries(yields)) {
                if (typeof value === "number" && value > 0 && statSpriteRegions[key]) {
                  // Create icon actor
                  const iconActor = new Actor({
                    image: Game.getInstance().getImage(GameImage.SPRITESHEET),
                    spriteRegion: statSpriteRegions[key],
                    x: iconX,
                    y: iconY,
                    width: 32,
                    height: 32,
                    z: 10,
                    cameraApplies: false
                  });
                  this.addActor(iconActor);
                  this.tileYieldActors.push(iconActor);

                  // Create value label
                  const valueLabel = new Label({
                    text: value.toString(),
                    font: "16px serif",
                    fontColor: "white",
                    shadowColor: "black",
                    lineWidth: 4,
                    x: iconX + iconActor.getWidth() - 6,
                    y: this.tileInformationLabel.getY(),
                    z: 10
                  });
                  this.addActor(valueLabel);
                  this.tileYieldActors.push(valueLabel);

                  // Move X for next icon
                  iconX += 42;
                }
              }
            }
          });

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
        }
      });
    });
  }

  public onDestroyed() {
    super.onDestroyed(this);
    this.escMenu = undefined;
    this.cityDisplayInfo = undefined;

    return Scene.ExitReceipt;
  }

  public focusOnTile(tile: Tile, zoomAmount: number) {
    const x = tile.getCenterPosition().x;
    const y = tile.getCenterPosition().y;

    Game.getInstance().getCurrentScene().getCamera().zoomToLocation(x, y, zoomAmount);
  }

  public toggleCityUI(city?: City) {
    if (!this.cityDisplayInfo && city) {
      if (this.isUIOpen) return;
      this.openCityUI(city);
      this.call("toggleCityUI", { opened: true, city: city });
    } else {
      this.closeCityUI();
      // Only emit toggleCityUI closed if we are actually closing it (handled in closeCityUI usually, but here we coordinate)
      this.call("toggleCityUI", { opened: false, city: city });
    }
  }

  private setUIState(isOpen: boolean) {
    this.isUIOpen = isOpen;
    this.getCamera().lock(isOpen);
    this.call("uiStateChanged", { opened: isOpen });

    if (isOpen) {
      this.tileInformationLabel.setText("");
      this.tileYieldActors.forEach((actor) => {
        this.removeActor(actor);
      });
      this.tileYieldActors = [];
    } else {
      this.systemMenuOpen = false;
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
    this.setUIState(true);
    this.systemMenuOpen = false;

    this.activeGameplayUI = { close: () => this.toggleCityUI() };

    this.removeActor(this.nextTurnButton);
    this.removeActor(this.tileInformationLabel);

    this.addActor(this.closeCityDisplayButton);
  }

  private closeCityUI() {
    this.removeActor(this.cityDisplayInfo);
    this.cityDisplayInfo = undefined;
    this.setUIState(false);
    this.activeGameplayUI = undefined;

    this.addActor(this.nextTurnButton);
    this.addActor(this.tileInformationLabel);

    this.removeActor(this.closeCityDisplayButton);
  }

  private toggleEscMenu() {
    if (this.escMenu) {
      this.removeActor(this.escMenu);
      this.escMenu = undefined;
      this.systemMenuOpen = false;
      this.setUIState(false);
      return;
    }

    this.setUIState(true);
    this.systemMenuOpen = true;

    this.escMenu = new ActorGroup({
      x: Game.getInstance().getWidth() / 2 - 250 / 2,
      y: Game.getInstance().getHeight() / 2 - 250 / 2,
      width: 250,
      height: 275,
      cameraApplies: false
    });

    this.escMenu.addActor(
      new Actor({
        x: this.escMenu.getX(),
        y: this.escMenu.getY(),
        width: this.escMenu.getWidth(),
        height: this.escMenu.getHeight(),
        image: Game.getInstance().getImage(GameImage.POPUP_BOX),
        nineSlice: true,
        cornerSize: 20
      })
    );

    this.escMenu.addActor(
      new Button({
        text: "Return",
        x: this.escMenu.getX() + 23,
        y: this.escMenu.getY() + 23,
        width: 210,
        height: 50,
        fontColor: "white",
        onClicked: () => {
          this.escMenu = undefined;
          this.setUIState(false);
        }
      })
    );

    this.escMenu.addActor(
      new Button({
        text: "Settings",
        x: this.escMenu.getX() + 23,
        y: this.escMenu.getY() + 83,
        width: 210,
        height: 50,
        fontColor: "white",
        onClicked: () => {
          console.log("Toggle settings menu");
        }
      })
    );

    this.escMenu.addActor(
      new Button({
        text: "Save Game",
        x: this.escMenu.getX() + 23,
        y: this.escMenu.getY() + 143,
        width: 210,
        height: 50,
        fontColor: "white",
        onClicked: () => { }
      })
    );

    this.escMenu.addActor(
      new Button({
        text: "Main Menu",
        x: this.escMenu.getX() + 23,
        y: this.escMenu.getY() + 203,
        width: 210,
        height: 50,
        fontColor: "white",
        onClicked: () => {
          WebsocketClient.disconnect();
          Game.getInstance().setScene("main_menu");
          this.firstLoad = true;
        }
      })
    );

    this.addActor(this.escMenu);
  }
}
