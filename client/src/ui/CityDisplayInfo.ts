import { GameImage, resolveSpriteRegion, SpriteRegion } from "../Assets";
import { Game } from "../Game";
import { City, ProductionQueueItem } from "../city/City";
import { NetworkEvents, WebsocketClient } from "../network/Client";
import { Actor } from "../scene/Actor";
import { ActorGroup } from "../scene/ActorGroup";
import { Strings } from "../util/Strings";
import { Button } from "./Button";
import { Label } from "./Label";
import { ListBox } from "./Listbox";
import { RadioButton } from "./RadioButton";

const BUILDING_STAT_ICONS: Record<string, SpriteRegion> = {
  science: SpriteRegion.ICON_SCIENCE,
  gold: SpriteRegion.ICON_GOLD,
  production: SpriteRegion.ICON_PRODUCTION,
  faith: SpriteRegion.ICON_FAITH,
  culture: SpriteRegion.ICON_CULTURE,
  food: SpriteRegion.ICON_FOOD,
  population: SpriteRegion.ICON_POPULATION,
  morale: SpriteRegion.ICON_MORALE,
  defense: SpriteRegion.ICON_DEFENSE
};

export class CityDisplayInfo extends ActorGroup {
  private city: City;

  private citizenMgmtRadioButtons: RadioButton[];
  private statLabels: Map<string, Label>;
  private workedTileOverlays: Actor[];
  private statsWindow: ActorGroup;
  private currentlyBuildingWindow: ActorGroup;
  private chooseProductionListBox: ListBox;
  private isChoosingProduction: boolean = false;

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
    this.workedTileOverlays = [];

    this.initializeStatsWindow();
    this.initializeBuildingsWindow();
    this.initializeWorkedTileOverlays();
    this.initializeCurrentlyBuildingWindow();

    // Refreshes whenever the queue changes (e.g. after choosing production),
    // City's own updateCityStats listener (registered when the city was created,
    // so it always runs first) has already updated getProductionQueue() by now.
    NetworkEvents.on({
      eventName: "updateCityStats",
      parentObject: this,
      callback: (data: any) => {
        if (data["cityName"] !== this.city.getName()) return;
        this.refreshCurrentlyBuildingWindow();
      }
    });

    NetworkEvents.on({
      eventName: "updateProductionOptions",
      parentObject: this,
      callback: (data: any) => {
        if (data["cityName"] !== this.city.getName()) return;
        this.buildChooseProductionListBox(data["units"], data["buildings"]);
      }
    });
  }

  public onDestroyed(): void {
    for (const overlay of this.workedTileOverlays) {
      Game.getInstance().getCurrentScene().removeActor(overlay);
    }
    this.workedTileOverlays = [];

    NetworkEvents.removeCallbacksByParentObject(this);

    super.onDestroyed();
  }

  // Highlight each tile in the city's territory to show whether it's currently
  // being worked by a citizen. Added directly to the scene (not as a child of
  // this ActorGroup, which is screen-fixed) so the overlays pan with the map.
  private initializeWorkedTileOverlays() {
    const workedTiles = this.city.getWorkedTiles();

    for (const tile of this.city.getTerritory()) {
      const isWorked = workedTiles.includes(tile);

      const overlay = new Actor({
        image: Game.getInstance().getImage(GameImage.SPRITESHEET),
        spriteRegion: SpriteRegion.TILE_BLANK,
        x: tile.getX(),
        y: tile.getY(),
        z: 2,
        width: 32,
        height: 32,
        color: isWorked ? "rgba(0, 220, 0, 0.35)" : "rgba(40, 40, 40, 0.35)"
      });

      Game.getInstance().getCurrentScene().addActor(overlay);
      this.workedTileOverlays.push(overlay);
    }
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
      { name: "Food Focus", icon: SpriteRegion.ICON_FOOD },
      { name: "Production Focus", icon: SpriteRegion.ICON_PRODUCTION },
      { name: "Gold Focus", icon: SpriteRegion.ICON_GOLD },
      { name: "Science Focus", icon: SpriteRegion.ICON_SCIENCE },
      { name: "Culture Focus", icon: SpriteRegion.ICON_CULTURE }
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

    for (const building of this.city.getBuildings()) {
      const rowX = listbox.getNextRowPosition().x;
      const rowY = listbox.getNextRowPosition().y;

      const rowHeight = 100; // Tall enough for the name on top and up to 2 lines of stat icons below

      listbox.addRow({
        category: "Buildings",
        text: building.getName(),
        textX: rowX + 48,
        textY: rowY + 8,
        rowHeight: rowHeight,
        actorIcons: [
          new Actor({
            image: Game.getInstance().getImage(GameImage.SPRITESHEET),
            spriteRegion: building.getSpriteRegion(),
            x: rowX + 8,
            y: rowY + rowHeight / 2 - 32 / 2,
            z: this.z,
            width: 32,
            height: 32,
            cameraApplies: false
          }),
          ...this.buildStatIconActors(building.getStatLine(), rowX + 48, rowY + 34, 275 - 48 - 10)
        ]
      });
    }

    this.addActor(listbox);
  }

  // Builds icon+value actors for a building's stats, wrapping lines by measured width.
  // Must return actors synchronously - ones added to a row after addRow() don't render.
  private buildStatIconActors(statLine: Record<string, number>, startX: number, startY: number, maxWidth: number): Actor[] {
    const actors: Actor[] = [];
    const iconSize = 32;
    const font = "20px serif";
    const gapAfterItem = 8;
    const lineHeight = iconSize;

    let x = startX;
    let y = startY;

    for (const [stat, value] of Object.entries(statLine)) {
      if (value === 0) continue;

      const icon = BUILDING_STAT_ICONS[stat] ?? SpriteRegion.ICON_UNKNOWN;
      const text = Strings.convertToStatUnit(value);
      const textWidth = Game.getInstance().measureText(text, font).width;
      const itemWidth = iconSize + textWidth;

      // Wrap if it won't fit, unless the line's still empty
      if (x !== startX && x + itemWidth > startX + maxWidth) {
        x = startX;
        y += lineHeight;
      }

      actors.push(
        new Actor({
          image: Game.getInstance().getImage(GameImage.SPRITESHEET),
          spriteRegion: icon,
          x: x,
          y: y,
          z: this.z,
          width: iconSize,
          height: iconSize,
          cameraApplies: false
        })
      );
      actors.push(
        new Label({
          text: text,
          font: font,
          fontColor: "white",
          x: x + iconSize,
          y: y + (16 / 2)
        })
      );

      x += itemWidth + gapAfterItem;
    }

    return actors;
  }

  private getCitizenMgmtRadioButtons() {
    return this.citizenMgmtRadioButtons;
  }

  private initializeStatsWindow() {
    const x = 0;
    const y = 21;
    const width = 260;
    const height = 300;

    this.statsWindow = new ActorGroup({ x: 0, y: 0, z: this.z, width: 0, height: 0, cameraApplies: false });

    this.statsWindow.addActor(
      new Actor({
        image: Game.getInstance().getImage(GameImage.POPUP_BOX),
        x: x,
        y: y, // (Height of status-bar)
        cornerSize: 20,
        width: width,
        height: height,
        nineSlice: true,
      })
    );

    const nameLabel = new Label({
      text: this.city.getName(),
      font: "20px serif",
      fontColor: "white"
    });
    nameLabel.conformSize().then(() => {
      nameLabel.setPosition(0 + 260 / 2 - nameLabel.getWidth() / 2, 32);
      this.statsWindow.addActor(nameLabel);
    });

    const populationIcon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.ICON_POPULATION,
      x: 10,
      y: 52,
      width: 32,
      height: 32
    });
    this.statsWindow.addActor(populationIcon);

    this.statsWindow.addActor(
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

      this.statsWindow.addActor(populationLabel);
    });
    this.statLabels.set("population", populationLabel);

    const moraleIcon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.ICON_MORALE,
      x: 10,
      y: populationIcon.getY() + 32,
      width: 32,
      height: 32
    });
    this.statsWindow.addActor(moraleIcon);

    this.statsWindow.addActor(
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

      this.statsWindow.addActor(moraleLabel);
    });
    this.statLabels.set("morale", moraleLabel);

    const foodIcon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.ICON_FOOD,
      x: 10,
      y: moraleIcon.getY() + 32,
      width: 32,
      height: 32
    });
    this.statsWindow.addActor(foodIcon);

    this.statsWindow.addActor(
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

      this.statsWindow.addActor(foodLabel);
    });
    this.statLabels.set("food", foodLabel);

    const productionIcon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.ICON_PRODUCTION,
      x: 10,
      y: foodIcon.getY() + 32,
      width: 32,
      height: 32
    });
    this.statsWindow.addActor(productionIcon);

    this.statsWindow.addActor(
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

      this.statsWindow.addActor(productionLabel);
    });
    this.statLabels.set("production", productionLabel);

    const goldIcon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.ICON_GOLD,
      x: 10,
      y: productionIcon.getY() + 32,
      width: 32,
      height: 32
    });
    this.statsWindow.addActor(goldIcon);

    this.statsWindow.addActor(
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

      this.statsWindow.addActor(goldLabel);
    });
    this.statLabels.set("gold", goldLabel);

    const scienceIcon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.ICON_SCIENCE,
      x: 10,
      y: goldIcon.getY() + 32,
      width: 32,
      height: 32
    });
    this.statsWindow.addActor(scienceIcon);

    this.statsWindow.addActor(
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

      this.statsWindow.addActor(scienceLabel);
    });
    this.statLabels.set("science", scienceLabel);

    const cultureIcon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.ICON_CULTURE,
      x: 10,
      y: scienceIcon.getY() + 32,
      width: 32,
      height: 32
    });
    this.statsWindow.addActor(cultureIcon);

    this.statsWindow.addActor(
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

      this.statsWindow.addActor(cultureLabel);
    });
    this.statLabels.set("culture", cultureLabel);

    this.addActor(this.statsWindow);
  }

  private refreshCurrentlyBuildingWindow() {
    this.removeActor(this.currentlyBuildingWindow);
    this.initializeCurrentlyBuildingWindow();
  }

  private initializeCurrentlyBuildingWindow() {
    const x = 0;
    const width = 320;
    const height = 320;
    const y = Game.getInstance().getHeight() - height;

    this.currentlyBuildingWindow = new ActorGroup({ x: 0, y: 0, z: this.z, width: 0, height: 0, cameraApplies: false });

    this.currentlyBuildingWindow.addActor(
      new Actor({
        image: Game.getInstance().getImage(GameImage.POPUP_BOX),
        x: x,
        y: y,
        cornerSize: 20,
        width: width,
        height: height,
        nineSlice: true
      })
    );

    const queue = this.city.getProductionQueue();

    if (queue.length === 0) {
      const label = new Label({ text: "Nothing being produced", font: "20px serif", fontColor: "white" });
      label.conformSize().then(() => {
        label.setPosition(x + width / 2 - label.getWidth() / 2, y + 20);
        this.currentlyBuildingWindow.addActor(label);
      });
    } else {
      // Guard against a zero/negative production rate - a real accumulated-progress
      // system (and its own turns-remaining math) is a separate follow-up feature.
      const productionRate = Math.max(1, this.city.getStat("production"));

      const listbox = new ListBox({
        x: x,
        y: y + 5,
        width: width,
        height: height - 60,
        rowHeight: 50,
        textFont: "20px serif",
        fontColor: "white"
      });

      queue.forEach((item, index) => {
        const rowX = listbox.getNextRowPosition().x;
        const rowY = listbox.getNextRowPosition().y;
        const rowHeight = 50;
        const iconY = rowY + rowHeight / 2 - 12;

        const turnsLeft = Math.ceil(item.cost / productionRate);
        const text = index === 0 ? `${item.name} (${turnsLeft} turn${turnsLeft === 1 ? "" : "s"})` : item.name;

        const actorIcons: Actor[] = [
          new Actor({
            image: Game.getInstance().getImage(GameImage.SPRITESHEET),
            spriteRegion: this.resolveProductionIcon(item),
            x: rowX + 8,
            y: rowY + rowHeight / 2 - 16,
            z: this.z,
            width: 32,
            height: 32,
            cameraApplies: false
          })
        ];

        const cancelIcon = new Button({
          icon: SpriteRegion.ICON_CANCEL,
          iconOnly: true,
          x: rowX + width - 32,
          y: iconY,
          z: this.z,
          width: 24,
          height: 24,
          onClicked: () => {
            WebsocketClient.sendMessage({
              event: "removeFromProductionQueue",
              cityName: this.city.getName(),
              index: index
            });
          }
        });
        actorIcons.push(cancelIcon);

        let upOrDownIconX = rowX + width - 60;

        if (index > 0) {
          const upIcon = new Button({
            icon: SpriteRegion.ICON_UP_ARROW,
            iconOnly: true,
            x: upOrDownIconX,
            y: iconY,
            z: this.z,
            width: 24,
            height: 24,
            onClicked: () => {
              WebsocketClient.sendMessage({
                event: "moveProductionQueueItem",
                cityName: this.city.getName(),
                index: index,
                direction: "up"
              });
            }
          });
          actorIcons.push(upIcon);

          upOrDownIconX -= 28; // Move the others icon to the right if the other icons are present
        }

        if (index < queue.length - 1) {
          const downIcon = new Button({
            icon: SpriteRegion.ICON_DOWN_ARROW,
            iconOnly: true,
            x: upOrDownIconX,
            y: iconY,
            z: this.z,
            width: 24,
            height: 24,
            onClicked: () => {
              WebsocketClient.sendMessage({
                event: "moveProductionQueueItem",
                cityName: this.city.getName(),
                index: index,
                direction: "down"
              });
            }
          });
          actorIcons.push(downIcon);

          upOrDownIconX -= 28;
        }

        listbox.addRow({
          text: text,
          textX: rowX + 48,
          centerTextY: true,
          rowHeight: rowHeight,
          actorIcons: actorIcons
        });
      });

      this.currentlyBuildingWindow.addActor(listbox);
    }

    const buttonText = this.isChoosingProduction ? "Cancel" : queue.length === 0 ? "Choose Production" : "Add to Queue";
    this.currentlyBuildingWindow.addActor(
      new Button({
        text: buttonText,
        x: x + width / 2 - 100,
        y: y + height - 36,
        z: this.z,
        width: 200,
        height: 30,
        fontColor: "white",
        onClicked: () => {
          this.toggleChooseProduction();
        }
      })
    );

    this.addActor(this.currentlyBuildingWindow);
  }

  private resolveProductionIcon(option: ProductionQueueItem): SpriteRegion {
    return (
      resolveSpriteRegion(`${option.type.toUpperCase()}_${option.name.toUpperCase()}`) ?? SpriteRegion.ICON_UNKNOWN
    );
  }

  private toggleChooseProduction() {
    if (this.isChoosingProduction) {
      this.closeChooseProduction();
    } else {
      this.openChooseProduction();
    }
  }

  private openChooseProduction() {
    this.isChoosingProduction = true;
    this.removeActor(this.statsWindow);
    this.statsWindow = undefined;
    // Rebuild just for the button's new "Cancel" label - the queue itself hasn't changed.
    this.refreshCurrentlyBuildingWindow();

    WebsocketClient.sendMessage({ event: "requestProductionOptions", cityName: this.city.getName() });
  }

  private closeChooseProduction() {
    this.isChoosingProduction = false;

    if (this.chooseProductionListBox) {
      this.removeActor(this.chooseProductionListBox);
      this.chooseProductionListBox = undefined;
    }

    this.initializeStatsWindow();
    this.refreshCurrentlyBuildingWindow();
  }

  private buildChooseProductionListBox(units: ProductionQueueItem[], buildings: ProductionQueueItem[]) {
    if (this.chooseProductionListBox) {
      this.removeActor(this.chooseProductionListBox);
    }

    const listbox = new ListBox({
      x: 0,
      y: 21,
      width: 260,
      height: 300,
      textFont: "20px serif",
      fontColor: "white"
    });

    const addOptionRow = (option: ProductionQueueItem) => {
      const rowX = listbox.getNextRowPosition().x;
      const rowY = listbox.getNextRowPosition().y;
      const rowHeight = 50;

      const row = listbox.addRow({
        text: option.name,
        textX: rowX + 48,
        centerTextY: true,
        rowHeight: rowHeight,
        actorIcons: [
          new Actor({
            image: Game.getInstance().getImage(GameImage.SPRITESHEET),
            spriteRegion: this.resolveProductionIcon(option),
            x: rowX + 8,
            y: rowY + rowHeight / 2 - 16,
            z: this.z,
            width: 32,
            height: 32,
            cameraApplies: false
          })
        ]
      });

      row.on("clicked", () => {
        WebsocketClient.sendMessage({
          event: "addToProductionQueue",
          cityName: this.city.getName(),
          type: option.type,
          name: option.name
        });
        this.closeChooseProduction();
      });

      row.on("mousemove", () => {
        if (row.isMouseInside()) {
          Game.getInstance().setCursor("pointer");
        }
      });
      row.on("mouse_exit", () => {
        Game.getInstance().setCursor("default");
      });
    };

    listbox.addCategory("Units");
    for (const unit of units) {
      addOptionRow(unit);
    }

    listbox.addCategory("Buildings");
    for (const building of buildings) {
      addOptionRow(building);
    }

    this.chooseProductionListBox = listbox;
    this.addActor(listbox);
  }
}
