import { GameImage } from "../Assets";
import { Game } from "../Game";
import { Unit } from "../Unit";
import { NetworkEvents, WebsocketClient } from "../network/Client";
import { Actor } from "../scene/Actor";
import { ActorGroup } from "../scene/ActorGroup";
import { Strings } from "../util/Strings";
import { Button } from "./Button";
import { Label } from "./Label";

export class UnitDisplayInfo extends ActorGroup {
  private unit: Unit;
  private movementLabel: Label;
  private actionButtons: Button[];

  constructor(unit: Unit) {
    super({
      x: Game.getInstance().getWidth() - 250,
      y: Game.getInstance().getHeight() - 150,
      width: 250,
      height: 150,
      cameraApplies: false,
      z: 5
    });

    this.unit = unit;
    this.actionButtons = [];

    this.addActor(
      new Actor({
        image: Game.getInstance().getImage(GameImage.POPUP_BOX),
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height
      })
    );

    const nameLabel = new Label({
      text: Strings.capitalizeWords(unit.getName()),
      x: this.x,
      y: this.y,
      font: "18px serif",
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
      font: "18px serif",
      fontColor: "white"
    });

    this.updateMovementLabel({ updateText: false });
    this.addActor(this.movementLabel);

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
        this.y + this.height - 20
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
        iconWidth: 32,
        iconHeight: 32,
        x: this.x + 8 + xOffset,
        y: this.y + 28,
        width: 50,
        height: 50,
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
      xOffset += 38;
    }

    for (const button of this.actionButtons) {
      this.removeActor(button);
    }

    this.actionButtons = newActionButtons;
  }

  private refreshDisplayInfo() {
    this.updateMovementLabel({ updateText: true });
    this.updateActionButtons();
  }
}
