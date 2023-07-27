import { GameImage, SpriteRegion } from "../Assets";
import { Game } from "../Game";
import { City } from "../city/City";
import { Actor } from "../scene/Actor";
import { ActorGroup } from "../scene/ActorGroup";
import { Label } from "./Label";
import { ListBox } from "./Listbox";
import { RadioButton } from "./RadioButton";

export class CityDisplayInfo extends ActorGroup {
  private city: City;

  constructor(city: City) {
    super({
      x: 0,
      y: 0,
      z: 6,
      width: Game.getWidth(),
      height: Game.getHeight(),
      cameraApplies: false,
    });

    this.city = city;

    this.initializeStatsWindow();
    this.initializeBuildingsWindow();
  }

  private initializeBuildingsWindow() {
    const listbox = new ListBox({
      x: Game.getWidth() - 275,
      y: 21,
      width: 275,
      height: Game.getHeight() - 21,
      textFont: "20px serif",
      fontColor: "white",
    });

    listbox.addCategory("Citizen Management");
    listbox.addRow({
      category: "Citizen Management",
      text: "Default Focus",
      textX: listbox.getNextRowPosition().x + 48,
      centerTextY: true,
      rowHeight: 50,
      actorIcons: [
        new RadioButton({
          x: listbox.getNextRowPosition().x - 8,
          y: listbox.getNextRowPosition().y + 50 / 2 - 64 / 2,
          z: this.z,
          width: 64,
          height: 64,
          getOtherRadioButtons: this.getCitizenMgmtRadioButtons,
        }),
      ],
    });

    const focuses = [
      { name: "Food Focus", icon: SpriteRegion.FOOD_ICON },
      { name: "Production Focus", icon: SpriteRegion.PRODUCTION_ICON },
      { name: "Gold Focus", icon: SpriteRegion.GOLD_ICON },
      { name: "Science Focus", icon: SpriteRegion.SCIENCE_ICON },
      { name: "Culture Focus", icon: SpriteRegion.CULTURE_ICON },
    ];

    for (const focus of focuses) {
      listbox.addRow({
        category: "Citizen Management",
        text: focus.name,
        textX: listbox.getNextRowPosition().x + 68,
        centerTextY: true,
        rowHeight: 50,
        actorIcons: [
          new RadioButton({
            x: listbox.getNextRowPosition().x - 8,
            y: listbox.getNextRowPosition().y + 50 / 2 - 64 / 2,
            z: this.z,
            width: 64,
            height: 64,
            getOtherRadioButtons: this.getCitizenMgmtRadioButtons,
          }),
          new Actor({
            image: Game.getImage(GameImage.SPRITESHEET),
            spriteRegion: focus.icon,
            x: listbox.getNextRowPosition().x + 38,
            y: listbox.getNextRowPosition().y + 50 / 2 - 32 / 2,
            z: this.z,
            width: 32,
            height: 32,
            cameraApplies: false,
          }),
        ],
      });
    }

    // If progress towards great people, add category & relevant rows:

    // Add wonders category if any wonders are built in city:

    // Add buildings category for existing city buildings:
    listbox.addCategory("Buildings");

    this.addActor(listbox);
  }

  private getCitizenMgmtRadioButtons() {
    return [];
  }

  private initializeStatsWindow() {
    this.addActor(
      new Actor({
        image: Game.getImage(GameImage.POPUP_BOX),
        x: 0,
        y: 21, // (Height of status-bar)
        width: 250,
        height: 300,
      })
    );

    const nameLabel = new Label({
      text: this.city.getName(),
      font: "20px serif",
      fontColor: "white",
    });
    nameLabel.conformSize().then(() => {
      nameLabel.setPosition(0 + 250 / 2 - nameLabel.getWidth() / 2, 30);
      this.addActor(nameLabel);
    });

    const populationIcon = new Actor({
      image: Game.getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.POPULATION_ICON,
      x: 6,
      y: 52,
      width: 32,
      height: 32,
    });
    this.addActor(populationIcon);

    this.addActor(
      new Label({
        text: "Population:",
        font: "20px serif",
        fontColor: "white",
        x: populationIcon.getX() + populationIcon.getWidth(),
        y: populationIcon.getY() + 8,
      })
    );

    const moraleIcon = new Actor({
      image: Game.getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.MORALE_ICON,
      x: 6,
      y: populationIcon.getY() + 32,
      width: 32,
      height: 32,
    });
    this.addActor(moraleIcon);

    this.addActor(
      new Label({
        text: "Morale:",
        font: "20px serif",
        fontColor: "orange",
        x: moraleIcon.getX() + moraleIcon.getWidth(),
        y: moraleIcon.getY() + 8,
      })
    );

    const foodIcon = new Actor({
      image: Game.getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.FOOD_ICON,
      x: 6,
      y: moraleIcon.getY() + 32,
      width: 32,
      height: 32,
    });
    this.addActor(foodIcon);

    this.addActor(
      new Label({
        text: "Food:",
        font: "20px serif",
        fontColor: "lime",
        x: foodIcon.getX() + foodIcon.getWidth(),
        y: foodIcon.getY() + 8,
      })
    );

    const productionIcon = new Actor({
      image: Game.getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.PRODUCTION_ICON,
      x: 6,
      y: foodIcon.getY() + 32,
      width: 32,
      height: 32,
    });
    this.addActor(productionIcon);

    this.addActor(
      new Label({
        text: "Production:",
        font: "20px serif",
        fontColor: "rgb(220,162,29)",
        x: productionIcon.getX() + productionIcon.getWidth(),
        y: productionIcon.getY() + 8,
      })
    );

    const goldIcon = new Actor({
      image: Game.getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.GOLD_ICON,
      x: 6,
      y: productionIcon.getY() + 32,
      width: 32,
      height: 32,
    });
    this.addActor(goldIcon);

    this.addActor(
      new Label({
        text: "Gold:",
        font: "20px serif",
        fontColor: "gold",
        x: goldIcon.getX() + goldIcon.getWidth(),
        y: goldIcon.getY() + 8,
      })
    );

    const scienceIcon = new Actor({
      image: Game.getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.SCIENCE_ICON,
      x: 6,
      y: goldIcon.getY() + 32,
      width: 32,
      height: 32,
    });
    this.addActor(scienceIcon);

    this.addActor(
      new Label({
        text: "Science:",
        font: "20px serif",
        fontColor: "aqua",
        x: scienceIcon.getX() + scienceIcon.getWidth(),
        y: scienceIcon.getY() + 8,
      })
    );

    const cultureIcon = new Actor({
      image: Game.getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.CULTURE_ICON,
      x: 6,
      y: scienceIcon.getY() + 32,
      width: 32,
      height: 32,
    });
    this.addActor(cultureIcon);

    this.addActor(
      new Label({
        text: "Culture:",
        font: "20px serif",
        fontColor: "rgb(207, 159, 255)",
        x: cultureIcon.getX() + cultureIcon.getWidth(),
        y: cultureIcon.getY() + 8,
      })
    );
  }
}
