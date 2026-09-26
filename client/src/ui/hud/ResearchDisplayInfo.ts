import { ClientSettings } from "../../ClientSettings";
import { GameImage, SpriteRegion, resolveSpriteRegion } from "../../Assets";
import { Game } from "../../Game";
import { NetworkEvents } from "../../network/Client";
import { CurrentResearch } from "../../player/ClientPlayer";
import { Actor } from "../../scene/Actor";
import { ActorGroup } from "../../scene/ActorGroup";
import { InGameScene } from "../../scene/type/InGameScene";
import { Button, ButtonSize } from "../components/Button";
import { Label } from "../components/Label";
import { LoadingBar } from "../components/LoadingBar";
import { UITheme } from "../UITheme";

const WIDTH = 320;
const HEIGHT = 146;
const PADDING = 10;
const PROGRESS_BAR_HEIGHT = 10;

// Top-left "currently researching" popup. Mirrors CityDisplayInfo's POPUP_BOX layout.
export class ResearchDisplayInfo extends ActorGroup {
  private turnsLabel: Label;
  private progressBar: LoadingBar;
  private techIcon: Actor;
  private nameLabel: Label;

  constructor() {
    const x = PADDING;
    const y = UITheme.STATUS_BAR_HEIGHT + PADDING;

    super({ x, y, z: 5, width: WIDTH, height: HEIGHT, cameraApplies: false });

    this.generateActors();
    this.setTransparency(ClientSettings.get("HUD_TRANSPARENCY"));

    NetworkEvents.on({
      eventName: "updateResearch",
      parentObject: this,
      callback: () => {
        this.refresh();
      }
    });

    NetworkEvents.on({
      eventName: "updateTotalStats",
      parentObject: this,
      callback: () => {
        this.refresh();
      }
    });
  }

  private generateActors() {
    this.addActor(
      new Actor({
        image: Game.getInstance().getImage(GameImage.POPUP_BOX),
        x: this.x,
        y: this.y,
        cornerSize: 20,
        width: this.width,
        height: this.height,
        nineSlice: true
      })
    );

    this.techIcon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.ICON_UNKNOWN,
      x: this.x + PADDING,
      y: this.y + PADDING,
      width: UITheme.ICON_SIZE,
      height: UITheme.ICON_SIZE
    });
    this.addActor(this.techIcon);

    this.nameLabel = new Label({
      text: "Researching: Nothing",
      font: UITheme.FONT,
      fontColor: "white",
      x: this.techIcon.getX() + this.techIcon.getWidth() + 6,
      y: this.techIcon.getY() + UITheme.centerTextY(UITheme.ICON_SIZE)
    });
    this.addActor(this.nameLabel);

    this.progressBar = new LoadingBar({
      x: this.x + PADDING,
      y: this.techIcon.getY() + UITheme.ICON_SIZE + 6,
      width: this.width - PADDING * 2,
      height: PROGRESS_BAR_HEIGHT
    });
    this.addActor(this.progressBar);

    // Actual button (ICON_BUTTON frame + hover state), matching the unit action
    // buttons in UnitDisplayInfo - not a bare icon-only control.
    const openResearchButton = new Button({
      buttonImage: GameImage.ICON_BUTTON,
      buttonHoveredImage: GameImage.ICON_BUTTON_HOVERED,
      icon: SpriteRegion.ICON_SCIENCE,
      iconWidth: UITheme.ICON_SIZE,
      iconHeight: UITheme.ICON_SIZE,
      size: ButtonSize.ICON_LARGE,
      x: this.x + this.width - PADDING - ButtonSize.ICON_LARGE.width,
      y: this.y + this.height - PADDING - ButtonSize.ICON_LARGE.height,
      onClicked: () => {
        Game.getInstance().getCurrentSceneAs<InGameScene>().toggleResearchUI();
      }
    });
    this.addActor(openResearchButton);

    this.turnsLabel = new Label({
      text: "???",
      font: UITheme.FONT,
      fontColor: "white",
      x: this.x + PADDING,
      y: openResearchButton.getY() + UITheme.centerTextY(ButtonSize.ICON_LARGE.height)
    });
    this.addActor(this.turnsLabel);

    this.refresh();
  }

  private refresh() {
    if (!this.nameLabel) return;

    const clientPlayer = Game.getInstance().getCurrentSceneAs<InGameScene>().getClientPlayer();
    const research = clientPlayer.getCurrentResearch();

    this.nameLabel.setText(research ? research.techName : "Researching: Nothing");
    this.progressBar.setProgress(research ? research.progress / research.cost : 0);
    this.turnsLabel.setText(research ? this.getTurnsLeftText(research, clientPlayer.getTotalStat("science")) : "???");
    this.techIcon.setSpriteRegion(research ? resolveSpriteRegion(research.assetName) ?? SpriteRegion.ICON_UNKNOWN : SpriteRegion.ICON_UNKNOWN);
  }

  private getTurnsLeftText(research: CurrentResearch, scienceRate: number): string {
    if (scienceRate <= 0) {
      return "∞ turns left";
    }

    const turnsRemaining = Math.max(1, Math.ceil((research.cost - research.progress) / scienceRate));
    return `${turnsRemaining} turn${turnsRemaining === 1 ? "" : "s"} left`;
  }
}
