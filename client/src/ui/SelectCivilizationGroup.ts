import { GameImage, SpriteRegion } from "../Assets";
import { Game } from "../Game";
import { NetworkEvents, WebsocketClient } from "../network/Client";
import { Actor } from "../scene/Actor";
import { ActorGroup } from "../scene/ActorGroup";
import { Button } from "./Button";
import { Label } from "./Label";

export class SelectCivilizationGroup extends ActorGroup {
  private titleLabel: Label;
  private selectCivActors: Actor[];
  private civInformationActors: Actor[];

  constructor(x: number, y: number, width: number, height: number) {
    super({
      x: x,
      y: y,
      width: width,
      height: height,
    });

    this.selectCivActors = [];
    this.civInformationActors = [];

    this.addActor(
      new Actor({
        image: Game.getImage(GameImage.POPUP_BOX),
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
      })
    );

    this.listAvailableCivs();

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

          const selectCivButton = new Button({
            icon: SpriteRegion[civJSON["icon_name"]],
            iconOnly: true,
            x: iconX,
            y: iconY,
            width: 64,
            height: 64,
            onClicked: () => {
              console.log(civJSON["name"]);
              WebsocketClient.sendMessage({
                event: "civInfo",
                name: civJSON["name"],
              });
            },
            onMouseEnter: () => {
              console.log("Mouse enter");
            },
          });

          this.selectCivActors.push(selectCivButton);
          this.addActor(selectCivButton);
          xOffsset++;
        }
      },
    });

    NetworkEvents.on({
      eventName: "civInfo",
      parentObject: this,
      callback: (data) => {
        this.displayCivInformation(data);
      },
    });
  }

  public listAvailableCivs() {
    // Remove civ-information actors
    for (const actor of this.civInformationActors) {
      this.removeActor(actor);
    }

    const titleText = "Select a Civilization";
    if (!this.titleLabel) {
      this.titleLabel = new Label({
        text: "Select a Civilization",
        font: "20px serif",
        fontColor: "white",
      });
      this.addActor(this.titleLabel);
    } else {
      this.titleLabel.setText(titleText);
    }

    this.titleLabel.conformSize().then(() => {
      this.titleLabel.setPosition(
        this.x + this.width / 2 - this.titleLabel.getWidth() / 2,
        this.y + 12
      );
    });

    const closeButton = new Button({
      text: "Close",
      x: this.x + this.width / 2 - 150 / 2,
      y: this.y + this.height - 55,
      width: 150,
      height: 50,
      fontColor: "white",
      onClicked: () => {
        Game.getCurrentScene().removeActor(this);
      },
    });

    this.selectCivActors.push(closeButton);
    this.addActor(closeButton);

    WebsocketClient.sendMessage({ event: "availableCivs" });
  }

  public displayCivInformation(data: JSON) {
    // Rename title label:
    this.titleLabel.setText(data["name"]);
    this.titleLabel.conformSize().then(() => {
      this.titleLabel.setPosition(
        this.x + this.width / 2 - this.titleLabel.getWidth() / 2,
        this.y + 12
      );
    });

    // Remove select civ actors:
    for (const actor of this.selectCivActors) {
      this.removeActor(actor);
    }

    // Display civ information:
    const civIcon = new Actor({
      image: Game.getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion[data["icon_name"]],
      x: this.x + this.width / 2 - 32 / 2,
      y: this.y + 40,
      width: 32,
      height: 32,
    });
    this.addActor(civIcon);
    this.civInformationActors.push(civIcon);

    const informationLabels = [];

    //Start-bias label:
    const startBiasLabel = new Label({
      text: "* " + data["start_bias_desc"],
      font: "20px serif",
      fontColor: "white",
      x: this.x + 8,
      y: this.y + 80,
    });

    this.civInformationActors.push(startBiasLabel);
    informationLabels.push(startBiasLabel);
    this.addActor(startBiasLabel);

    let yIndex = 0;
    for (const uniqueUnitDesc of data["unique_unit_descs"]) {
      const unitLabel = new Label({
        text: "* " + uniqueUnitDesc,
        font: "20px serif",
        fontColor: "white",
        x: this.x + 8,
        y: startBiasLabel.getY() + 35 + 20 * yIndex,
      });

      this.civInformationActors.push(unitLabel);
      informationLabels.push(unitLabel);
      this.addActor(unitLabel);
      yIndex++;
    }

    yIndex = 0;
    for (const abilityDesc of data["ability_descs"]) {
      const lastInformationlabel =
        informationLabels[informationLabels.length - 1];

      const abilityLabel = new Label({
        text: "* " + abilityDesc,
        font: "20px serif",
        fontColor: "white",
        x: this.x + 8,
        y: lastInformationlabel.getY() + 35 + 20 * yIndex,
      });

      this.civInformationActors.push(abilityLabel);
      this.addActor(abilityLabel);
      yIndex++;
    }

    // Add select button:
    const selectButton = new Button({
      text: "Select",
      fontColor: "white",
      x: this.x + this.width / 2 - 100 - 150 / 2,
      y: this.y + this.height - 55,
      width: 150,
      height: 50,
      onClicked: () => {
        // Select this civilization and close this window:
        // Fire event for lobby to handle this. Or network event..?
        //Game.getCurrentScene().removeActor(this);
      },
    });

    this.civInformationActors.push(selectButton);
    this.addActor(selectButton);

    // Add back button:
    const backButton = new Button({
      text: "Back",
      fontColor: "white",
      x: this.x + this.width / 2 + 100 - 150 / 2,
      y: this.y + this.height - 55,
      width: 150,
      height: 50,
      onClicked: () => {
        // Clear current civ information actors, restore select civ buttons:
        this.listAvailableCivs();
      },
    });

    this.civInformationActors.push(backButton);
    this.addActor(backButton);
  }

  public onDestroyed(): void {
    super.onDestroyed();
    NetworkEvents.removeCallbacksByParentObject(this);
  }
}
