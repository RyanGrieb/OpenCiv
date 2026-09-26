import { Scene } from "../Scene";
import { Game } from "../../Game";
import { Button, ButtonSize } from "../../ui/components/Button";
import { ClientSettingsGroup } from "../../ui/menus/ClientSettingsGroup";
import { Label } from "../../ui/components/Label";
import { SceneBackground } from "../SceneBackground";
import { Actor } from "../Actor";
import { GameImage, SpriteRegion } from "../../Assets";

export class MainMenuScene extends Scene {
  private static readonly SETTINGS_WIDTH = 460;
  private static readonly SETTINGS_HEIGHT = 300;
  private static readonly TITLE_ICON_SIZE = 96;
  private static readonly TITLE_ICON_GAP = 16;

  private menuButtons: Button[];
  private settingsGroup: ClientSettingsGroup;

  public onInitialize(): void {
    super.onInitialize();
    this.settingsGroup = undefined;
    this.menuButtons = [];
    this.addActor(SceneBackground.generatePanningGrassland());

    const titleLabel = new Label({
      text: "OpenCiv",
      font: "bold 97px arial",
      fontColor: "white",
      shadowColor: "black",
      lineWidth: 4,
      shadowBlur: 20
    });
    const titleIcon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.TILE_CITY,
      x: 0,
      y: 0,
      width: MainMenuScene.TITLE_ICON_SIZE,
      height: MainMenuScene.TITLE_ICON_SIZE
    });
    titleLabel.conformSize().then(() => {
      const titleWidth = titleLabel.getWidth() + MainMenuScene.TITLE_ICON_GAP + MainMenuScene.TITLE_ICON_SIZE;
      const titleX = Game.getInstance().getWidth() / 2 - titleWidth / 2;
      const titleY = Game.getInstance().getHeight() / 3 - 75;
      titleLabel.setPosition(titleX, titleY);
      titleIcon.setPosition(
        titleX + titleLabel.getWidth() + MainMenuScene.TITLE_ICON_GAP,
        titleY + titleLabel.getHeight() / 2 - MainMenuScene.TITLE_ICON_SIZE / 2
      );
    });

    this.addActor(titleLabel);
    this.addActor(titleIcon);

    /*const backgroundActor = new Actor({
      color: "rgba(0, 0, 0, 0.5)",
      x: Game.getWidth() / 2 - 600 / 2,
      y: Game.getHeight() / 3 + 68 / 2,
      width: 600,
      height: 200,
    });

    this.addActor(backgroundActor);*/

    this.menuButtons.push(
      new Button({
        text: "Play",
        x: Game.getInstance().getWidth() / 2 - ButtonSize.LARGE.width / 2,
        y: Game.getInstance().getHeight() / 3 + 68,
        size: ButtonSize.LARGE,
        fontColor: "white",
        onClicked: () => {
          Game.getInstance().setScene("join_game");
        }
      }),
      new Button({
        text: "Options",
        x: Game.getInstance().getWidth() / 2 - ButtonSize.LARGE.width / 2,
        y: Game.getInstance().getHeight() / 3 + 136,
        size: ButtonSize.LARGE,
        fontColor: "white",
        onClicked: () => {
          this.toggleSettings();
        }
      })
    );

    this.menuButtons.forEach((button) => this.addActor(button));
  }

  // The menu buttons leave the scene meanwhile: clicks aren't occluded by z-order, so one sitting
  // under the window would still take them.
  private toggleSettings() {
    if (this.settingsGroup) {
      this.removeActor(this.settingsGroup);
      this.settingsGroup = undefined;
      this.menuButtons.forEach((button) => this.addActor(button));
      return;
    }

    this.menuButtons.forEach((button) => this.removeActor(button));

    this.settingsGroup = new ClientSettingsGroup({
      x: Game.getInstance().getWidth() / 2 - MainMenuScene.SETTINGS_WIDTH / 2,
      y: Game.getInstance().getHeight() / 2 - MainMenuScene.SETTINGS_HEIGHT / 2,
      width: MainMenuScene.SETTINGS_WIDTH,
      height: MainMenuScene.SETTINGS_HEIGHT,
      onClose: () => this.toggleSettings()
    });

    this.addActor(this.settingsGroup);
  }
}
