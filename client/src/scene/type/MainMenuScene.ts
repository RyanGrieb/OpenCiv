import { Scene } from "../Scene";
import { Game } from "../../Game";
import { Button, ButtonSize } from "../../ui/components/Button";
import { ClientSettingsGroup } from "../../ui/menus/ClientSettingsGroup";
import { ScenarioListGroup } from "../../ui/menus/ScenarioListGroup";
import { Label } from "../../ui/components/Label";
import { SceneBackground } from "../SceneBackground";
import { Actor } from "../Actor";
import { GameImage, SpriteRegion } from "../../Assets";
import { ActorGroup } from "../ActorGroup";

export class MainMenuScene extends Scene {
  private static readonly SETTINGS_WIDTH = 460;
  private static readonly SETTINGS_HEIGHT = 300;
  private static readonly SCENARIOS_WIDTH = 460;
  private static readonly SCENARIOS_HEIGHT = 560;
  private static readonly TITLE_ICON_SIZE = 96;
  private static readonly TITLE_ICON_GAP = 16;

  private menuActors: Actor[];
  private openWindow: ActorGroup;

  public onInitialize(): void {
    super.onInitialize();
    this.openWindow = undefined;
    this.menuActors = [];
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

    this.menuActors.push(titleLabel, titleIcon);

    /*const backgroundActor = new Actor({
      color: "rgba(0, 0, 0, 0.5)",
      x: Game.getWidth() / 2 - 600 / 2,
      y: Game.getHeight() / 3 + 68 / 2,
      width: 600,
      height: 200,
    });

    this.addActor(backgroundActor);*/

    this.menuActors.push(
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
        text: "Scenarios",
        x: Game.getInstance().getWidth() / 2 - ButtonSize.LARGE.width / 2,
        y: Game.getInstance().getHeight() / 3 + 136,
        size: ButtonSize.LARGE,
        fontColor: "white",
        onClicked: () => {
          this.showWindow(this.createScenarioList());
        }
      }),
      new Button({
        text: "Options",
        x: Game.getInstance().getWidth() / 2 - ButtonSize.LARGE.width / 2,
        y: Game.getInstance().getHeight() / 3 + 204,
        size: ButtonSize.LARGE,
        fontColor: "white",
        onClicked: () => {
          this.showWindow(this.createSettings());
        }
      })
    );

    this.menuActors.forEach((actor) => this.addActor(actor));
  }

  // The title and menu buttons leave the scene meanwhile: clicks aren't occluded by z-order, so a
  // button sitting under the window would still take them, and the taller scenario list covers the title.
  private showWindow(group: ActorGroup) {
    this.menuActors.forEach((actor) => this.removeActor(actor));
    this.openWindow = group;
    this.addActor(group);
  }

  private closeWindow() {
    if (!this.openWindow) return;

    this.removeActor(this.openWindow);
    this.openWindow = undefined;
    this.menuActors.forEach((actor) => this.addActor(actor));
  }

  private createSettings(): ClientSettingsGroup {
    return new ClientSettingsGroup({
      x: Game.getInstance().getWidth() / 2 - MainMenuScene.SETTINGS_WIDTH / 2,
      y: Game.getInstance().getHeight() / 2 - MainMenuScene.SETTINGS_HEIGHT / 2,
      width: MainMenuScene.SETTINGS_WIDTH,
      height: MainMenuScene.SETTINGS_HEIGHT,
      onClose: () => this.closeWindow()
    });
  }

  private createScenarioList(): ScenarioListGroup {
    return new ScenarioListGroup({
      x: Game.getInstance().getWidth() / 2 - MainMenuScene.SCENARIOS_WIDTH / 2,
      y: Game.getInstance().getHeight() / 2 - MainMenuScene.SCENARIOS_HEIGHT / 2,
      width: MainMenuScene.SCENARIOS_WIDTH,
      height: MainMenuScene.SCENARIOS_HEIGHT,
      onClose: () => this.closeWindow()
    });
  }
}
