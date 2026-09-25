import { ClientSettings } from "../ClientSettings";
import { GameImage } from "../Assets";
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

export class UnitDisplayInfo extends ActorGroup {
  private unit: Unit;
  private movementLabel: Label;
  private combatLabel: Label;
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

    if (unit.canFight()) {
      this.combatLabel = new Label({
        text: this.getCombatText(),
        x: this.x,
        y: this.y,
        font: UITheme.FONT,
        fontColor: "white"
      });

      this.updateCombatLabel();
      this.addActor(this.combatLabel);
    }

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

  private getCombatText() {
    return `Strength: ${this.unit.getCombatStrength()}   HP: ${this.unit.getHealth()}/${Unit.MAX_HEALTH}`;
  }

  private updateCombatLabel() {
    this.combatLabel.setText(this.getCombatText());
    this.combatLabel.conformSize().then(() => {
      this.combatLabel.setPosition(
        this.x + this.width / 2 - this.combatLabel.getWidth() / 2,
        this.y + this.height - 60
      );
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
    if (this.combatLabel) this.updateCombatLabel();
    this.updateActionButtons();
  }
}
