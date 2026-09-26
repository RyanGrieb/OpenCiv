import { Scene } from "../Scene";
import { Game } from "../../Game";
import { Button, ButtonSize } from "../../ui/components/Button";
import { ClientSettingsGroup } from "../../ui/menus/ClientSettingsGroup";
import { Label } from "../../ui/components/Label";
import { SceneBackground } from "../SceneBackground";

export class MainMenuScene extends Scene {
  private static readonly SETTINGS_WIDTH = 460;
  private static readonly SETTINGS_HEIGHT = 300;

  private menuButtons: Button[];
  private settingsGroup: ClientSettingsGroup;

  public onInitialize(): void {
    super.onInitialize();
    this.settingsGroup = undefined;
    this.menuButtons = [];
    this.addActor(SceneBackground.generatePanningGrassland());

    const titleLabel = new Label({
      text: "Open Civilization",
      font: "bold 97px arial",
      fontColor: "white",
      shadowColor: "black",
      lineWidth: 4,
      shadowBlur: 20
    });
    titleLabel.conformSize().then(() => {
      titleLabel.setPosition(
        Game.getInstance().getWidth() / 2 - titleLabel.getWidth() / 2,
        Game.getInstance().getHeight() / 3 - 75
      );
    });

    this.addActor(titleLabel);

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
