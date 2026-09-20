import { GameImage, resolveSpriteRegion, SpriteRegion } from "../../Assets";
import { Game } from "../../Game";
import { NetworkEvents, WebsocketClient } from "../../network/Client";
import { CivilizationData } from "../../player/AbstractPlayer";
import { Button, ButtonSize } from "../../ui/Button";
import { GameOptionsGroup } from "../../ui/GameOptionsGroup";
import { ListBox } from "../../ui/Listbox";
import { PlaceholderDialogGroup } from "../../ui/PlaceholderDialogGroup";
import { SelectCivilizationGroup } from "../../ui/SelectCivilizationGroup";
import { Actor } from "../Actor";
import { ActorGroup } from "../ActorGroup";
import { Scene } from "../Scene";
import { SceneBackground } from "../SceneBackground";

// In the lobby (before civ selection), a player may not have chosen a civilization yet.
interface LobbyPlayerEntry {
  name: string;
  civData?: CivilizationData;
}

interface ConnectedPlayersEvent {
  players: LobbyPlayerEntry[];
  requestingName: string;
}

interface SelectCivEvent {
  playerName: string;
  civData: CivilizationData;
}

export class LobbyScene extends Scene {
  private static readonly BOX_WIDTH = 480;
  private static readonly PANEL_GAP = 40;
  private static readonly PLAYER_ROW_HEIGHT = 50;
  private static readonly BUTTON_ICON_PADDING = 24;

  private playerList: ListBox;
  private rightPanelX: number;
  private rightPanelY: number;
  private rightPanelHeight: number;
  private rightPanelContent: ActorGroup;

  public onInitialize(): void {
    super.onInitialize();
    this.addActor(SceneBackground.generatePanningGrassland());

    const contentWidth = LobbyScene.BOX_WIDTH + LobbyScene.PANEL_GAP + LobbyScene.BOX_WIDTH;
    const contentX = Game.getInstance().getWidth() / 2 - contentWidth / 2;
    const contentHeight = Game.getInstance().getHeight() - 275;

    this.playerList = new ListBox({
      x: contentX,
      y: 35,
      width: LobbyScene.BOX_WIDTH,
      height: contentHeight,
      rowHeight: LobbyScene.PLAYER_ROW_HEIGHT,
      textFont: "20px serif",
      fontColor: "white"
    });
    this.addActor(this.playerList);

    this.rightPanelX = contentX + LobbyScene.BOX_WIDTH + LobbyScene.PANEL_GAP;
    this.rightPanelY = 35;
    this.rightPanelHeight = contentHeight;

    this.showButtonPanel();

    this.updatePlayerList();

    NetworkEvents.on({
      eventName: "playerJoin",
      parentObject: this,
      callback: this.updatePlayerList
    });
    NetworkEvents.on({
      eventName: "playerQuit",
      parentObject: this,
      callback: this.updatePlayerList
    });
    NetworkEvents.on({
      eventName: "playerLeave",
      parentObject: this,
      callback: this.updatePlayerList
    });

    NetworkEvents.on<ConnectedPlayersEvent>({
      eventName: "connectedPlayers",
      parentObject: this,
      callback: (data) => {
        const players = data.players;
        const requestingName = data.requestingName;
        this.playerList.clearRows();

        for (let i = 0; i < players.length; i++) {
          const playerName = players[i].name;
          let civIcon = SpriteRegion.ICON_UNKNOWN;
          if (players[i].civData) {
            civIcon = resolveSpriteRegion(players[i].civData.icon_name);
          }

          const currentRow = this.playerList.addRow({
            text: playerName
          });

          currentRow.addActor(
            new Actor({
              image: Game.getInstance().getImage(GameImage.SPRITESHEET),
              spriteRegion: civIcon,
              x: currentRow.getX() + 8,
              y: currentRow.getY() - 32 / 2 + currentRow.getHeight() / 2,
              width: 32,
              height: 32
            })
          );

          if (playerName === requestingName) {
            // TODO: Indicate this row is the users player
            currentRow.addActor(
              new Actor({
                image: Game.getInstance().getImage(GameImage.SPRITESHEET),
                spriteRegion: SpriteRegion.ICON_STAR,
                x: currentRow.getX() + currentRow.getWidth() - 32 - 8,
                y: currentRow.getY() - 32 / 2 + currentRow.getHeight() / 2,
                width: 32,
                height: 32
              })
            );
          }

          currentRow.conformLabelSize().then(() => {
            currentRow.setLabelPosition(
              currentRow.getX() + 48,
              currentRow.getY() + currentRow.getHeight() / 2 - currentRow.getLabel().getHeight() / 2
            );
          });
        }

        // Pad out the rest of the box with empty slot rows so the list still reads as
        // a player list (rather than a mostly-blank box) when few players have joined.
        const visibleRowCount = Math.floor(this.playerList.getHeight() / LobbyScene.PLAYER_ROW_HEIGHT);
        for (let i = players.length; i < visibleRowCount; i++) {
          this.playerList.addRow({
            text: "Empty Slot",
            textX: this.playerList.getX() + 48,
            centerTextY: true
          });
        }
      }
    });

    NetworkEvents.on<SelectCivEvent>({
      eventName: "selectCiv",
      parentObject: this,
      callback: (data) => {
        for (const row of this.playerList.getRows()) {
          if (row.getLabel().getText() !== data.playerName) {
            continue;
          }

          for (const rowActor of row.getActors()) {
            if (rowActor.getSpriteRegion() === SpriteRegion.ICON_STAR) {
              continue;
            }

            rowActor.setSpriteRegion(resolveSpriteRegion(data.civData.icon_name));
          }
        }
      }
    });
  }

  public onDestroyed(newScene: Scene) {
    const exitReceipt = super.onDestroyed(newScene);
    // Disconnect from the server if we go back, unless were going into the loading scene or reloading this scene.
    if (newScene.getName() !== "loading_scene" && newScene.getName() !== "lobby") {
      WebsocketClient.disconnect();
    }

    return exitReceipt;
  }

  private updatePlayerList() {
    WebsocketClient.sendMessage({ event: "connectedPlayers" });
  }

  private showButtonPanel(): void {
    this.removeActor(this.rightPanelContent);

    const panel = new ActorGroup({
      x: this.rightPanelX,
      y: this.rightPanelY,
      width: LobbyScene.BOX_WIDTH,
      height: this.rightPanelHeight
    });

    panel.addActor(
      new Actor({
        image: Game.getInstance().getImage(GameImage.POPUP_BOX),
        x: this.rightPanelX,
        y: this.rightPanelY,
        width: LobbyScene.BOX_WIDTH,
        height: this.rightPanelHeight,
        nineSlice: true,
        cornerSize: 20
      })
    );

    const buttonDefs: { text: string; icon?: SpriteRegion; onClicked: () => void }[] = [
      {
        text: "Choose Civilization",
        icon: SpriteRegion.ICON_UNKNOWN,
        onClicked: () => this.showDialog(this.createSelectCivilizationDialog())
      },
      {
        text: "Game Options",
        icon: SpriteRegion.ICON_PRODUCTION,
        onClicked: () => this.showDialog(this.createGameOptionsDialog())
      },
      {
        text: "Scenarios",
        icon: SpriteRegion.ICON_SETTLE,
        onClicked: () => this.showDialog(this.createPlaceholderDialog("Scenarios"))
      },
      {
        text: "Ready Up",
        icon: SpriteRegion.ICON_ACCEPT,
        // TODO: Change text of this button & prevent repeated clicks.
        onClicked: () => WebsocketClient.sendMessage({ event: "setState", state: "in_game" })
      },
      {
        text: "Back",
        //TODO: Disconnect player
        onClicked: () => Game.getInstance().setScene("join_game")
      }
    ];

    const buttonSpacing = 75;
    const buttonX = this.rightPanelX + LobbyScene.BOX_WIDTH / 2 - ButtonSize.LARGE.width / 2;
    const buttonIconX = buttonX + LobbyScene.BUTTON_ICON_PADDING;
    const stackHeight = (buttonDefs.length - 1) * buttonSpacing + ButtonSize.LARGE.height;
    const stackStartY = this.rightPanelY + this.rightPanelHeight / 2 - stackHeight / 2;

    buttonDefs.forEach((buttonDef, index) => {
      panel.addActor(
        new Button({
          text: buttonDef.text,
          icon: buttonDef.icon,
          iconX: buttonDef.icon ? buttonIconX : undefined,
          x: buttonX,
          y: stackStartY + index * buttonSpacing,
          size: ButtonSize.LARGE,
          fontColor: "white",
          onClicked: buttonDef.onClicked
        })
      );
    });

    this.rightPanelContent = panel;
    this.addActor(panel);
  }

  private showDialog(dialog: ActorGroup): void {
    this.removeActor(this.rightPanelContent);
    this.rightPanelContent = dialog;
    this.addActor(dialog);
  }

  private createSelectCivilizationDialog(): SelectCivilizationGroup {
    return new SelectCivilizationGroup(
      this.rightPanelX,
      this.rightPanelY,
      LobbyScene.BOX_WIDTH,
      this.rightPanelHeight,
      () => this.showButtonPanel()
    );
  }

  private createGameOptionsDialog(): GameOptionsGroup {
    return new GameOptionsGroup({
      x: this.rightPanelX,
      y: this.rightPanelY,
      width: LobbyScene.BOX_WIDTH,
      height: this.rightPanelHeight,
      onClose: () => this.showButtonPanel()
    });
  }

  private createPlaceholderDialog(title: string): PlaceholderDialogGroup {
    return new PlaceholderDialogGroup({
      title,
      x: this.rightPanelX,
      y: this.rightPanelY,
      width: LobbyScene.BOX_WIDTH,
      height: this.rightPanelHeight,
      onClose: () => this.showButtonPanel()
    });
  }
}
