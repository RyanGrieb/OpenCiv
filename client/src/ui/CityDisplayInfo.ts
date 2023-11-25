import { GameImage, SpriteRegion } from "../Assets";
import { Game } from "../Game";
import { City } from "../city/City";
import { Actor } from "../scene/Actor";
import { ActorGroup } from "../scene/ActorGroup";
import { Strings } from "../util/Strings";
import { Label } from "./Label";
import { ListBox } from "./Listbox";
import { RadioButton } from "./RadioButton";

export class CityDisplayInfo extends ActorGroup {
  private city: City;

  private citizenMgmtRadioButtons: RadioButton[];
  private statLabels: Map<string, Label>;

  constructor(city: City) {
    super({
      x: 0,
      y: 0,
      z: 6,
      width: Game.getInstance().getWidth(),
      height: Game.getInstance().getHeight(),
      cameraApplies: false
    });

    this.city = city;
    this.citizenMgmtRadioButtons = [];
    this.statLabels = new Map<string, Label>();

    this.initializeStatsWindow();
    this.initializeBuildingsWindow();
  }

  private initializeBuildingsWindow() {
    const listbox = new ListBox({
      x: Game.getInstance().getWidth() - 275,
      y: 21,
      width: 275,
      height: Game.getInstance().getHeight() - 21,
      textFont: "20px serif",
      fontColor: "white"
    });

    listbox.addCategory("Citizen Management");

    const radioButton = new RadioButton({
      x: listbox.getNextRowPosition().x - 8,
      y: listbox.getNextRowPosition().y + 50 / 2 - 64 / 2,
      z: this.z,
      width: 64,
      height: 64,
      getOtherRadioButtons: this.getCitizenMgmtRadioButtons.bind(this),
      selected: true
    });
    this.citizenMgmtRadioButtons.push(radioButton);

    listbox.addRow({
      category: "Citizen Management",
      text: "Default Focus",
      textX: listbox.getNextRowPosition().x + 48,
      centerTextY: true,
      rowHeight: 50,
      actorIcons: [radioButton]
    });

    const focuses = [
      { name: "Food Focus", icon: SpriteRegion.FOOD_ICON },
      { name: "Production Focus", icon: SpriteRegion.PRODUCTION_ICON },
      { name: "Gold Focus", icon: SpriteRegion.GOLD_ICON },
      { name: "Science Focus", icon: SpriteRegion.SCIENCE_ICON },
      { name: "Culture Focus", icon: SpriteRegion.CULTURE_ICON }
    ];

    for (const focus of focuses) {
      const radioButton = new RadioButton({
        x: listbox.getNextRowPosition().x - 8,
        y: listbox.getNextRowPosition().y + 50 / 2 - 64 / 2,
        z: this.z,
        width: 64,
        height: 64,
        getOtherRadioButtons: this.getCitizenMgmtRadioButtons.bind(this)
      });
      this.citizenMgmtRadioButtons.push(radioButton);

      listbox.addRow({
        category: "Citizen Management",
        text: focus.name,
        textX: listbox.getNextRowPosition().x + 68,
        centerTextY: true,
        rowHeight: 50,
        actorIcons: [
          radioButton,
          new Actor({
            image: Game.getInstance().getImage(GameImage.SPRITESHEET),
            spriteRegion: focus.icon,
            x: listbox.getNextRowPosition().x + 38,
            y: listbox.getNextRowPosition().y + 50 / 2 - 32 / 2,
            z: this.z,
            width: 32,
            height: 32,
            cameraApplies: false
          })
        ]
      });
    }

    // If progress towards great people, add category & relevant rows:

    // Add wonders category if any wonders are built in city:

    // Add buildings category for existing city buildings:
    listbox.addCategory("Buildings");

    this.addActor(listbox);
  }

  private getCitizenMgmtRadioButtons() {
    return this.citizenMgmtRadioButtons;
  }

  private initializeStatsWindow() {
    const x = 0;
    const y = 21;
    const width = 250;
    const height = 300;
    this.addActor(
      new Actor({
        image: Game.getInstance().getImage(GameImage.POPUP_BOX),
        x: x,
        y: y, // (Height of status-bar)
        width: width,
        height: height
      })
    );

    const nameLabel = new Label({
      text: this.city.getName(),
      font: "20px serif",
      fontColor: "white"
    });
    nameLabel.conformSize().then(() => {
      nameLabel.setPosition(0 + 250 / 2 - nameLabel.getWidth() / 2, 30);
      this.addActor(nameLabel);
    });

    const populationIcon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.POPULATION_ICON,
      x: 6,
      y: 52,
      width: 32,
      height: 32
    });
    this.addActor(populationIcon);

    this.addActor(
      new Label({
        text: "Population:",
        font: "20px serif",
        fontColor: "white",
        x: populationIcon.getX() + populationIcon.getWidth(),
        y: populationIcon.getY() + 8
      })
    );

    const populationLabel = new Label({
      text: this.city.getStat("population").toString(),
      font: "20px serif",
      fontColor: "white"
    });
    populationLabel.conformSize().then(() => {
      populationLabel.setPosition(width - populationLabel.getWidth() - 10, populationIcon.getY() + 8);

      this.addActor(populationLabel);
    });
    this.statLabels.set("population", populationLabel);

    const moraleIcon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.MORALE_ICON,
      x: 6,
      y: populationIcon.getY() + 32,
      width: 32,
      height: 32
    });
    this.addActor(moraleIcon);

    this.addActor(
      new Label({
        text: "Morale:",
        font: "20px serif",
        fontColor: "orange",
        x: moraleIcon.getX() + moraleIcon.getWidth(),
        y: moraleIcon.getY() + 8
      })
    );

    const moraleLabel = new Label({
      text: this.city.getStat("morale").toString(),
      font: "20px serif",
      fontColor: "white"
    });
    moraleLabel.conformSize().then(() => {
      moraleLabel.setPosition(width - moraleLabel.getWidth() - 10, moraleIcon.getY() + 8);

      this.addActor(moraleLabel);
    });
    this.statLabels.set("morale", moraleLabel);

    const foodIcon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.FOOD_ICON,
      x: 6,
      y: moraleIcon.getY() + 32,
      width: 32,
      height: 32
    });
    this.addActor(foodIcon);

    this.addActor(
      new Label({
        text: "Food:",
        font: "20px serif",
        fontColor: "lime",
        x: foodIcon.getX() + foodIcon.getWidth(),
        y: foodIcon.getY() + 8
      })
    );

    const foodLabel = new Label({
      text: Strings.convertToStatUnit(this.city.getStat("food")),
      font: "20px serif",
      fontColor: "white"
    });
    foodLabel.conformSize().then(() => {
      foodLabel.setPosition(width - foodLabel.getWidth() - 10, foodIcon.getY() + 8);

      this.addActor(foodLabel);
    });
    this.statLabels.set("food", foodLabel);

    const productionIcon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.PRODUCTION_ICON,
      x: 6,
      y: foodIcon.getY() + 32,
      width: 32,
      height: 32
    });
    this.addActor(productionIcon);

    this.addActor(
      new Label({
        text: "Production:",
        font: "20px serif",
        fontColor: "rgb(220,162,29)",
        x: productionIcon.getX() + productionIcon.getWidth(),
        y: productionIcon.getY() + 8
      })
    );

    const productionLabel = new Label({
      text: Strings.convertToStatUnit(this.city.getStat("production")),
      font: "20px serif",
      fontColor: "white"
    });
    productionLabel.conformSize().then(() => {
      productionLabel.setPosition(width - productionLabel.getWidth() - 10, productionIcon.getY() + 8);

      this.addActor(productionLabel);
    });
    this.statLabels.set("production", productionLabel);

    const goldIcon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.GOLD_ICON,
      x: 6,
      y: productionIcon.getY() + 32,
      width: 32,
      height: 32
    });
    this.addActor(goldIcon);

    this.addActor(
      new Label({
        text: "Gold:",
        font: "20px serif",
        fontColor: "gold",
        x: goldIcon.getX() + goldIcon.getWidth(),
        y: goldIcon.getY() + 8
      })
    );

    const goldLabel = new Label({
      text: Strings.convertToStatUnit(this.city.getStat("gold")),
      font: "20px serif",
      fontColor: "white"
    });
    goldLabel.conformSize().then(() => {
      goldLabel.setPosition(width - goldLabel.getWidth() - 10, goldIcon.getY() + 8);

      this.addActor(goldLabel);
    });
    this.statLabels.set("gold", goldLabel);

    const scienceIcon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.SCIENCE_ICON,
      x: 6,
      y: goldIcon.getY() + 32,
      width: 32,
      height: 32
    });
    this.addActor(scienceIcon);

    this.addActor(
      new Label({
        text: "Science:",
        font: "20px serif",
        fontColor: "aqua",
        x: scienceIcon.getX() + scienceIcon.getWidth(),
        y: scienceIcon.getY() + 8
      })
    );

    const scienceLabel = new Label({
      text: Strings.convertToStatUnit(this.city.getStat("science")),
      font: "20px serif",
      fontColor: "white"
    });
    scienceLabel.conformSize().then(() => {
      scienceLabel.setPosition(width - scienceLabel.getWidth() - 10, scienceIcon.getY() + 8);

      this.addActor(scienceLabel);
    });
    this.statLabels.set("science", scienceLabel);

    const cultureIcon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.CULTURE_ICON,
      x: 6,
      y: scienceIcon.getY() + 32,
      width: 32,
      height: 32
    });
    this.addActor(cultureIcon);

    this.addActor(
      new Label({
        text: "Culture:",
        font: "20px serif",
        fontColor: "rgb(207, 159, 255)",
        x: cultureIcon.getX() + cultureIcon.getWidth(),
        y: cultureIcon.getY() + 8
      })
    );

    const cultureLabel = new Label({
      text: Strings.convertToStatUnit(this.city.getStat("culture")),
      font: "20px serif",
      fontColor: "white"
    });
    cultureLabel.conformSize().then(() => {
      cultureLabel.setPosition(width - cultureLabel.getWidth() - 10, cultureIcon.getY() + 8);

      this.addActor(cultureLabel);
    });
    this.statLabels.set("culture", cultureLabel);
  }
}
