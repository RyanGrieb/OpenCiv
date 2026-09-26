import { GameImage, SpriteRegion } from "../../Assets";
import { Game } from "../../Game";
import { City } from "../../city/City";
import { GameMap } from "../../map/GameMap";
import { Tile } from "../../map/Tile";
import { NetworkEvents, WebsocketClient } from "../../network/Client";
import { Notifications } from "../../notification/Notifications";
import { AbstractPlayer } from "../../player/AbstractPlayer";
import { ClientPlayer } from "../../player/ClientPlayer";
import { ExternalPlayer } from "../../player/ExternalPlayer";
import { Button, ButtonSize } from "../../ui/Button";
import { CityDisplayInfo } from "../../ui/CityDisplayInfo";
import { ClientSettingsGroup } from "../../ui/ClientSettingsGroup";
import { Label } from "../../ui/Label";
import { NotificationPanel } from "../../ui/NotificationPanel";
import { ResearchDisplayInfo } from "../../ui/ResearchDisplayInfo";
import { ResearchTreeWindow } from "../../ui/ResearchTreeWindow";
import { StatusBar } from "../../ui/StatusBar";
import { UITheme } from "../../ui/UITheme";
import { Actor } from "../Actor";
import { ActorGroup } from "../ActorGroup";
import { Camera } from "../Camera";
import { Scene } from "../Scene";

interface GameplayUIElement {
  close(): void;
}

export class InGameScene extends Scene {
  private static readonly SETTINGS_WIDTH = 460;
  private static readonly SETTINGS_HEIGHT = 300;

  private players: AbstractPlayer[];
  private clientPlayer: ClientPlayer;
  private tileInformationLabel: Label;
  private tileYieldActors: Actor[] = [];
  private statusBar: StatusBar;
  private researchDisplayInfo: ResearchDisplayInfo;
  private notifications: Notifications;
  private notificationPanel: NotificationPanel;
  private researchTreeWindow: ResearchTreeWindow;
  private cityDisplayInfo: CityDisplayInfo;
  private nextTurnButton: Button;
  private closeCityDisplayButton: Button;
  private escMenu: ActorGroup;
  private settingsGroup: ClientSettingsGroup;
  private openUIElement: GameplayUIElement;

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
        if (this.openUIElement) {
          this.closeOpenUIElement();
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

          // This event can fire more than once per session (e.g. a reconnect); skip
          // players we're already tracking instead of replacing them, since other
          // objects (e.g. City) hold onto the original player instance by reference.
          if (this.players.some((player) => player.getName() === playerJSON["name"])) {
            continue;
          }

          if (playerJSON["name"] === data["requestingName"]) {
            this.clientPlayer = new ClientPlayer(playerJSON);
            this.players.push(this.clientPlayer);
          } else {
            this.players.push(new ExternalPlayer(playerJSON));
          }
        }

        // Run by the server rather than connected, so it comes separately from the players list.
        const barbarians = data["barbarians"];
        if (barbarians && !this.players.some((player) => player.getName() === barbarians["name"])) {
          this.players.push(new ExternalPlayer(barbarians));
        }
      }
    });

    GameMap.init();

    this.on("mapLoaded", () => {
      this.notifications = new Notifications(this.clientPlayer);
      this.notifications.onChange(() => this.refreshNextTurnButton());
      this.initializePersistentUI();

      this.on("tileHovered", (options) => {
        // Remove previous yield icons
        for (const actor of this.tileYieldActors) {
          this.removeActor(actor);
        }

        this.tileYieldActors = [];

        if (options.tile && !this.openUIElement) {
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
            food: SpriteRegion.ICON_FOOD,
            production: SpriteRegion.ICON_PRODUCTION,
            gold: SpriteRegion.ICON_GOLD,
            faith: SpriteRegion.ICON_FAITH,
            morale: SpriteRegion.ICON_MORALE,
            science: SpriteRegion.ICON_SCIENCE,
            culture: SpriteRegion.ICON_CULTURE
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
            const iconY = this.tileInformationLabel.getY() - UITheme.centerTextY(UITheme.ICON_SIZE);

            if (yields) {
              for (const [key, value] of Object.entries(yields)) {
                if (typeof value === "number" && value > 0 && statSpriteRegions[key]) {
                  // Create icon actor
                  const iconActor = new Actor({
                    image: Game.getInstance().getImage(GameImage.SPRITESHEET),
                    spriteRegion: statSpriteRegions[key],
                    x: iconX,
                    y: iconY,
                    width: UITheme.ICON_SIZE,
                    height: UITheme.ICON_SIZE,
                    z: 10,
                    cameraApplies: false
                  });
                  this.addActor(iconActor);
                  this.tileYieldActors.push(iconActor);

                  // Create value label
                  const valueLabel = new Label({
                    text: value.toString(),
                    font: UITheme.FONT,
                    fontColor: "white",
                    shadowColor: "black",
                    lineWidth: 4,
                    x: iconX + iconActor.getWidth() - 8,
                    y: this.tileInformationLabel.getY(),
                    z: 10
                  });
                  this.addActor(valueLabel);
                  this.tileYieldActors.push(valueLabel);

                  // Move X for next icon
                  iconX += UITheme.ICON_SIZE + 12;
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
          this.clientPlayer.setRequestedNextTurn(false);
          this.refreshNextTurnButton();
        }
      });
    });
  }

  public onDestroyed() {
    super.onDestroyed(this);
    this.escMenu = undefined;
    this.settingsGroup = undefined;
    this.cityDisplayInfo = undefined;
    this.researchTreeWindow = undefined;
    this.openUIElement = undefined;
    this.notifications = undefined;
    this.notificationPanel = undefined;

    return Scene.ExitReceipt;
  }

  // A window resize only needs the screen-anchored UI repositioned - the base
  // Scene.redraw() destroys/reinitializes everything, which would tear down and
  // re-fetch the whole map (losing city buildings, which never get resent on resync).
  public redraw() {
    this.closeOpenUIElement();

    this.removeActor(this.tileInformationLabel);
    this.removeActor(this.statusBar);
    this.removeActor(this.researchDisplayInfo);
    this.removeActor(this.notificationPanel);
    this.removeActor(this.nextTurnButton);
    this.removeActor(this.closeCityDisplayButton);

    this.initializePersistentUI();
  }

  private closeOpenUIElement() {
    if (this.openUIElement) {
      this.openUIElement.close();
    }
  }

  private initializePersistentUI() {
    this.tileInformationLabel = new Label({
      text: "N/A",
      font: UITheme.FONT,
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

    this.researchDisplayInfo = new ResearchDisplayInfo();
    this.addActor(this.researchDisplayInfo);

    this.notificationPanel = new NotificationPanel(this.notifications);
    this.addActor(this.notificationPanel);

    this.nextTurnButton = new Button({
      text: this.getNextTurnButtonText(),
      x: Game.getInstance().getWidth() / 2 - ButtonSize.LARGE.width / 2,
      y: Game.getInstance().getHeight() - ButtonSize.LARGE.height - 4,
      z: 6,
      size: ButtonSize.LARGE,
      fontColor: "white",
      onClicked: () => this.onNextTurnClicked()
    });
    this.addActor(this.nextTurnButton);

    this.closeCityDisplayButton = new Button({
      text: "Return to Map",
      x: Game.getInstance().getWidth() / 2 - ButtonSize.LARGE.width / 2,
      y: Game.getInstance().getHeight() - ButtonSize.LARGE.height - 4,
      z: 5,
      size: ButtonSize.LARGE,
      fontColor: "white",
      onClicked: () => {
        this.toggleCityUI();
      }
    });
  }

  private onNextTurnClicked() {
    // Undo next turn request.
    if (this.clientPlayer.hasRequestedNextTurn()) {
      this.setRequestedNextTurn(false);
      return;
    }

    // Like Civ 5, the button takes the player to what still needs a decision instead of ending the turn.
    const turnBlocker = this.notifications.getTurnBlocker();
    if (turnBlocker) {
      this.notifications.act(turnBlocker);
      return;
    }

    this.setRequestedNextTurn(true);
  }

  private setRequestedNextTurn(requested: boolean) {
    WebsocketClient.sendMessage({
      event: "nextTurnRequest",
      value: requested
    });
    this.clientPlayer.setRequestedNextTurn(requested);
    this.refreshNextTurnButton();
  }

  private refreshNextTurnButton() {
    this.nextTurnButton?.setText(this.getNextTurnButtonText());
  }

  private getNextTurnButtonText(): string {
    if (this.clientPlayer.hasRequestedNextTurn()) return "Waiting...";

    return this.notifications.getTurnBlocker()?.turnBlockingLabel ?? "Next Turn";
  }

  public focusOnTile(tile: Tile, zoomAmount: number) {
    const x = tile.getCenterPosition().x;
    const y = tile.getCenterPosition().y;

    Game.getInstance().getCurrentScene().getCamera().zoomToLocation(x, y, zoomAmount);
  }

  public toggleCityUI(city?: City) {
    if (!this.cityDisplayInfo && city) {
      if (this.openUIElement) return;
      this.clientPlayer.unselectUnit();
      this.openCityUI(city);
      this.call("toggleCityUI", { opened: true, city: city });
    } else {
      this.closeCityUI();
      // Only emit toggleCityUI closed if we are actually closing it (handled in closeCityUI usually, but here we coordinate)
      this.call("toggleCityUI", { opened: false, city: city });
    }
  }

  public getNotifications(): Notifications {
    return this.notifications;
  }

  public isOverNotifications(x: number, y: number): boolean {
    return this.notificationPanel?.isOverRow(x, y) ?? false;
  }

  public getNextTurnButton(): Button {
    return this.nextTurnButton;
  }

  public getResearchTreeWindow(): ResearchTreeWindow | undefined {
    return this.researchTreeWindow;
  }

  public toggleResearchUI() {
    if (!this.researchTreeWindow) {
      if (this.openUIElement) return;
      this.openResearchUI();
    } else {
      this.closeResearchUI();
    }
  }

  private setUIState(isOpen: boolean) {
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

    this.openUIElement = { close: () => this.toggleCityUI() };

    this.removeActor(this.nextTurnButton);
    this.removeActor(this.tileInformationLabel);
    this.removeActor(this.researchDisplayInfo);
    this.removeActor(this.notificationPanel);

    this.addActor(this.closeCityDisplayButton);
  }

  private closeCityUI() {
    this.removeActor(this.cityDisplayInfo);
    this.cityDisplayInfo = undefined;
    this.setUIState(false);
    this.openUIElement = undefined;

    this.addActor(this.nextTurnButton);
    this.addActor(this.tileInformationLabel);
    this.addActor(this.researchDisplayInfo);
    this.addActor(this.notificationPanel);

    this.removeActor(this.closeCityDisplayButton);
  }

  private openResearchUI() {
    this.researchTreeWindow = new ResearchTreeWindow();
    this.addActor(this.researchTreeWindow);
    this.setWorldHidden(true);

    this.setUIState(true);
    this.systemMenuOpen = false;
    this.openUIElement = { close: () => this.toggleResearchUI() };

    this.removeActor(this.nextTurnButton);
    this.removeActor(this.tileInformationLabel);
    this.removeActor(this.researchDisplayInfo);
    this.removeActor(this.notificationPanel);
  }

  private closeResearchUI() {
    this.removeActor(this.researchTreeWindow);
    this.researchTreeWindow = undefined;
    this.setWorldHidden(false);
    this.setUIState(false);
    this.openUIElement = undefined;

    this.addActor(this.nextTurnButton);
    this.addActor(this.tileInformationLabel);
    this.addActor(this.researchDisplayInfo);
    this.addActor(this.notificationPanel);
  }

  // The esc menu leaves the scene meanwhile: clicks aren't occluded by z-order, so its "Main Menu"
  // button would also fire through this window's "Back".
  private toggleSettings() {
    if (this.settingsGroup) {
      this.removeActor(this.settingsGroup);
      this.settingsGroup = undefined;
      this.addActor(this.escMenu);
      this.openUIElement = { close: () => this.toggleEscMenu() };
      return;
    }

    this.removeActor(this.escMenu);

    this.settingsGroup = new ClientSettingsGroup({
      x: Game.getInstance().getWidth() / 2 - InGameScene.SETTINGS_WIDTH / 2,
      y: Game.getInstance().getHeight() / 2 - InGameScene.SETTINGS_HEIGHT / 2,
      width: InGameScene.SETTINGS_WIDTH,
      height: InGameScene.SETTINGS_HEIGHT,
      onClose: () => this.toggleSettings()
    });

    this.addActor(this.settingsGroup);
    this.openUIElement = { close: () => this.toggleSettings() };
  }

  private toggleEscMenu() {
    if (this.escMenu) {
      if (this.settingsGroup) {
        this.removeActor(this.settingsGroup);
        this.settingsGroup = undefined;
      }

      this.removeActor(this.escMenu);
      this.escMenu = undefined;
      this.systemMenuOpen = false;
      this.setUIState(false);
      this.openUIElement = undefined;
      return;
    }

    this.setUIState(true);
    this.systemMenuOpen = true;
    this.openUIElement = { close: () => this.toggleEscMenu() };
    Game.getInstance().setCursor("default");

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

    const escMenuButtonX = this.escMenu.getX() + this.escMenu.getWidth() / 2 - ButtonSize.MEDIUM.width / 2;

    this.escMenu.addActor(
      new Button({
        text: "Return",
        x: escMenuButtonX,
        y: this.escMenu.getY() + 23,
        size: ButtonSize.MEDIUM,
        fontColor: "white",
        onClicked: () => {
          this.toggleEscMenu();
        }
      })
    );

    this.escMenu.addActor(
      new Button({
        text: "Settings",
        x: escMenuButtonX,
        y: this.escMenu.getY() + 83,
        size: ButtonSize.MEDIUM,
        fontColor: "white",
        onClicked: () => {
          this.toggleSettings();
        }
      })
    );

    this.escMenu.addActor(
      new Button({
        text: "Save Game",
        x: escMenuButtonX,
        y: this.escMenu.getY() + 143,
        size: ButtonSize.MEDIUM,
        fontColor: "white",
        onClicked: () => {}
      })
    );

    this.escMenu.addActor(
      new Button({
        text: "Main Menu",
        x: escMenuButtonX,
        y: this.escMenu.getY() + 203,
        size: ButtonSize.MEDIUM,
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
