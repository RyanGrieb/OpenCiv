import { GameImage, SpriteRegion, resolveSpriteRegion } from "../Assets";
import { Game } from "../Game";
import { NetworkEvents } from "../network/Client";
import { CurrentResearch } from "../player/ClientPlayer";
import { Actor } from "../scene/Actor";
import { ActorGroup } from "../scene/ActorGroup";
import { InGameScene } from "../scene/type/InGameScene";
import { Button, ButtonSize } from "./Button";
import { Label } from "./Label";
import { UITheme } from "./UITheme";

const WIDTH = 260;
const HEIGHT = 130;
const PADDING = 10;

// Top-left "currently researching" popup. Mirrors CityDisplayInfo's POPUP_BOX layout.
export class ResearchDisplayInfo extends ActorGroup {
  private statusLabel: Label;
  private techIcon: Actor;
  private nameLabel: Label;

  constructor() {
    const x = PADDING;
    const y = UITheme.STATUS_BAR_HEIGHT + PADDING;

    super({ x, y, z: 5, width: WIDTH, height: HEIGHT, cameraApplies: false });

    this.generateActors();

    NetworkEvents.on({
      eventName: "updateResearch",
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

    this.statusLabel = new Label({
      text: "Researching: Nothing",
      font: UITheme.FONT,
      fontColor: "white",
      x: this.x + PADDING,
      y: this.y + PADDING
    });
    this.addActor(this.statusLabel);

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

    this.techIcon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.ICON_UNKNOWN,
      x: this.x + PADDING,
      y: openResearchButton.getY() + (ButtonSize.ICON_LARGE.height - UITheme.ICON_SIZE) / 2,
      width: UITheme.ICON_SIZE,
      height: UITheme.ICON_SIZE
    });
    this.addActor(this.techIcon);

    this.nameLabel = new Label({
      text: "???",
      font: UITheme.FONT,
      fontColor: "white",
      x: this.techIcon.getX() + this.techIcon.getWidth() + 6,
      y: this.techIcon.getY() + UITheme.centerTextY(UITheme.ICON_SIZE)
    });
    this.addActor(this.nameLabel);

    this.refresh();
  }

  private refresh() {
    if (!this.statusLabel) return;

    const clientPlayer = Game.getInstance().getCurrentSceneAs<InGameScene>().getClientPlayer();
    const research = clientPlayer.getCurrentResearch();

    this.statusLabel.setText(this.getStatusText(research, clientPlayer.getTotalStat("science")));
    this.nameLabel.setText(research ? research.techName : "???");
    this.techIcon.setSpriteRegion(research ? resolveSpriteRegion(research.assetName) ?? SpriteRegion.ICON_UNKNOWN : SpriteRegion.ICON_UNKNOWN);
  }

  private getStatusText(research: CurrentResearch | null, scienceRate: number): string {
    if (!research) {
      return "Researching: Nothing";
    }

    const rate = Math.max(scienceRate, 1);
    const turnsRemaining = Math.max(1, Math.ceil((research.cost - research.progress) / rate));
    const totalTurns = Math.max(1, Math.ceil(research.cost / rate));
    return `Researching: ${turnsRemaining}/${totalTurns} Turns`;
  }
}
