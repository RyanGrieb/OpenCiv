import { GameImage, SpriteRegion } from "../../../Assets";
import { Game } from "../../../Game";
import { City } from "../../../city/City";
import { Actor } from "../../../scene/Actor";
import { Strings } from "../../../util/Strings";
import { ButtonSize } from "../../components/Button";
import { Label } from "../../components/Label";
import { ListBox } from "../../components/Listbox";
import { RadioButton } from "../../components/RadioButton";
import { UITheme } from "../../UITheme";
import { CityScreen } from "./CityScreen";

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

const CITIZEN_FOCUSES = [
  { name: "Food Focus", icon: SpriteRegion.ICON_FOOD },
  { name: "Production Focus", icon: SpriteRegion.ICON_PRODUCTION },
  { name: "Gold Focus", icon: SpriteRegion.ICON_GOLD },
  { name: "Science Focus", icon: SpriteRegion.ICON_SCIENCE },
  { name: "Culture Focus", icon: SpriteRegion.ICON_CULTURE }
];

const FOCUS_ROW_HEIGHT = 64; // Tall enough for the ICON_LARGE radio button
const BUILDING_ROW_HEIGHT = 124; // Tall enough for the name on top and up to 2 lines of stat icons below

// Right-side list: the citizen focus radio buttons and the buildings the city has built.
export class CityBuildingsWindow extends ListBox {
  private city: City;
  private citizenMgmtRadioButtons: RadioButton[];

  constructor(city: City) {
    super({
      x: Game.getInstance().getWidth() - CityScreen.BUILDINGS_WINDOW_WIDTH,
      y: UITheme.STATUS_BAR_HEIGHT,
      width: CityScreen.BUILDINGS_WINDOW_WIDTH,
      height: Game.getInstance().getHeight() - UITheme.STATUS_BAR_HEIGHT,
      textFont: UITheme.FONT,
      fontColor: "white"
    });

    this.city = city;
    this.citizenMgmtRadioButtons = [];

    this.addCitizenManagementRows();
    // TODO: Great people progress and wonders categories.
    this.addBuildingRows();
  }

  private addCitizenManagementRows() {
    this.addCategory("Citizen Management");

    this.addRow({
      category: "Citizen Management",
      text: "Default Focus",
      textX: this.getNextRowPosition().x + 72,
      centerTextY: true,
      rowHeight: FOCUS_ROW_HEIGHT,
      actorIcons: [this.createFocusRadioButton(true)]
    });

    for (const focus of CITIZEN_FOCUSES) {
      const rowX = this.getNextRowPosition().x;
      const rowY = this.getNextRowPosition().y;

      this.addRow({
        category: "Citizen Management",
        text: focus.name,
        textX: rowX + 120,
        centerTextY: true,
        rowHeight: FOCUS_ROW_HEIGHT,
        actorIcons: [
          this.createFocusRadioButton(false),
          new Actor({
            image: Game.getInstance().getImage(GameImage.SPRITESHEET),
            spriteRegion: focus.icon,
            x: rowX + 72,
            y: rowY + FOCUS_ROW_HEIGHT / 2 - UITheme.ICON_SIZE / 2,
            z: CityScreen.Z,
            width: UITheme.ICON_SIZE,
            height: UITheme.ICON_SIZE,
            cameraApplies: false
          })
        ]
      });
    }
  }

  // Sits at the start of the next row, so create it before that row is added.
  private createFocusRadioButton(selected: boolean): RadioButton {
    const radioButton = new RadioButton({
      x: this.getNextRowPosition().x + 4,
      y: this.getNextRowPosition().y + FOCUS_ROW_HEIGHT / 2 - ButtonSize.ICON_LARGE.height / 2,
      z: CityScreen.Z,
      width: ButtonSize.ICON_LARGE.width,
      height: ButtonSize.ICON_LARGE.height,
      getOtherRadioButtons: () => this.citizenMgmtRadioButtons,
      selected: selected
    });
    this.citizenMgmtRadioButtons.push(radioButton);
    return radioButton;
  }

  private addBuildingRows() {
    this.addCategory("Buildings");

    for (const building of this.city.getBuildings()) {
      const rowX = this.getNextRowPosition().x;
      const rowY = this.getNextRowPosition().y;
      const textX = rowX + 8 + UITheme.ICON_SIZE + 8;

      this.addRow({
        category: "Buildings",
        text: building.getName(),
        textX: textX,
        textY: rowY + 8,
        rowHeight: BUILDING_ROW_HEIGHT,
        actorIcons: [
          new Actor({
            image: Game.getInstance().getImage(GameImage.SPRITESHEET),
            spriteRegion: building.getSpriteRegion(),
            x: rowX + 8,
            y: rowY + BUILDING_ROW_HEIGHT / 2 - UITheme.ICON_SIZE / 2,
            z: CityScreen.Z,
            width: UITheme.ICON_SIZE,
            height: UITheme.ICON_SIZE,
            cameraApplies: false
          }),
          ...this.buildStatIconActors(
            building.getStatLine(),
            textX,
            rowY + 40,
            CityScreen.BUILDINGS_WINDOW_WIDTH - (textX - rowX) - 10
          )
        ]
      });
    }
  }

  // Builds icon+value actors for a building's stats, wrapping lines by measured width.
  // Must return actors synchronously - ones added to a row after addRow() don't render.
  private buildStatIconActors(
    statLine: Record<string, number>,
    startX: number,
    startY: number,
    maxWidth: number
  ): Actor[] {
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
          z: CityScreen.Z,
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
}
