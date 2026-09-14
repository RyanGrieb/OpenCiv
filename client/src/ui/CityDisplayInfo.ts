import { GameImage, resolveSpriteRegion, SpriteRegion } from "../Assets";
import { Game } from "../Game";
import { City, ProductionQueueItem } from "../city/City";
import { NetworkEvents, WebsocketClient } from "../network/Client";
import { Actor } from "../scene/Actor";
import { ActorGroup } from "../scene/ActorGroup";
import { Strings } from "../util/Strings";
import { Button, ButtonSize } from "./Button";
import { Label } from "./Label";
import { ListBox } from "./Listbox";
import { RadioButton } from "./RadioButton";
import { UITheme } from "./UITheme";

const STATS_WINDOW_WIDTH = 320;
const STATS_WINDOW_HEIGHT = 340;
const BUILDINGS_WINDOW_WIDTH = 340;
const PRODUCTION_WINDOW_WIDTH = 360;
const PRODUCTION_WINDOW_HEIGHT = 320;
// Two wrapped lines of UITheme.FONT still fit inside a row of this height.
const PRODUCTION_ROW_HEIGHT = 56;
// Right-edge strip reserved for a row's cancel + reorder buttons (cancel sits at
// -32, the arrows step left by 28 each), so row text wraps before it reaches them.
const PRODUCTION_BUTTON_ZONE = 88;

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
    const focusRowHeight = 64; // Tall enough for the ICON_LARGE radio button

    const listbox = new ListBox({
      x: Game.getInstance().getWidth() - BUILDINGS_WINDOW_WIDTH,
      y: UITheme.STATUS_BAR_HEIGHT,
      width: BUILDINGS_WINDOW_WIDTH,
      height: Game.getInstance().getHeight() - UITheme.STATUS_BAR_HEIGHT,
      textFont: UITheme.FONT,
      fontColor: "white"
    });

    listbox.addCategory("Citizen Management");

    const radioButton = new RadioButton({
      x: listbox.getNextRowPosition().x + 4,
      y: listbox.getNextRowPosition().y + focusRowHeight / 2 - ButtonSize.ICON_LARGE.height / 2,
      z: this.z,
      width: ButtonSize.ICON_LARGE.width,
      height: ButtonSize.ICON_LARGE.height,
      getOtherRadioButtons: this.getCitizenMgmtRadioButtons.bind(this),
      selected: true
    });
    this.citizenMgmtRadioButtons.push(radioButton);

    listbox.addRow({
      category: "Citizen Management",
      text: "Default Focus",
      textX: listbox.getNextRowPosition().x + 72,
      centerTextY: true,
      rowHeight: focusRowHeight,
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
        x: listbox.getNextRowPosition().x + 4,
        y: listbox.getNextRowPosition().y + focusRowHeight / 2 - ButtonSize.ICON_LARGE.height / 2,
        z: this.z,
        width: ButtonSize.ICON_LARGE.width,
        height: ButtonSize.ICON_LARGE.height,
        getOtherRadioButtons: this.getCitizenMgmtRadioButtons.bind(this)
      });
      this.citizenMgmtRadioButtons.push(radioButton);

      listbox.addRow({
        category: "Citizen Management",
        text: focus.name,
        textX: listbox.getNextRowPosition().x + 120,
        centerTextY: true,
        rowHeight: focusRowHeight,
        actorIcons: [
          radioButton,
          new Actor({
            image: Game.getInstance().getImage(GameImage.SPRITESHEET),
            spriteRegion: focus.icon,
            x: listbox.getNextRowPosition().x + 72,
            y: listbox.getNextRowPosition().y + focusRowHeight / 2 - UITheme.ICON_SIZE / 2,
            z: this.z,
            width: UITheme.ICON_SIZE,
            height: UITheme.ICON_SIZE,
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

      const rowHeight = 124; // Tall enough for the name on top and up to 2 lines of stat icons below
      const textX = rowX + 8 + UITheme.ICON_SIZE + 8;

      listbox.addRow({
        category: "Buildings",
        text: building.getName(),
        textX: textX,
        textY: rowY + 8,
        rowHeight: rowHeight,
        actorIcons: [
          new Actor({
            image: Game.getInstance().getImage(GameImage.SPRITESHEET),
            spriteRegion: building.getSpriteRegion(),
            x: rowX + 8,
            y: rowY + rowHeight / 2 - UITheme.ICON_SIZE / 2,
            z: this.z,
            width: UITheme.ICON_SIZE,
            height: UITheme.ICON_SIZE,
            cameraApplies: false
          }),
          ...this.buildStatIconActors(
            building.getStatLine(),
            textX,
            rowY + 40,
            BUILDINGS_WINDOW_WIDTH - (textX - rowX) - 10
          )
        ]
      });
    }

    this.addActor(listbox);
  }

  // Builds icon+value actors for a building's stats, wrapping lines by measured width.
  // Must return actors synchronously - ones added to a row after addRow() don't render.
  private buildStatIconActors(statLine: Record<string, number>, startX: number, startY: number, maxWidth: number): Actor[] {
    const actors: Actor[] = [];
    const iconSize = UITheme.ICON_SIZE;
    const font = UITheme.FONT;
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
          y: y + UITheme.centerTextY(iconSize)
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
    const y = UITheme.STATUS_BAR_HEIGHT;
    const width = STATS_WINDOW_WIDTH;
    const height = STATS_WINDOW_HEIGHT;

    this.statsWindow = new ActorGroup({ x: 0, y: 0, z: this.z, width: 0, height: 0, cameraApplies: false });

    this.statsWindow.addActor(
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

    const nameLabel = new Label({
      text: this.city.getName(),
      font: UITheme.FONT,
      fontColor: "white"
    });
    nameLabel.conformSize().then(() => {
      nameLabel.setPosition(x + width / 2 - nameLabel.getWidth() / 2, y + 12);
      this.statsWindow.addActor(nameLabel);
    });

    // `absolute` stats are plain counts, the rest are per-turn rates.
    const stats: { key: string; icon: SpriteRegion; text: string; color: string; absolute?: boolean }[] = [
      { key: "population", icon: SpriteRegion.ICON_POPULATION, text: "Population:", color: "white", absolute: true },
      { key: "morale", icon: SpriteRegion.ICON_MORALE, text: "Morale:", color: "orange", absolute: true },
      { key: "food", icon: SpriteRegion.ICON_FOOD, text: "Food:", color: "lime" },
      { key: "production", icon: SpriteRegion.ICON_PRODUCTION, text: "Production:", color: "rgb(220,162,29)" },
      { key: "gold", icon: SpriteRegion.ICON_GOLD, text: "Gold:", color: "gold" },
      { key: "science", icon: SpriteRegion.ICON_SCIENCE, text: "Science:", color: "aqua" },
      { key: "culture", icon: SpriteRegion.ICON_CULTURE, text: "Culture:", color: "rgb(207, 159, 255)" },
      { key: "faith", icon: SpriteRegion.ICON_FAITH, text: "Faith:", color: "rgb(255, 255, 255)" },
      { key: "defense", icon: SpriteRegion.ICON_DEFENSE, text: "Defense:", color: "rgb(255, 0, 0)" }
    ];

    const firstRowY = y + 12 + UITheme.FONT_SIZE + 10;

    stats.forEach((stat, index) => {
      const iconY = firstRowY + index * (UITheme.ICON_SIZE - 12);
      const textY = iconY + UITheme.centerTextY(UITheme.ICON_SIZE);

      this.statsWindow.addActor(
        new Actor({
          image: Game.getInstance().getImage(GameImage.SPRITESHEET),
          spriteRegion: stat.icon,
          x: x + 10,
          y: iconY,
          width: UITheme.ICON_SIZE,
          height: UITheme.ICON_SIZE
        })
      );

      this.statsWindow.addActor(
        new Label({
          text: stat.text,
          font: UITheme.FONT,
          fontColor: stat.color,
          x: x + 10 + UITheme.ICON_SIZE,
          y: textY
        })
      );

      const value = this.city.getStat(stat.key);
      const valueLabel = new Label({
        text: stat.absolute ? value.toString() : Strings.convertToStatUnit(value),
        font: UITheme.FONT,
        fontColor: "white"
      });
      valueLabel.conformSize().then(() => {
        valueLabel.setPosition(x + width - valueLabel.getWidth() - 10, textY);
        this.statsWindow.addActor(valueLabel);
      });
      this.statLabels.set(stat.key, valueLabel);
    });

    this.addActor(this.statsWindow);
  }

  private refreshCurrentlyBuildingWindow() {
    this.removeActor(this.currentlyBuildingWindow);
    this.initializeCurrentlyBuildingWindow();
  }

  private initializeCurrentlyBuildingWindow() {
    const x = 0;
    const width = PRODUCTION_WINDOW_WIDTH;
    const height = PRODUCTION_WINDOW_HEIGHT;
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
      const label = new Label({ text: "Nothing being produced", font: UITheme.FONT, fontColor: "white" });
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
        y: y,
        width: width,
        height: height - 68,
        rowHeight: PRODUCTION_ROW_HEIGHT,
        textFont: UITheme.FONT,
        fontColor: "white"
      });

      queue.forEach((item, index) => {
        const rowX = listbox.getNextRowPosition().x;
        const rowY = listbox.getNextRowPosition().y;
        const rowHeight = PRODUCTION_ROW_HEIGHT;
        const iconY = rowY + rowHeight / 2 - ButtonSize.ICON_SMALL.height / 2;

        const turnsLeft = Math.ceil(item.cost / productionRate);
        const text = index === 0 ? `${item.name} (${turnsLeft} turn${turnsLeft === 1 ? "" : "s"})` : item.name;

        const actorIcons: Actor[] = [
          new Actor({
            image: Game.getInstance().getImage(GameImage.SPRITESHEET),
            spriteRegion: this.resolveProductionIcon(item),
            x: rowX + 8,
            y: rowY + rowHeight / 2 - UITheme.ICON_SIZE / 2,
            z: this.z,
            width: UITheme.ICON_SIZE,
            height: UITheme.ICON_SIZE,
            cameraApplies: false
          })
        ];

        const cancelIcon = new Button({
          icon: SpriteRegion.ICON_CANCEL,
          iconOnly: true,
          x: rowX + width - 32,
          y: iconY,
          z: this.z,
          size: ButtonSize.ICON_SMALL,
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
            size: ButtonSize.ICON_SMALL,
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
            size: ButtonSize.ICON_SMALL,
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

        const textX = rowX + 8 + UITheme.ICON_SIZE + 8;

        listbox.addRow({
          text: text,
          textX: textX,
          maxWidth: width - (textX - rowX) - PRODUCTION_BUTTON_ZONE - 8,
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
        x: x + width / 2 - ButtonSize.LARGE.width / 2,
        y: y + height - ButtonSize.LARGE.height - 4,
        z: this.z,
        size: ButtonSize.LARGE,
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
      y: UITheme.STATUS_BAR_HEIGHT,
      width: STATS_WINDOW_WIDTH,
      height: STATS_WINDOW_HEIGHT,
      textFont: UITheme.FONT,
      fontColor: "white"
    });

    const addOptionRow = (option: ProductionQueueItem) => {
      const rowX = listbox.getNextRowPosition().x;
      const rowY = listbox.getNextRowPosition().y;
      const rowHeight = PRODUCTION_ROW_HEIGHT;

      const row = listbox.addRow({
        text: option.name,
        textX: rowX + 8 + UITheme.ICON_SIZE + 8,
        centerTextY: true,
        rowHeight: rowHeight,
        actorIcons: [
          new Actor({
            image: Game.getInstance().getImage(GameImage.SPRITESHEET),
            spriteRegion: this.resolveProductionIcon(option),
            x: rowX + 8,
            y: rowY + rowHeight / 2 - UITheme.ICON_SIZE / 2,
            z: this.z,
            width: UITheme.ICON_SIZE,
            height: UITheme.ICON_SIZE,
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
