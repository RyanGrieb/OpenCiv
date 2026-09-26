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
const WINDOW_HEIGHT = 170;
const COMBAT_ICON_SIZE = 24;
const HEALTH_BAR_WIDTH = 150;
const HEALTH_BAR_HEIGHT = 26;

export class UnitDisplayInfo extends ActorGroup {
  private unit: Unit;
  private movementLabel: Label;
  // Crossed swords, strength and health bar - rebuilt whenever strength or health changes.
  private combatActors: Actor[] = [];
  private actionButtons: Button[];

  constructor(unit: Unit) {
    super({
      x: Game.getInstance().getWidth() - WINDOW_WIDTH,
      y: Game.getInstance().getHeight() - WINDOW_HEIGHT,
      width: WINDOW_WIDTH,
      height: WINDOW_HEIGHT,
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

    if (unit.canFight()) this.updateCombatRow();

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
      this.movementLabel.setPosition(
        this.x + this.width / 2 - this.movementLabel.getWidth() / 2,
        this.y + this.height - 36
      );
    });
  }

  // Crossed swords and strength, then old_java's health bar (red under green) with e.g. "63/100" on it.
  private updateCombatRow() {
    const y = this.y + this.height - 66;
    const strengthLabel = new Label({
      text: `${this.unit.getCombatStrength()}`,
      font: UITheme.FONT,
      fontColor: "white"
    });
    const healthLabel = new Label({
      text: `${this.unit.getHealth()}/${Unit.MAX_HEALTH}`,
      font: UITheme.FONT,
      fontColor: "white"
    });

    Promise.all([strengthLabel.conformSize(), healthLabel.conformSize()]).then(() => {
      const rowWidth = COMBAT_ICON_SIZE + 6 + strengthLabel.getWidth() + 16 + HEALTH_BAR_WIDTH;
      const iconX = this.x + (this.width - rowWidth) / 2;
      const barX = iconX + rowWidth - HEALTH_BAR_WIDTH;
      const healthFraction = Math.max(0, Math.min(Unit.MAX_HEALTH, this.unit.getHealth())) / Unit.MAX_HEALTH;

      strengthLabel.setPosition(iconX + COMBAT_ICON_SIZE + 6, y + (HEALTH_BAR_HEIGHT - strengthLabel.getHeight()) / 2);
      healthLabel.setPosition(
        barX + (HEALTH_BAR_WIDTH - healthLabel.getWidth()) / 2,
        y + (HEALTH_BAR_HEIGHT - healthLabel.getHeight()) / 2
      );

      const actors = [
        new Actor({
          image: Game.getInstance().getImage(GameImage.SPRITESHEET),
          spriteRegion: SpriteRegion.ICON_COMBAT,
          x: iconX,
          y: y + (HEALTH_BAR_HEIGHT - COMBAT_ICON_SIZE) / 2,
          width: COMBAT_ICON_SIZE,
          height: COMBAT_ICON_SIZE
        }),
        strengthLabel,
        new Actor({ color: "red", x: barX, y, width: HEALTH_BAR_WIDTH, height: HEALTH_BAR_HEIGHT })
      ];
      if (healthFraction > 0) {
        actors.push(
          new Actor({
            color: "limegreen",
            x: barX,
            y,
            width: HEALTH_BAR_WIDTH * healthFraction,
            height: HEALTH_BAR_HEIGHT
          })
        );
      }
      actors.push(healthLabel);

      for (const actor of this.combatActors) this.removeActor(actor);
      for (const actor of actors) this.addActor(actor);
      this.combatActors = actors;
    });
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
    if (this.unit.canFight()) this.updateCombatRow();
    this.updateActionButtons();
  }
}
