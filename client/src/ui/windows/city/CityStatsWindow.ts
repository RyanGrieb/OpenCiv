import { GameImage, SpriteRegion } from "../../../Assets";
import { Game } from "../../../Game";
import { City } from "../../../city/City";
import { Actor } from "../../../scene/Actor";
import { ActorGroup } from "../../../scene/ActorGroup";
import { Strings } from "../../../util/Strings";
import { Label } from "../../components/Label";
import { LoadingBar } from "../../components/LoadingBar";
import { UITheme } from "../../UITheme";
import { CityScreen } from "./CityScreen";

// `absolute` stats are plain counts, the rest are per-turn rates.
interface StatRow {
  key: string;
  icon: SpriteRegion;
  text: string;
  color: string;
  absolute?: boolean;
}

interface ProgressReadout {
  text: string;
  textColor: string;
  progress: number;
  barColor: string;
}

const STAT_ROWS: StatRow[] = [
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

// Top-left window: the city's name, its stat rows, and the growth and border-expansion progress bars.
export class CityStatsWindow extends ActorGroup {
  private static readonly X = 0;
  private static readonly Y = UITheme.STATUS_BAR_HEIGHT;
  private static readonly WIDTH = CityScreen.STATS_WINDOW_WIDTH;
  private static readonly FIRST_ROW_Y = CityStatsWindow.Y + 12 + UITheme.FONT_SIZE + 10;
  private static readonly ROW_SPACING = UITheme.ICON_SIZE - 12;

  private city: City;

  constructor(city: City) {
    super({ x: 0, y: 0, z: CityScreen.Z, width: 0, height: 0, cameraApplies: false });
    this.city = city;

    this.addBackground();
    this.addNameLabel();
    STAT_ROWS.forEach((stat, index) => this.addStatRow(stat, index));

    // Rows are spaced tighter than their icons are tall, so the extra offset drops each
    // readout clear of the icon overhanging from the row above it.
    const readoutY = CityStatsWindow.FIRST_ROW_Y + CityStatsWindow.ROW_SPACING + 8;
    this.addProgressReadout(readoutY, this.getGrowthReadout());
    this.addProgressReadout(readoutY + CityScreen.READOUT_ROW_HEIGHT, this.getBorderReadout());
  }

  private addBackground() {
    this.addActor(
      new Actor({
        image: Game.getInstance().getImage(GameImage.POPUP_BOX),
        x: CityStatsWindow.X,
        y: CityStatsWindow.Y,
        cornerSize: 20,
        width: CityStatsWindow.WIDTH,
        height: CityScreen.STATS_WINDOW_HEIGHT,
        nineSlice: true
      })
    );
  }

  private addNameLabel() {
    const nameLabel = new Label({
      text: this.city.getName(),
      font: UITheme.FONT,
      fontColor: "white"
    });
    nameLabel.conformSize().then(() => {
      nameLabel.setPosition(
        CityStatsWindow.X + CityStatsWindow.WIDTH / 2 - nameLabel.getWidth() / 2,
        CityStatsWindow.Y + 12
      );
      this.addActor(nameLabel);
    });
  }

  private addStatRow(stat: StatRow, index: number) {
    const x = CityStatsWindow.X;
    // Everything below Population sits under the growth and border readouts.
    const readoutOffset = index === 0 ? 0 : 2 * CityScreen.READOUT_ROW_HEIGHT;
    const iconY = CityStatsWindow.FIRST_ROW_Y + index * CityStatsWindow.ROW_SPACING + readoutOffset;
    const textY = iconY + UITheme.centerTextY(UITheme.ICON_SIZE);

    this.addActor(
      new Actor({
        image: Game.getInstance().getImage(GameImage.SPRITESHEET),
        spriteRegion: stat.icon,
        x: x + 10,
        y: iconY,
        width: UITheme.ICON_SIZE,
        height: UITheme.ICON_SIZE
      })
    );

    this.addActor(
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
      valueLabel.setPosition(x + CityStatsWindow.WIDTH - valueLabel.getWidth() - 10, textY);
      this.addActor(valueLabel);
    });
  }

  // Banked-food progress toward the next citizen, drawn just below the Population row.
  // A shrinking city (negative food) shows how long it has before a citizen starves off.
  private getGrowthReadout(): ProgressReadout {
    const banked = this.city.getStat("foodSurplus");
    const required = this.city.getStat("foodRequiredToGrow");
    const netFood = this.city.getStat("food");
    const progress = banked / required;

    if (netFood > 0) {
      const turns = Math.ceil((required - banked) / netFood);
      return {
        text: `Growth: ${banked}/${required} (${CityScreen.turnsText(turns)})`,
        textColor: "white",
        progress,
        barColor: "rgb(0, 200, 0)"
      };
    }

    if (netFood === 0) {
      return {
        text: `Growth: ${banked}/${required} (stagnant)`,
        textColor: "white",
        progress,
        barColor: "rgb(140, 140, 140)"
      };
    }

    // The bank drains by netFood each turn and a citizen is lost once it goes negative -
    // except at size 1, which the server holds rather than wiping the city out.
    const turns = Math.floor(banked / -netFood) + 1;
    const canShrink = this.city.getStat("population") > 1;
    return {
      text: canShrink ? `Starving! ${CityScreen.turnsText(turns)} left` : "Starving! (no growth)",
      textColor: "rgb(255, 120, 120)",
      progress,
      barColor: "rgb(200, 0, 0)"
    };
  }

  // Banked culture toward the city's next border tile, drawn just below the growth readout.
  private getBorderReadout(): ProgressReadout {
    const banked = this.city.getStat("cultureStored");
    const required = this.city.getStat("cultureRequiredToExpand");
    const culture = this.city.getStat("culture");

    let turnsText = "no culture";
    if (culture > 0) {
      turnsText = CityScreen.turnsText(Math.max(1, Math.ceil((required - banked) / culture)));
    }

    return {
      text: `Expansion: ${banked}/${required} (${turnsText})`,
      textColor: "white",
      progress: banked / required,
      barColor: "rgb(207, 159, 255)"
    };
  }

  private addProgressReadout(y: number, readout: ProgressReadout) {
    const x = CityStatsWindow.X;

    this.addActor(
      new Label({
        text: readout.text,
        font: UITheme.FONT,
        fontColor: readout.textColor,
        x: x + 10,
        y: y
      })
    );

    this.addActor(
      new LoadingBar({
        x: x + 10,
        y: y + UITheme.FONT_SIZE + 6,
        width: CityStatsWindow.WIDTH - 20,
        height: CityScreen.READOUT_BAR_HEIGHT,
        progress: Math.min(1, readout.progress),
        fillColor: readout.barColor
      })
    );
  }
}
