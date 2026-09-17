import { GameImage, resolveSpriteRegion, SpriteRegion } from "../Assets";
import { Game } from "../Game";
import { NetworkEvents, WebsocketClient } from "../network/Client";
import { Actor } from "../scene/Actor";
import { ActorGroup } from "../scene/ActorGroup";
import { InGameScene } from "../scene/type/InGameScene";
import { Button, ButtonSize } from "./Button";
import { Label } from "./Label";
import { UITheme } from "./UITheme";

const WINDOW_WIDTH = 320;
const PADDING = 16;
const ICON_SIZE = 48;

interface TechData {
  name: string;
  asset_name: string;
  cost: number;
  prerequisites: string[];
  description: string;
}

// Detail popup opened by clicking a tech tile in ResearchTreeWindow. Mirrors
// old_java's PickResearchWindow: title, icon, description, a turns/status line,
// and a Research/Cancel action alongside a close button.
export class TechDetailWindow extends ActorGroup {
  private tech: TechData;
  private onClose: () => void;

  private statusLabel: Label;
  private actionButton: Button;
  private statusY: number;
  private actionY: number;

  constructor(tech: TechData, onClose: () => void) {
    super({ x: 0, y: 0, z: 7, width: WINDOW_WIDTH, height: 0, cameraApplies: false });

    this.tech = tech;
    this.onClose = onClose;

    this.build();
  }

  public onDestroyed() {
    super.onDestroyed();
    NetworkEvents.removeCallbacksByParentObject(this);
  }

  private async build() {
    const textMaxWidth = WINDOW_WIDTH - PADDING * 2;
    const [, descHeight] = await Game.getInstance().getWrappedText(this.tech.description, UITheme.FONT, textMaxWidth);

    const titleY = PADDING;
    const iconY = titleY + UITheme.FONT_SIZE + 10;
    const descY = iconY + ICON_SIZE + 12;
    // getWrappedText's height estimate is a per-word sum, not a per-line one, so it can
    // undercount slightly versus how drawText actually spaces wrapped lines - pad a bit
    // so a 2-3 line description never runs into the status text below it.
    this.statusY = descY + descHeight + UITheme.FONT_SIZE * 0.5 + 12;
    this.actionY = this.statusY + UITheme.FONT_SIZE + 16;
    const height = this.actionY + ButtonSize.MEDIUM.height + PADDING;

    this.setSize(WINDOW_WIDTH, height);
    this.setPosition(Game.getInstance().getWidth() / 2 - this.width / 2, Game.getInstance().getHeight() / 2 - height / 2);

    this.addActor(
      new Actor({
        image: Game.getInstance().getImage(GameImage.POPUP_BOX),
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        nineSlice: true,
        cornerSize: 20
      })
    );

    this.addActor(
      new Button({
        icon: SpriteRegion.ICON_CANCEL,
        iconOnly: true,
        size: ButtonSize.ICON_SMALL,
        x: this.x + this.width - PADDING - ButtonSize.ICON_SMALL.width,
        y: this.y + PADDING,
        onClicked: () => this.onClose()
      })
    );

    const titleLabel = new Label({
      text: `Research ${this.tech.name}`,
      font: UITheme.FONT,
      fontColor: "white"
    });
    titleLabel.conformSize().then(() => {
      titleLabel.setPosition(this.x + this.width / 2 - titleLabel.getWidth() / 2, this.y + titleY);
      this.addActor(titleLabel);
    });

    const iconRegion = resolveSpriteRegion(this.tech.asset_name) ?? SpriteRegion.ICON_UNKNOWN;
    this.addActor(
      new Actor({
        image: Game.getInstance().getImage(GameImage.SPRITESHEET),
        spriteRegion: iconRegion,
        x: this.x + this.width / 2 - ICON_SIZE / 2,
        y: this.y + iconY,
        width: ICON_SIZE,
        height: ICON_SIZE
      })
    );

    const descLabel = new Label({
      text: this.tech.description,
      font: UITheme.FONT,
      fontColor: "lightgray",
      maxWidth: textMaxWidth,
      x: this.x + PADDING,
      y: this.y + descY
    });
    descLabel.conformSize().then(() => this.addActor(descLabel));

    this.statusLabel = new Label({ text: "", font: UITheme.FONT, fontColor: "white" });
    this.addActor(this.statusLabel);

    this.refresh();

    NetworkEvents.on({
      eventName: "updateResearch",
      parentObject: this,
      callback: () => this.refresh()
    });

    NetworkEvents.on({
      eventName: "updateTotalStats",
      parentObject: this,
      callback: () => this.refresh()
    });
  }

  // Re-evaluated on every updateResearch push, so a tech completing (or another
  // tech being picked, replacing this one) while the window is open never leaves
  // a stale Research/Cancel action showing.
  private refresh() {
    const clientPlayer = Game.getInstance().getCurrentSceneAs<InGameScene>().getClientPlayer();
    const currentResearch = clientPlayer.getCurrentResearch();
    const isResearched = clientPlayer.hasResearchedTech(this.tech.name);
    const isCurrent = currentResearch?.techName === this.tech.name;
    const missingPrerequisites = this.tech.prerequisites.filter((prereq) => !clientPlayer.hasResearchedTech(prereq));
    const rate = clientPlayer.getTotalStat("science");

    let statusText: string;
    if (isResearched) {
      statusText = "Researched";
    } else if (missingPrerequisites.length > 0) {
      statusText = `Requires: ${missingPrerequisites.join(", ")}`;
    } else if (rate <= 0) {
      statusText = "Never (0 Science)";
    } else if (isCurrent) {
      const turnsRemaining = Math.max(1, Math.ceil((currentResearch.cost - currentResearch.progress) / rate));
      statusText = `${turnsRemaining} Turns Remaining`;
    } else {
      statusText = `${Math.max(1, Math.ceil(this.tech.cost / rate))} Turns`;
    }

    this.statusLabel.setText(statusText);
    this.statusLabel.conformSize().then(() => {
      this.statusLabel.setPosition(this.x + this.width / 2 - this.statusLabel.getWidth() / 2, this.y + this.statusY);
    });

    if (this.actionButton) {
      this.removeActor(this.actionButton);
      this.actionButton = undefined;
    }

    if (isResearched || missingPrerequisites.length > 0) return;

    this.actionButton = new Button({
      text: isCurrent ? "Cancel" : "Research",
      x: this.x + this.width / 2 - ButtonSize.MEDIUM.width / 2,
      y: this.y + this.actionY,
      size: ButtonSize.MEDIUM,
      fontColor: "white",
      onClicked: () => {
        if (isCurrent) {
          WebsocketClient.sendMessage({ event: "cancelResearch" });
        } else {
          WebsocketClient.sendMessage({ event: "chooseResearch", techName: this.tech.name });
        }
        this.onClose();
      }
    });
    this.addActor(this.actionButton);
  }
}
