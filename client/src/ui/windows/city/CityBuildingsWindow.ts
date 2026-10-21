import { GameImage } from "../../../Assets";
import { Game } from "../../../Game";
import { City } from "../../../city/City";
import { BuildingCategory, Buidling } from "../../../city/Building";
import { Actor } from "../../../scene/Actor";
import { ButtonSize } from "../../components/Button";
import { Label } from "../../components/Label";
import { ListBox } from "../../components/Listbox";
import { RadioButton } from "../../components/RadioButton";
import { YieldText } from "../../components/YieldText";
import { UITheme } from "../../UITheme";
import { CityScreen } from "./CityScreen";

const CITIZEN_FOCUSES = [
  "!{food} Food Focus",
  "!{production} Production Focus",
  "!{gold} Gold Focus",
  "!{science} Science Focus",
  "!{culture} Culture Focus"
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
      this.addRow({
        category: "Citizen Management",
        text: focus,
        textX: this.getNextRowPosition().x + 72,
        centerTextY: true,
        rowHeight: FOCUS_ROW_HEIGHT,
        actorIcons: [this.createFocusRadioButton(false)]
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

  // The building's yields as one label, wrapped to `maxWidth`, and where it ends. Must return actors
  // synchronously - ones added to a row after addRow() don't render.
  private buildStatIconActors(
    statLine: Record<string, number>,
    startX: number,
    startY: number,
    maxWidth: number
  ): { actors: Actor[]; bottomY: number } {
    const text = YieldText.of([statLine]);
    if (!text) return { actors: [], bottomY: startY };

    const { lines } = Label.measure(text, UITheme.FONT, maxWidth);
    const label = new Label({
      text,
      font: UITheme.FONT,
      fontColor: "white",
      x: startX,
      y: startY + UITheme.centerTextY(UITheme.ICON_SIZE),
      maxWidth
    });
    return { actors: [label], bottomY: startY + UITheme.ICON_SIZE + (lines - 1) * Label.iconLineHeight() };
  }
}
