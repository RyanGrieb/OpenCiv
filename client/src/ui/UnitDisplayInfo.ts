import { GameImage } from "../Assets";
import { Game } from "../Game";
import { Unit } from "../Unit";
import { Actor } from "../scene/Actor";
import { ActorGroup } from "../scene/ActorGroup";
import { Strings } from "../util/Strings";
import { Button } from "./Button";
import { Label } from "./Label";

export class UnitDisplayInfo extends ActorGroup {
  constructor(unit: Unit) {
    super({
      x: Game.getWidth() - 250,
      y: Game.getHeight() - 150,
      width: 250,
      height: 150,
      cameraApplies: false,
      z: 1,
    });

    this.addActor(
      new Actor({
        image: Game.getImage(GameImage.POPUP_BOX),
        color: "black",
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
      })
    );

    const nameLabel = new Label({
      text: Strings.capitalizeWords(unit.getName()),
      x: this.x,
      y: this.y,
      font: "18px serif",
      fontColor: "white",
    });

    nameLabel.conformSize().then(() => {
      nameLabel.setPosition(
        this.x + this.width / 2 - nameLabel.getWidth() / 2,
        this.y + 21
      );
      this.addActor(nameLabel);
    });

    const movementLabel = new Label({
      text: `Movement: ${unit.getAvailableMovement()}/${unit.getTotalMovement()}`,
      x: this.x,
      y: this.y,
      font: "18px serif",
      fontColor: "white",
    });

    movementLabel.conformSize().then(() => {
      movementLabel.setPosition(
        this.x + this.width / 2 - movementLabel.getWidth() / 2,
        this.y + this.height - movementLabel.getHeight()
      );
      this.addActor(movementLabel);
    });

    for (const action of unit.getActions()) {
      this.addActor(
        new Button({
          icon: action.getIcon(),
          iconWidth: 32,
          iconHeight: 32,
          x: this.x,
          y: this.y,
          width: 42,
          height: 42,
          onClicked: () => {
            // Send action event to server
            console.log(`Action: ${action.getName()} clicked`);
          },
        })
      );
      console.log(action.getName());
    }
  }
}
