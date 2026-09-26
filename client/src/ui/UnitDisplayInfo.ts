import { ClientSettings } from "../ClientSettings";
import { GameImage, SpriteRegion } from "../Assets";
import { Game } from "../Game";
import { Unit } from "../Unit";
import { NetworkEvents, WebsocketClient } from "../network/Client";
import { Actor } from "../scene/Actor";
import { ActorGroup } from "../scene/ActorGroup";
import { Strings } from "../util/Strings";
import { Button, ButtonSize } from "./Button";
import { Label } from "./Label";
import { UITheme } from "./UITheme";

const WINDOW_WIDTH = 300;
// Offsets from the window's top. Action buttons take 44-108.
const MOVEMENT_Y = 114;
const STRENGTH_Y = 142;
const HEALTH_BAR_Y = 176;
const XP_BAR_Y = 208;
const TEXT_X = 16;
const BAR_MARGIN = 14;
const BAR_HEIGHT = 26;
const COMBAT_ICON_SIZE = 24;

export class UnitDisplayInfo extends ActorGroup {
  // CombatPreviewWindow stacks on top of this window.
  public static readonly HEIGHT = 246;

  private unit: Unit;
  private movementLabel: Label;
  // Strength, health bar and XP bar - rebuilt whenever strength or health changes.
  private combatActors: Actor[] = [];
  private actionButtons: Button[];

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
      text: `Movement: ${unit.getAvailableMovement()}/${unit.getDefaultMoveDistance()}`,
      x: this.x,
      y: this.y,
      font: UITheme.FONT,
      fontColor: "white"
    });

    this.updateMovementLabel({ updateText: false });
    this.addActor(this.movementLabel);

    if (unit.canFight()) this.updateCombatRows();

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

    for (const eventName of ["unitCombat", "unitHealth"]) {
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
  }

  private updateMovementLabel(options: { updateText: boolean }) {
    if (options.updateText) {
      this.movementLabel.setText(`Movement: ${this.unit.getAvailableMovement()}/${this.unit.getDefaultMoveDistance()}`);
    }

    this.movementLabel.conformSize().then(() => {
      this.movementLabel.setPosition(this.x + TEXT_X, this.y + MOVEMENT_Y);
    });
  }

  // "Strength: 8" with the crossed swords after it, then old_java's health bar (red under green) across
  // the window with e.g. "HP 63/100" on it, and an XP bar under that. XP isn't tracked yet, so it's empty.
  private updateCombatRows() {
    const strengthLabel = new Label({
      text: `Strength: ${this.unit.getCombatStrength()}`,
      font: UITheme.FONT,
      fontColor: "white"
    });
    const healthLabel = new Label({
      text: `HP ${this.unit.getHealth()}/${Unit.MAX_HEALTH}`,
      font: UITheme.FONT,
      fontColor: "white"
    });
    const xpLabel = new Label({ text: "XP 0/10", font: UITheme.FONT, fontColor: "white" });

    Promise.all([strengthLabel.conformSize(), healthLabel.conformSize(), xpLabel.conformSize()]).then(() => {
      const strengthY = this.y + STRENGTH_Y;
      strengthLabel.setPosition(this.x + TEXT_X, strengthY);
      const healthFraction = Math.max(0, Math.min(Unit.MAX_HEALTH, this.unit.getHealth())) / Unit.MAX_HEALTH;

      const actors: Actor[] = [
        strengthLabel,
        new Actor({
          image: Game.getInstance().getImage(GameImage.SPRITESHEET),
          spriteRegion: SpriteRegion.ICON_COMBAT,
          x: this.x + TEXT_X + strengthLabel.getWidth() + 6,
          y: strengthY + (strengthLabel.getHeight() - COMBAT_ICON_SIZE) / 2,
          width: COMBAT_ICON_SIZE,
          height: COMBAT_ICON_SIZE
        }),
        ...this.createBar(HEALTH_BAR_Y, "red", "limegreen", healthFraction, healthLabel),
        ...this.createBar(XP_BAR_Y, "rgb(50, 40, 70)", "mediumpurple", 0, xpLabel)
      ];

      for (const actor of this.combatActors) this.removeActor(actor);
      for (const actor of actors) this.addActor(actor);
      this.combatActors = actors;
    });
  }

  // A bar across the window, filled from the left to `fraction`, with a label centered on it.
  private createBar(barY: number, backColor: string, fillColor: string, fraction: number, label: Label) {
    const x = this.x + BAR_MARGIN;
    const y = this.y + barY;
    const width = this.width - BAR_MARGIN * 2;

    const actors = [new Actor({ color: backColor, x, y, width, height: BAR_HEIGHT })];
    if (fraction > 0) actors.push(new Actor({ color: fillColor, x, y, width: width * fraction, height: BAR_HEIGHT }));

    label.setPosition(x + (width - label.getWidth()) / 2, y + (BAR_HEIGHT - label.getHeight()) / 2);
    actors.push(label);
    return actors;
  }

  private updateActionButtons() {
    let xOffset = 0;

    const newActionButtons = [];
    for (const action of this.unit.getActions()) {
      if (!action.requirementsMet(this.unit)) continue;

      const button = new Button({
        buttonImage: GameImage.ICON_BUTTON,
        buttonHoveredImage: GameImage.ICON_BUTTON_HOVERED,
        icon: action.getIcon(),
        iconWidth: UITheme.ICON_SIZE,
        iconHeight: UITheme.ICON_SIZE,
        x: this.x + 16 + xOffset,
        y: this.y + 44,
        size: ButtonSize.ICON_LARGE,
        onClicked: () => {
          // Send action event to server
          console.log(`Action: ${action.getName()} clicked`);

          WebsocketClient.sendMessage({
            event: "unitAction",
            unitX: this.unit.getTile().getGridX(),
            unitY: this.unit.getTile().getGridY(),
            id: this.unit.getID(),
            actionName: action.getName()
          });
        },
        onMouseEnter: () => {
          this.movementLabel.setText(action.getDesc());
          this.updateMovementLabel({ updateText: false });
        },
        onMouseExit: () => {
          this.updateMovementLabel({ updateText: true });
        }
      });

      this.addActor(button);
      newActionButtons.push(button);
      xOffset += 48;
    }

    for (const button of this.actionButtons) {
      this.removeActor(button);
    }

    this.actionButtons = newActionButtons;
  }

  private refreshDisplayInfo() {
    this.updateMovementLabel({ updateText: true });
    if (this.unit.canFight()) this.updateCombatRows();
    this.updateActionButtons();
  }
}
