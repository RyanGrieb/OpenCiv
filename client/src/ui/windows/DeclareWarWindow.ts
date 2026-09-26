import { GameImage, resolveSpriteRegion, SpriteRegion } from "../../Assets";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { AbstractPlayer } from "../../player/AbstractPlayer";
import { Actor } from "../../scene/Actor";
import { ActorGroup } from "../../scene/ActorGroup";
import { Button, ButtonSize } from "../components/Button";
import { Label } from "../components/Label";
import { UITheme } from "../UITheme";

const WINDOW_WIDTH = 440;
const PADDING = 16;
const ICON_SIZE = 56;
const TITLE_FONT = `bold ${UITheme.FONT_SIZE}px serif`;

/**
 * Old_java's DeclareWarWindow: our civ's icon, crossed swords, theirs, and a Declare War / Cancel
 * choice. Opens from the diplomacy window, or when a unit tries to attack a civilization we're at
 * peace with.
 */
export class DeclareWarWindow extends ActorGroup {
  private target: AbstractPlayer;
  private onClose: () => void;
  private declareButton: Button;
  private built = false;

  constructor(options: { attacker: AbstractPlayer; target: AbstractPlayer; onClose: () => void }) {
    super({ x: 0, y: 0, z: 8, width: WINDOW_WIDTH, height: 0, cameraApplies: false });

    this.target = options.target;
    this.onClose = options.onClose;

    this.build(options.attacker);
  }

  public isBuilt(): boolean {
    return this.built;
  }

  public getTarget(): AbstractPlayer {
    return this.target;
  }

  // What the Declare War button does, for the scenario test.
  public declare() {
    WebsocketClient.sendMessage({ event: "declareWar", playerName: this.target.getName() });
    this.onClose();
  }

  private static createIcon(spriteRegion: SpriteRegion, x: number, y: number): Actor {
    return new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion,
      x,
      y,
      width: ICON_SIZE,
      height: ICON_SIZE,
      cameraApplies: false
    });
  }

  private static civIcon(player: AbstractPlayer): SpriteRegion {
    return resolveSpriteRegion(player.getCivilizationData()?.icon_name ?? "") ?? SpriteRegion.ICON_UNKNOWN;
  }

  private async build(attacker: AbstractPlayer) {
    const title = new Label({ text: "Declare War?", font: TITLE_FONT, fontColor: "white" });
    await title.conformSize();

    const civName = this.target.getCivilizationData()?.name ?? this.target.getName();
    const question = new Label({
      text: `Going to war with ${civName} ends the peace between you. They will be free to attack you and to enter your lands.`,
      font: UITheme.FONT,
      fontColor: "lightgray",
      maxWidth: WINDOW_WIDTH - PADDING * 2
    });
    await question.conformSize();

    const iconsY = PADDING + title.getHeight() + 14;
    const questionY = iconsY + ICON_SIZE + 14;
    // Wrapped lines draw a little taller than getWrappedText's per-word height estimate.
    const buttonsY = questionY + question.getHeight() + 28;
    const height = buttonsY + ButtonSize.SMALL.height + PADDING;

    this.setSize(WINDOW_WIDTH, height);
    this.setPosition(
      Game.getInstance().getWidth() / 2 - WINDOW_WIDTH / 2,
      Game.getInstance().getHeight() / 2 - height / 2
    );

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

    title.setPosition(this.x + WINDOW_WIDTH / 2 - title.getWidth() / 2, this.y + PADDING);
    this.addActor(title);

    const centerX = this.x + WINDOW_WIDTH / 2 - ICON_SIZE / 2;
    this.addActor(
      DeclareWarWindow.createIcon(DeclareWarWindow.civIcon(attacker), centerX - ICON_SIZE - 40, this.y + iconsY)
    );
    this.addActor(DeclareWarWindow.createIcon(SpriteRegion.ICON_COMBAT, centerX, this.y + iconsY));
    this.addActor(
      DeclareWarWindow.createIcon(DeclareWarWindow.civIcon(this.target), centerX + ICON_SIZE + 40, this.y + iconsY)
    );

    question.setPosition(this.x + PADDING, this.y + questionY);
    this.addActor(question);

    const buttonGap = 16;
    const buttonsX = this.x + WINDOW_WIDTH / 2 - ButtonSize.SMALL.width - buttonGap / 2;
    this.declareButton = new Button({
      text: "Declare War",
      x: buttonsX,
      y: this.y + buttonsY,
      size: ButtonSize.SMALL,
      fontColor: "white",
      onClicked: () => this.declare()
    });
    this.addActor(this.declareButton);

    this.addActor(
      new Button({
        text: "Cancel",
        x: buttonsX + ButtonSize.SMALL.width + buttonGap,
        y: this.y + buttonsY,
        size: ButtonSize.SMALL,
        fontColor: "white",
        onClicked: () => this.onClose()
      })
    );

    this.built = true;
  }
}
