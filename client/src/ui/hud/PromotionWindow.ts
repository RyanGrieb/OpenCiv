import { ClientSettings } from "../../ClientSettings";
import { GameImage, resolveSpriteRegion, SpriteRegion } from "../../Assets";
import { Game } from "../../Game";
import { PromotionInfo, Unit } from "../../Unit";
import { WebsocketClient } from "../../network/Client";
import { Actor } from "../../scene/Actor";
import { ActorGroup } from "../../scene/ActorGroup";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { UITheme } from "../UITheme";
import { PromotionTooltip } from "./PromotionTooltip";

// Matches UnitDisplayInfo's width.
const WINDOW_WIDTH = 300;
const PADDING = 10;
const TITLE_HEIGHT = 34;
const ROW_HEIGHT = 40;
const ROW_GAP = 6;
// Between the window and the tooltip that opens to its left.
const TOOLTIP_GAP = 8;

/**
 * The promotions a unit can pick from, opened by its Promote action. It stands on top of the unit info
 * window; hovering a promotion says what it does, and clicking it sends the pick to the server.
 */
export class PromotionWindow extends ActorGroup {
  private buttons: Button[] = [];

  constructor(unit: Unit, bottom: number, onPicked: () => void) {
    const choices = unit.getPromotionData().promotionChoices;
    const height = PADDING * 2 + TITLE_HEIGHT + choices.length * (ROW_HEIGHT + ROW_GAP) - ROW_GAP;

    super({
      x: Game.getInstance().getWidth() - WINDOW_WIDTH,
      y: bottom - height,
      width: WINDOW_WIDTH,
      height,
      cameraApplies: false,
      z: 6
    });
    this.setTransparency(ClientSettings.get("HUD_TRANSPARENCY"));

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

    const title = new Label({ text: "Choose a Promotion", font: UITheme.FONT, fontColor: "white" });
    title.conformSize().then(() => {
      title.setPosition(this.x + (this.width - title.getWidth()) / 2, this.y + PADDING);
      this.addActor(title);
    });

    choices.forEach((promotion, index) => {
      const rowY = this.y + PADDING + TITLE_HEIGHT + index * (ROW_HEIGHT + ROW_GAP);
      const button = this.createButton(unit, promotion, rowY, onPicked);
      this.buttons.push(button);
      this.addActor(button);
    });
  }

  public onDestroyed() {
    super.onDestroyed();
    PromotionTooltip.hide();
  }

  // The promotion's icon 24px from the left and its name centered, like the lobby's icon buttons.
  private createButton(unit: Unit, promotion: PromotionInfo, rowY: number, onPicked: () => void) {
    return new Button({
      text: promotion.displayName,
      icon: resolveSpriteRegion(promotion.icon) ?? SpriteRegion.ICON_UNKNOWN,
      x: this.x + PADDING,
      y: rowY,
      width: this.width - PADDING * 2,
      height: ROW_HEIGHT,
      font: UITheme.FONT,
      fontColor: "white",
      onClicked: () => {
        WebsocketClient.sendMessage({ event: "promoteUnit", id: unit.getID(), promotion: promotion.name });
        onPicked();
      },
      onMouseEnter: () => PromotionTooltip.show(this.x - TOOLTIP_GAP, rowY + ROW_HEIGHT, promotion),
      onMouseExit: () => PromotionTooltip.hide()
    });
  }
}
