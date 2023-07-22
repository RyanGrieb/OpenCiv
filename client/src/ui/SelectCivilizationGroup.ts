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
          let iconX = this.x + 68 * xOffsset + 14;

          if (iconX + 64 > this.x + this.width) {
            iconX = this.x + 68 * (xOffsset = 0) + 14;
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
      y: this.y + this.height - 60,
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

  public async displayCivInformation(data: JSON) {
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
      text: data["start_bias_desc"],
      font: "20px serif",
      fontColor: "white",
      x: this.x + 12,
      y: this.y + 80,
    });

    await startBiasLabel.conformSize();

    this.civInformationActors.push(startBiasLabel);
    informationLabels.push(startBiasLabel);
    this.addActor(startBiasLabel);

    const uniqueUnitDescLabel = new Label({
      text: "Unique Units:",
      font: "bold 20px serif",
      fontColor: "white",
      x: this.x + 12,
      y: startBiasLabel.getY() + startBiasLabel.getHeight() + 30,
      maxWidth: this.width - 12,
    });

    await uniqueUnitDescLabel.conformSize();

    this.civInformationActors.push(uniqueUnitDescLabel);
    this.addActor(uniqueUnitDescLabel);

    for (const uniqueUnitDesc of data["unique_unit_descs"]) {
      const lastLabel =
        this.civInformationActors[this.civInformationActors.length - 1];

      const unitLabel = new Label({
        text: "* " + uniqueUnitDesc,
        font: "20px serif",
        fontColor: "white",
        x: this.x + 12,
        y: lastLabel.getY() + lastLabel.getHeight() + 5,
        maxWidth: this.width - 12,
      });

      await unitLabel.conformSize();

      this.civInformationActors.push(unitLabel);
      this.addActor(unitLabel);
    }

    if ("unique_building_descs" in data) {
      const lastLabel =
        this.civInformationActors[this.civInformationActors.length - 1];

      const uniqueBuildingsDescLabel = new Label({
        text: "Unique Buildings:",
        font: "bold 20px serif",
        fontColor: "white",
        x: this.x + 12,
        y: lastLabel.getY() + lastLabel.getHeight() + 30,
        maxWidth: this.width - 12,
      });

      await uniqueBuildingsDescLabel.conformSize();

      this.civInformationActors.push(uniqueBuildingsDescLabel);
      this.addActor(uniqueBuildingsDescLabel);

      for (const buildingDesc of data["unique_building_descs"] as []) {
        const lastLabel =
          this.civInformationActors[this.civInformationActors.length - 1];

        const abilityLabel = new Label({
          text: "* " + buildingDesc,
          font: "20px serif",
          fontColor: "white",
          x: this.x + 12,
          y: lastLabel.getY() + lastLabel.getHeight() + 5,
          maxWidth: this.width - 12,
        });

        await abilityLabel.conformSize();

        this.civInformationActors.push(abilityLabel);
        this.addActor(abilityLabel);
      }
    }

    const lastLabel =
      this.civInformationActors[this.civInformationActors.length - 1];

    const uniqueAbilityDescLabel = new Label({
      text: "Special Abilities:",
      font: "bold 20px serif",
      fontColor: "white",
      x: this.x + 12,
      y: lastLabel.getY() + lastLabel.getHeight() + 30,
      maxWidth: this.width - 12,
    });

    await uniqueAbilityDescLabel.conformSize();

    this.civInformationActors.push(uniqueAbilityDescLabel);
    this.addActor(uniqueAbilityDescLabel);

    for (const abilityDesc of data["ability_descs"]) {
      const lastLabel =
        this.civInformationActors[this.civInformationActors.length - 1];

      const abilityLabel = new Label({
        text: "* " + abilityDesc,
        font: "20px serif",
        fontColor: "white",
        x: this.x + 12,
        y: lastLabel.getY() + lastLabel.getHeight() + 5,
        maxWidth: this.width - 12,
      });

      await abilityLabel.conformSize();

      this.civInformationActors.push(abilityLabel);
      this.addActor(abilityLabel);
    }

    // Add select button:
    const selectButton = new Button({
      text: "Select",
      fontColor: "white",
      x: this.x + this.width / 2 - 100 - 150 / 2,
      y: this.y + this.height - 60,
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
      y: this.y + this.height - 60,
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
