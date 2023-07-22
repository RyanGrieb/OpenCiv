import { GameImage, SpriteRegion } from "../Assets";
import { Game } from "../Game";
import { NetworkEvents, WebsocketClient } from "../network/Client";
import { Actor } from "../scene/Actor";
import { ActorGroup } from "../scene/ActorGroup";
import { Button } from "./Button";
import { Label } from "./Label";

export class SelectCivilizationGroup extends ActorGroup {
  constructor(x: number, y: number, width: number, height: number) {
    super({
      x: x,
      y: y,
      width: width,
      height: height,
    });

    this.addActor(
      new Actor({
        color: "black",
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
      })
    );

    const titleLabel = new Label({
      text: "Select a Civilization",
      font: "20px serif",
      fontColor: "white",
    });
    titleLabel.conformSize().then(() => {
      titleLabel.setPosition(
        this.x + this.width / 2 - titleLabel.getWidth() / 2,
        this.y + 12
      );
      this.addActor(titleLabel);
    });

    WebsocketClient.sendMessage({ event: "availableCivs" });

    NetworkEvents.on({
      eventName: "availableCivs",
      parentObject: this,
      callback: (data) => {
        let xOffsset = 0;
        let yOffset = 1;

        // For each civ JSON object
        for (const civJSON of data["civs"]) {
          // Calculate the X and Y coordinates of the icon and add it
          let iconX = this.x + 68 * xOffsset + 8;

          if (iconX + 64 > this.x + this.width) {
            iconX = this.x + 68 * (xOffsset = 0) + 8;
            yOffset++;
          }

          let iconY = this.y + 68 * yOffset;

          this.addActor(
            new Button({
              icon: SpriteRegion[civJSON["icon_name"]],
              iconOnly: true,
              x: iconX,
              y: iconY,
              width: 64,
              height: 64,
              onClicked: () => {
                console.log(civJSON["name"]);
              },
              onMouseEnter: () => {
                console.log("Mouse enter");
              },
            })
          );
          xOffsset++;
        }
      },
    });
  }

  public onDestroyed(): void {
    super.onDestroyed();
    NetworkEvents.removeCallbacksByParentObject(this);
  }
}
