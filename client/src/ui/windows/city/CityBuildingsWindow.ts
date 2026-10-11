import { GameImage, SpriteRegion } from "../../../Assets";
import { Game } from "../../../Game";
import { City } from "../../../city/City";
import { BuildingCategory, Buidling } from "../../../city/Building";
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
  happiness: SpriteRegion.ICON_MORALE,
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
const BUILDING_DETAILS_TOP = 40; // Where the stat icons and effect lines start, below the name
const EFFECT_LINE_HEIGHT = 28;
const EFFECT_COLOR = "#8ee07a"; // The building tooltip's bonus green

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
    // TODO: Great people progress category.
    this.addBuildingRows("Buildings");
    this.addBuildingRows("National Wonders");
    this.addBuildingRows("Great Wonders");
  }

  // "Enemy land units spend 1 extra Movement per tile in your territory" -> lines that each fit maxWidth.
  private static wrapToWidth(text: string, font: string, maxWidth: number): string[] {
    const lines: string[] = [];
    let line = "";
    for (const word of text.split(" ")) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && Game.getInstance().measureText(candidate, font).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    return lines;
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

  // The city's buildings in that category. Buildings always shows; the wonder sections only once the
  // city has one.
  private addBuildingRows(category: BuildingCategory) {
    const buildings = this.city.getBuildings().filter((building) => building.getCategory() === category);
    if (category !== "Buildings" && buildings.length === 0) return;

    this.addCategory(category);
    for (const building of buildings) {
      this.addBuildingRow(category, building);
    }
  }

  // The name, then the stat icons, then what its effects do (Market's "+25% Gold"), each line wrapped.
  private addBuildingRow(category: BuildingCategory, building: Buidling) {
    const rowX = this.getNextRowPosition().x;
    const rowY = this.getNextRowPosition().y;
    const textX = rowX + 8 + UITheme.ICON_SIZE + 8;
    const detailsWidth = CityScreen.BUILDINGS_WINDOW_WIDTH - (textX - rowX) - 10;

    const stats = this.buildStatIconActors(building.getStatLine(), textX, rowY + BUILDING_DETAILS_TOP, detailsWidth);
    const effects = this.buildEffectLabels(building.getEffectLines(), textX, stats.bottomY, detailsWidth);
    const rowHeight = Math.max(BUILDING_ROW_HEIGHT, effects.bottomY - rowY + 8);

    this.addRow({
      category,
      text: building.getName(),
      textX: textX,
      textY: rowY + 8,
      rowHeight,
      actorIcons: [
        new Actor({
          image: Game.getInstance().getImage(GameImage.SPRITESHEET),
          spriteRegion: building.getSpriteRegion(),
          x: rowX + 8,
          y: rowY + rowHeight / 2 - UITheme.ICON_SIZE / 2,
          z: CityScreen.Z,
          width: UITheme.ICON_SIZE,
          height: UITheme.ICON_SIZE,
          cameraApplies: false
        }),
        ...stats.actors,
        ...effects.actors
      ]
    });
  }

  // One label per wrapped line, measured now since a row's actors must exist when it's added.
  private buildEffectLabels(lines: string[], startX: number, startY: number, maxWidth: number) {
    const wrapped = lines.flatMap((line) => CityBuildingsWindow.wrapToWidth(line, UITheme.FONT, maxWidth));
    const actors = wrapped.map(
      (text, index) =>
        new Label({
          text,
          font: UITheme.FONT,
          fontColor: EFFECT_COLOR,
          x: startX,
          y: startY + index * EFFECT_LINE_HEIGHT + UITheme.centerTextY(EFFECT_LINE_HEIGHT)
        })
    );
    return { actors, bottomY: startY + wrapped.length * EFFECT_LINE_HEIGHT };
  }

  // Builds icon+value actors for a building's stats, wrapping lines by measured width, and where they
  // end. Must return actors synchronously - ones added to a row after addRow() don't render.
  private buildStatIconActors(
    statLine: Record<string, number>,
    startX: number,
    startY: number,
    maxWidth: number
  ): { actors: Actor[]; bottomY: number } {
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

    return { actors, bottomY: actors.length > 0 ? y + lineHeight : startY };
  }
}
