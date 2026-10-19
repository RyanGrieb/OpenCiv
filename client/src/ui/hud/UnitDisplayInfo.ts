import { ClientSettings } from "../../ClientSettings";
import { GameImage, SpriteRegion } from "../../Assets";
import { Game } from "../../Game";
import { Unit } from "../../Unit";
import { NetworkEvents, WebsocketClient } from "../../network/Client";
import { Actor } from "../../scene/Actor";
import { ActorGroup } from "../../scene/ActorGroup";
import { Strings } from "../../util/Strings";
import { Button, ButtonSize } from "../components/Button";
import { Label } from "../components/Label";
import { UITheme } from "../UITheme";
import { InGameScene } from "../../scene/type/InGameScene";
import { resolveSpriteRegion } from "../../Assets";
import { PromotionTooltip } from "./PromotionTooltip";
import { PromotionWindow } from "./PromotionWindow";

const WINDOW_WIDTH = 300;
// Offsets from the window's top. Action buttons take 44-108, wrapping into more rows of 4 when a
// unit (a Builder) has more; each extra row pushes everything below it down by ACTION_SPACING.
const ACTION_Y = 44;
const ACTION_SPACING = 68;
const ACTIONS_PER_ROW = 4;
const MOVEMENT_Y = 114;
const STRENGTH_Y = 142;
const HEALTH_BAR_Y = 176;
const XP_BAR_Y = 208;
// The row of icons for the promotions the unit has, under the XP bar.
const PROMOTIONS_Y = 242;
const PROMOTION_ICON_SIZE = 24;
const PROMOTION_ICON_GAP = 4;
const TEXT_X = 16;
const BAR_MARGIN = 14;
const BAR_HEIGHT = 26;
const COMBAT_ICON_SIZE = 24;
const COMBAT_ICON_GAP = 4;
// Between one strength's icon and the next strength's label.
const STRENGTH_SPACING = 10;

export class UnitDisplayInfo extends ActorGroup {
  // CombatPreviewWindow stacks on top of this window.
  public static readonly HEIGHT = 278;

  private unit: Unit;
  // Shows the hovered action's description in place of the movement line, wrapped within the window.
  private movementLabel: Label;
  // While a hovered action's description wraps onto more lines, the strength row (or a Builder's build
  // status) under it steps aside. The HP and XP bars stay.
  private strengthRowHidden = false;
  // Which action button the mouse is over. Moving straight from one button to the next fires the new
  // button's enter before the old one's exit, so the exit only clears this if it's still its own.
  private hoveredActionName: string | undefined;
  // "Building Farm: 3 turns" while a Builder works - it has no combat rows, so it takes their place.
  private buildLabel: Label;
  // Strength, health bar and XP bar - rebuilt whenever strength or health changes.
  private combatActors: Actor[] = [];
  // The part of combatActors on the strength row, right under the movement line.
  private strengthActors: Actor[] = [];
  private actionButtons: Button[];
  // Open while the player picks a promotion (see the Promote action).
  private promotionWindow: PromotionWindow | undefined;

  constructor(unit: Unit) {
    super({
      x: Game.getInstance().getWidth() - WINDOW_WIDTH,
      y: Game.getInstance().getHeight() - UnitDisplayInfo.HEIGHT,
      width: WINDOW_WIDTH,
      height: UnitDisplayInfo.HEIGHT,
      cameraApplies: false,
      z: 5
    });

    this.unit = unit;
    this.actionButtons = [];
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

    const nameLabel = new Label({
      text: Strings.capitalizeWords(unit.getName()),
      x: this.x,
      y: this.y,
      font: UITheme.FONT,
      fontColor: "white"
    });

    nameLabel.conformSize().then(() => {
      nameLabel.setPosition(this.x + this.width / 2 - nameLabel.getWidth() / 2, this.y + 10);
      this.addActor(nameLabel);
    });

    this.movementLabel = new Label({
      text: this.getMovementText(),
      x: this.x,
      y: this.y,
      font: UITheme.FONT,
      fontColor: "white",
      maxWidth: WINDOW_WIDTH - TEXT_X * 2
    });

    this.updateMovementLabel();
    this.addActor(this.movementLabel);

    this.buildLabel = new Label({ text: "", x: this.x, y: this.y, font: UITheme.FONT, fontColor: "white" });
    this.addActor(this.buildLabel);

    if (unit.canFight()) this.updateCombatRows();
    this.updateBuildLabel();

    this.updateActionButtons();

    NetworkEvents.on({
      eventName: "newTurn",
      parentObject: this,
      callback: (data) => {
        this.refreshDisplayInfo();
      }
    });

    NetworkEvents.on({
      eventName: "moveUnit",
      parentObject: this,
      callback: (data) => {
        if (this.unit.getID() !== data["id"]) {
          return;
        }
        this.refreshDisplayInfo();
      }
    });

    for (const eventName of [
      "unitCombat",
      "unitHealth",
      "unitFortified",
      "unitActions",
      "unitBuildStatus",
      "unitPromotions"
    ]) {
      NetworkEvents.on({
        eventName,
        parentObject: this,
        callback: (data) => {
          const ids = [data["id"], data["attackerId"], data["defenderId"]];
          if (!ids.includes(this.unit.getID())) return;

          this.refreshDisplayInfo();
        }
      });
    }
  }

  // Clear our networks events associated with this object
  public onDestroyed() {
    super.onDestroyed();
    NetworkEvents.removeCallbacksByParentObject(this);
    this.closePromotionWindow();
    PromotionTooltip.hide();
  }

  // Whether (x, y) is over this window, or the promotion list standing on it.
  public isOver(x: number, y: number): boolean {
    return this.insideActor(x, y) || (this.promotionWindow?.insideActor(x, y) ?? false);
  }

  public getPromotionWindow(): PromotionWindow | undefined {
    return this.promotionWindow;
  }

  // The Promote action: opens the list of promotions on offer, or closes it if it's open.
  public togglePromotionWindow() {
    if (this.promotionWindow) {
      this.closePromotionWindow();
      return;
    }
    if (this.unit.getPromotionData().promotionChoices.length < 1) return;

    this.promotionWindow = new PromotionWindow(this.unit, this.y - 8, () => this.closePromotionWindow());
    Game.getInstance().getCurrentScene().addActor(this.promotionWindow);
  }

  private closePromotionWindow() {
    if (!this.promotionWindow) return;

    Game.getInstance().getCurrentScene().removeActor(this.promotionWindow);
    this.promotionWindow = undefined;
  }

  private updateMovementLabel() {
    const hoveredAction = this.getShownActions().find((action) => action.getName() === this.hoveredActionName);
    this.movementLabel.setText(hoveredAction ? hoveredAction.getDesc() : this.getMovementText());

    this.movementLabel.conformSize().then(() => {
      this.movementLabel.setPosition(this.x + TEXT_X, this.y + MOVEMENT_Y + this.getExtraActionRowsHeight());
      this.setStrengthRowHidden(this.movementLabel.isWrapped());
    });
  }

  private setStrengthRowHidden(hidden: boolean) {
    if (this.strengthRowHidden === hidden) return;

    this.strengthRowHidden = hidden;
    for (const actor of [...this.strengthActors, this.buildLabel]) {
      if (hidden) this.removeActor(actor);
      else this.addActor(actor);
    }
  }

  // Road moves leave thirds of a move behind, shown to two decimals (e.g. "1.67/2").
  private getMovementText() {
    const movement = Math.round(this.unit.getAvailableMovement() * 100) / 100;
    return `Movement: ${movement}/${this.unit.getDefaultMoveDistance()}`;
  }

  private updateBuildLabel() {
    const status = this.unit.getBuildStatusText();
    const turnsLeft = this.unit.getBuildTurnsLeft();
    this.buildLabel.setText(status ? `${status}: ${turnsLeft} ${turnsLeft === 1 ? "turn" : "turns"}` : "");

    this.buildLabel.conformSize().then(() => {
      this.buildLabel.setPosition(this.x + TEXT_X, this.y + STRENGTH_Y + this.getExtraActionRowsHeight());
    });
  }

  // "Strength: 8" with the crossed swords after it (and for a ranged unit, "Ranged: 7" with a target),
  // then old_java's health bar (red under green) across the window with e.g. "HP 63/100" on it, an
  // XP bar under that toward the next promotion, and the icons of the promotions the unit has.
  private updateCombatRows() {
    const strengths: { label: Label; icon: SpriteRegion }[] = [
      { label: this.createLabel(`Strength: ${this.unit.getCombatStrength()}`), icon: SpriteRegion.ICON_COMBAT }
    ];
    if (this.unit.isRanged()) {
      strengths.push({
        label: this.createLabel(`Ranged: ${this.unit.getRangedStrength()}`),
        icon: SpriteRegion.ICON_TARGET
      });
    }
    const healthLabel = this.createLabel(`HP ${this.unit.getHealth()}/${Unit.MAX_HEALTH}`);
    const { experience, experienceNeeded } = this.unit.getPromotionData();
    const xpLabel = this.createLabel(`XP ${experience}/${experienceNeeded}`);

    const labels = [...strengths.map(({ label }) => label), healthLabel, xpLabel];
    Promise.all(labels.map((label) => label.conformSize())).then(() => {
      const healthFraction = Math.max(0, Math.min(Unit.MAX_HEALTH, this.unit.getHealth())) / Unit.MAX_HEALTH;

      const strengthActors = this.createStrengthRow(strengths);
      const actors: Actor[] = [
        ...strengthActors,
        ...this.createBar(HEALTH_BAR_Y, "red", "limegreen", healthFraction, healthLabel),
        ...this.createBar(
          XP_BAR_Y,
          "rgb(50, 40, 70)",
          "mediumpurple",
          Math.min(1, experience / experienceNeeded),
          xpLabel
        ),
        ...this.createPromotionIcons()
      ];

      for (const actor of this.combatActors) this.removeActor(actor);
      for (const actor of actors) {
        if (!this.strengthRowHidden || !strengthActors.includes(actor)) this.addActor(actor);
      }
      this.combatActors = actors;
      this.strengthActors = strengthActors;
    });
  }

  // Each strength's label followed by its icon, left to right along the strength row.
  private createStrengthRow(strengths: { label: Label; icon: SpriteRegion }[]) {
    const y = this.y + STRENGTH_Y + this.getExtraActionRowsHeight();
    const actors: Actor[] = [];
    let x = this.x + TEXT_X;

    for (const { label, icon } of strengths) {
      label.setPosition(x, y);
      x += label.getWidth() + COMBAT_ICON_GAP;
      actors.push(
        label,
        new Actor({
          image: Game.getInstance().getImage(GameImage.SPRITESHEET),
          spriteRegion: icon,
          x,
          y: y + (label.getHeight() - COMBAT_ICON_SIZE) / 2,
          width: COMBAT_ICON_SIZE,
          height: COMBAT_ICON_SIZE
        })
      );
      x += COMBAT_ICON_SIZE + STRENGTH_SPACING;
    }

    return actors;
  }

  // One icon per promotion the unit has, left to right; hovering one says what it does. Icons shrink to
  // keep a long list on one row.
  private createPromotionIcons(): Actor[] {
    const promotions = this.unit.getPromotionData().promotions;
    const rowWidth = this.width - TEXT_X * 2;
    const step = Math.min(PROMOTION_ICON_SIZE + PROMOTION_ICON_GAP, rowWidth / Math.max(1, promotions.length));
    const size = Math.min(PROMOTION_ICON_SIZE, step - 2);
    const y = this.y + PROMOTIONS_Y + this.getExtraActionRowsHeight();

    return promotions.map((promotion, index) => {
      const icon = new Actor({
        image: Game.getInstance().getImage(GameImage.SPRITESHEET),
        spriteRegion: resolveSpriteRegion(promotion.icon) ?? SpriteRegion.ICON_UNKNOWN,
        x: this.x + TEXT_X + index * step,
        y,
        width: size,
        height: size,
        cameraApplies: false
      });
      icon.on("mouse_enter", () => PromotionTooltip.show(icon.getX() + size, y - 4, promotion));
      icon.on("mouse_exit", () => PromotionTooltip.hide());
      return icon;
    });
  }

  private createLabel(text: string) {
    return new Label({ text, font: UITheme.FONT, fontColor: "white" });
  }

  // A bar across the window, filled from the left to `fraction`, with a label centered on it.
  private createBar(barY: number, backColor: string, fillColor: string, fraction: number, label: Label) {
    const x = this.x + BAR_MARGIN;
    const y = this.y + barY + this.getExtraActionRowsHeight();
    const width = this.width - BAR_MARGIN * 2;

    const actors = [new Actor({ color: backColor, x, y, width, height: BAR_HEIGHT })];
    if (fraction > 0) actors.push(new Actor({ color: fillColor, x, y, width: width * fraction, height: BAR_HEIGHT }));

    label.setPosition(x + (width - label.getWidth()) / 2, y + (BAR_HEIGHT - label.getHeight()) / 2);
    actors.push(label);
    return actors;
  }

  private getShownActions() {
    return this.unit.getActions().filter((action) => action.requirementsMet(this.unit));
  }

  private getExtraActionRowsHeight() {
    const rows = Math.max(1, Math.ceil(this.getShownActions().length / ACTIONS_PER_ROW));
    return (rows - 1) * ACTION_SPACING;
  }

  private updateActionButtons() {
    const newActionButtons = [];
    for (const [index, action] of this.getShownActions().entries()) {
      const button = new Button({
        buttonImage: GameImage.ICON_BUTTON,
        buttonHoveredImage: GameImage.ICON_BUTTON_HOVERED,
        icon: action.getIcon(),
        iconWidth: UITheme.ICON_SIZE,
        iconHeight: UITheme.ICON_SIZE,
        x: this.x + TEXT_X + (index % ACTIONS_PER_ROW) * ACTION_SPACING,
        y: this.y + ACTION_Y + Math.floor(index / ACTIONS_PER_ROW) * ACTION_SPACING,
        size: ButtonSize.ICON_LARGE,
        onClicked: () => {
          console.log(`Action: ${action.getName()} clicked`);

          // Ranged Attack toggles aiming, which the client tracks - pressing it while aiming stops.
          if (action.getName() === "ranged_attack") {
            Game.getInstance().getCurrentSceneAs<InGameScene>().getClientPlayer().toggleRangedAttack();
            return;
          }

          // Promote opens the list of promotions to pick from, which the client shows itself.
          if (action.getName() === "promote") {
            this.togglePromotionWindow();
            return;
          }

          // Found Religion opens the religion founding window, which sends the choice itself.
          if (action.getName() === "found_religion") {
            Game.getInstance().getCurrentSceneAs<InGameScene>().toggleReligionFoundingUI(this.unit.getID());
            return;
          }

          // Skip Turn moves the selection on to the next unit needing orders, which the client tracks.
          if (action.getName() === "skip_turn") {
            Game.getInstance().getCurrentSceneAs<InGameScene>().getClientPlayer().skipSelectedUnitTurn();
            return;
          }

          // Send action event to server
          WebsocketClient.sendMessage({
            event: "unitAction",
            unitX: this.unit.getTile().getGridX(),
            unitY: this.unit.getTile().getGridY(),
            id: this.unit.getID(),
            actionName: action.getName()
          });
        },
        onMouseEnter: () => {
          this.hoveredActionName = action.getName();
          this.updateMovementLabel();
        },
        onMouseExit: () => {
          if (this.hoveredActionName === action.getName()) this.hoveredActionName = undefined;
          this.updateMovementLabel();
        }
      });

      this.addActor(button);
      newActionButtons.push(button);
    }

    for (const button of this.actionButtons) {
      this.removeActor(button);
    }

    this.actionButtons = newActionButtons;
  }

  private refreshDisplayInfo() {
    // A pick was made, or the unit can't promote any more.
    if (this.unit.getPromotionData().promotionChoices.length < 1) this.closePromotionWindow();
    this.updateMovementLabel();
    if (this.unit.canFight()) this.updateCombatRows();
    this.updateBuildLabel();
    this.updateActionButtons();
  }
}
