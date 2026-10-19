import { GameImage, SpriteRegion } from "../Assets";
import { Game } from "../Game";
import { MapWrap } from "../map/MapWrap";
import { Religions } from "../religion/Religions";
import { Actor } from "../scene/Actor";
import { InGameScene } from "../scene/type/InGameScene";
import { SpriteAtlas } from "../SpriteAtlas";
import { CityReligionTooltip } from "../ui/hud/CityReligionTooltip";
import { CityScreen } from "../ui/windows/city/CityScreen";
import type { City } from "./City";

// One drawn piece of the banner, in world coordinates.
interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The bar over a city, like Civ 5's: a pill with the population, the growth bar and turns until the next citizen, the name, the religion it follows, and the production
 * turns, bar and item. Only the owner sees growth and production. Drawn in world coordinates, so it
 * scales with the map; clicking the owner's opens the city, hovering the religion icon lists followers.
 */
export class CityBanner extends Actor {
  private static readonly HEIGHT = 8;
  // Above the city's health bar, which sits along the top of its tile.
  private static readonly ABOVE_TILE = 2;
  private static readonly RELIGION_ICON_SIZE = 5.5;
  private static readonly PRODUCTION_ICON_SIZE = 6.5;
  private static readonly BAR_WIDTH = 1.5;
  // The defense tab centered on top of the pill, like Civ 5's: a shield and the city's strength.
  private static readonly DEFENSE_HEIGHT = 6;
  private static readonly DEFENSE_ICON_SIZE = 5.5;
  private static readonly DEFENSE_FONT = "bold 5px sans-serif";
  private static readonly GAP = 1.5;
  private static readonly NAME_FONT = "bold 6px serif";
  private static readonly POPULATION_FONT = "bold 5.5px sans-serif";
  private static readonly TURNS_FONT = "4.5px sans-serif";
  private static readonly PILL_COLOR = "rgba(22, 32, 58, 0.88)";
  private static readonly BOX_COLOR = "rgba(8, 12, 26, 0.9)";
  private static readonly GROWTH_COLOR = "#7cd65a";
  private static readonly PRODUCTION_COLOR = "#e8a23c";
  private static readonly BAR_BACK_COLOR = "rgba(255, 255, 255, 0.2)";

  private city: City;
  // Where each piece goes, worked out by refresh().
  private pill: Box;
  private populationBox: Box;
  private growthBar: Box | undefined;
  private growthTurns: Box | undefined;
  private name: Box;
  private religionIcon: Box | undefined;
  private defenseTab: Box;
  private defenseIcon: Box;
  private defenseText: Box;
  private productionTurns: Box | undefined;
  private productionBar: Box | undefined;
  private productionIcon: Box | undefined;
  private tooltipShown = false;

  constructor(city: City, z: number) {
    super({ x: 0, y: 0, z, width: 0, height: 0, cameraApplies: true });
    this.city = city;

    this.on("clicked", () => {
      if (!this.city.isOwnedByClient()) return;

      Game.getInstance().getCurrentSceneAs<InGameScene>().toggleCityUI(this.city);
    });
    this.on("mousemove", (options) => this.hoverReligion(options.clientX, options.clientY));
    this.on("mouse_exit", () => this.hideTooltip());
  }

  // "3" turns with a bar a third full: the text drawn over the box, centered.
  private static drawText(context: CanvasRenderingContext2D, text: string, box: Box, font: string) {
    context.font = font;
    context.fillStyle = "white";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, box.x + box.width / 2, box.y + box.height / 2 + 0.5);
  }

  // A vertical bar filling from the bottom.
  private static drawBar(context: CanvasRenderingContext2D, box: Box, fraction: number, color: string) {
    context.fillStyle = CityBanner.BAR_BACK_COLOR;
    context.fillRect(box.x, box.y, box.width, box.height);
    const filled = Math.max(0, Math.min(1, fraction)) * box.height;
    context.fillStyle = color;
    context.fillRect(box.x, box.y + box.height - filled, box.width, filled);
  }

  private static drawSprite(context: CanvasRenderingContext2D, region: SpriteRegion, box: Box) {
    const source = SpriteAtlas.getInstance().getRegion(region);
    if (!source) return;

    const image = Game.getInstance().getImage(GameImage.SPRITESHEET);
    context.drawImage(image, source.x, source.y, source.w, source.h, box.x, box.y, box.width, box.height);
  }

  private static measure(text: string, font: string): number {
    return Game.getInstance().measureText(text, font).width;
  }

  private static inside(box: Box | undefined, x: number, y: number): boolean {
    return !!box && x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
  }

  /** Lays the banner out again, centered over the city's tile, for what it shows now. */
  public refresh() {
    const tile = this.city.getTile();
    if (!tile) return;

    const height = CityBanner.HEIGHT;
    const gap = CityBanner.GAP;
    const own = this.city.isOwnedByClient();
    const growthTurns = this.getGrowthTurnsText();
    const production = own ? this.city.getProductionQueue()[0] : undefined;

    // Widths first, left to right, then place them from the left edge.
    const populationWidth = CityBanner.measure(this.getPopulationText(), CityBanner.POPULATION_FONT);
    const growthTurnsWidth = own ? CityBanner.measure(growthTurns, CityBanner.TURNS_FONT) : 0;
    const nameWidth = CityBanner.measure(this.city.getName(), CityBanner.NAME_FONT);
    const religion = this.city.getReligion().majority;
    const productionTurnsWidth = production
      ? CityBanner.measure(String(production.turns ?? "-"), CityBanner.TURNS_FONT)
      : 0;

    const widths = [
      height / 2 + populationWidth,
      own ? gap + CityBanner.BAR_WIDTH + gap + growthTurnsWidth : 0,
      gap + nameWidth,
      religion ? gap + CityBanner.RELIGION_ICON_SIZE : 0,
      production ? gap + productionTurnsWidth + gap + CityBanner.BAR_WIDTH + gap + CityBanner.PRODUCTION_ICON_SIZE : 0,
      height / 2
    ];
    const pillWidth = widths.reduce((total, width) => total + width, 0);
    const totalWidth = pillWidth;
    const left = tile.getX() + tile.getWidth() / 2 - totalWidth / 2;
    const top = tile.getY() - height - CityBanner.ABOVE_TILE;
    const middle = (size: number) => top + (height - size) / 2;

    this.pill = { x: left, y: top, width: pillWidth, height };

    // The rounded end is as wide as half the height: the population starts inside it.
    let x = this.pill.x + height / 2;
    this.populationBox = { x, y: top, width: populationWidth, height };
    x += populationWidth;

    this.growthBar = undefined;
    this.growthTurns = undefined;
    if (own) {
      this.growthBar = { x: x + gap, y: top + 1.5, width: CityBanner.BAR_WIDTH, height: height - 3 };
      x += gap + CityBanner.BAR_WIDTH + gap;
      this.growthTurns = { x, y: top, width: growthTurnsWidth, height };
      x += growthTurnsWidth;
    }

    this.name = { x: x + gap, y: top, width: nameWidth, height };
    x += gap + nameWidth;

    this.religionIcon = undefined;
    if (religion) {
      const size = CityBanner.RELIGION_ICON_SIZE;
      this.religionIcon = { x: x + gap, y: middle(size), width: size, height: size };
      x += gap + size;
    }

    this.productionTurns = undefined;
    this.productionBar = undefined;
    this.productionIcon = undefined;
    if (production) {
      this.productionTurns = { x: x + gap, y: top, width: productionTurnsWidth, height };
      x += gap + productionTurnsWidth;
      this.productionBar = { x: x + gap, y: top + 1.5, width: CityBanner.BAR_WIDTH, height: height - 3 };
      x += gap + CityBanner.BAR_WIDTH;
      const size = CityBanner.PRODUCTION_ICON_SIZE;
      this.productionIcon = { x: x + gap, y: middle(size), width: size, height: size };
    }

    const defenseTextWidth = CityBanner.measure(this.getDefenseText(), CityBanner.DEFENSE_FONT);
    const iconSize = CityBanner.DEFENSE_ICON_SIZE;
    const tabWidth = 2 + iconSize + 0.5 + defenseTextWidth + 2;
    const tabTop = top - CityBanner.DEFENSE_HEIGHT + 1;
    this.defenseTab = {
      x: this.pill.x + pillWidth / 2 - tabWidth / 2,
      y: tabTop,
      width: tabWidth,
      height: CityBanner.DEFENSE_HEIGHT
    };
    this.defenseIcon = {
      x: this.defenseTab.x + 2,
      y: tabTop + (CityBanner.DEFENSE_HEIGHT - iconSize) / 2,
      width: iconSize,
      height: iconSize
    };
    this.defenseText = {
      x: this.defenseIcon.x + iconSize + 0.5,
      y: tabTop,
      width: defenseTextWidth,
      height: CityBanner.DEFENSE_HEIGHT
    };

    this.setPosition(left, tabTop);
    this.setSize(totalWidth, top + height - tabTop);
  }

  /** Where the banner's pill ends on the right, for whatever sits beside it (the city's strike icon). */
  public getRight(): number {
    return this.getX() + this.getWidth();
  }

  /** The top of the banner's pill, below its defense tab. */
  public getPillTop(): number {
    return this.pill?.y ?? this.getY();
  }

  public draw(canvasContext: CanvasRenderingContext2D) {
    if (!this.pill) return;

    const game = Game.getInstance();
    canvasContext.save();
    if (game.isWorldContext(canvasContext)) game.applyCameraTransform(canvasContext);

    this.drawDefense(canvasContext);
    this.drawPill(canvasContext);
    CityBanner.drawText(canvasContext, this.getPopulationText(), this.populationBox, CityBanner.POPULATION_FONT);
    if (this.growthBar) {
      CityBanner.drawBar(canvasContext, this.growthBar, this.getGrowthFraction(), CityBanner.GROWTH_COLOR);
      CityBanner.drawText(canvasContext, this.getGrowthTurnsText(), this.growthTurns, CityBanner.TURNS_FONT);
    }
    CityBanner.drawText(canvasContext, this.city.getName(), this.name, CityBanner.NAME_FONT);

    const religion = this.city.getReligion().majority;
    if (this.religionIcon && religion)
      CityBanner.drawSprite(canvasContext, Religions.getIcon(religion), this.religionIcon);

    const production = this.city.getProductionQueue()[0];
    if (this.productionBar && production) {
      CityBanner.drawText(canvasContext, String(production.turns ?? "-"), this.productionTurns, CityBanner.TURNS_FONT);
      CityBanner.drawBar(
        canvasContext,
        this.productionBar,
        (production.progress ?? 0) / production.cost,
        CityBanner.PRODUCTION_COLOR
      );
      this.drawProductionIcon(canvasContext, CityScreen.resolveProductionIcon(production));
    }

    canvasContext.restore();
  }

  // Everything it shows, so the globe redraws it when any of it changes.
  public getDrawState() {
    const production = this.city.getProductionQueue()[0];
    return [
      this.getX(),
      this.getWidth(),
      this.city.getName(),
      this.getPopulationText(),
      this.getGrowthTurnsText(),
      this.getGrowthFraction(),
      this.city.getReligion().majority ?? "",
      this.getDefenseText(),
      production ? `${production.name}:${production.progress ?? 0}/${production.cost}:${production.turns}` : ""
    ].join("|");
  }

  public onDestroyed() {
    this.hideTooltip();
    super.onDestroyed();
  }

  private drawDefense(context: CanvasRenderingContext2D) {
    const { x, y, width, height } = this.defenseTab;
    context.beginPath();
    context.roundRect(x, y, width, height, 1.5);
    context.fillStyle = CityBanner.PILL_COLOR;
    context.fill();
    CityBanner.drawSprite(context, SpriteRegion.ICON_DEFENSE, this.defenseIcon);
    CityBanner.drawText(context, this.getDefenseText(), this.defenseText, CityBanner.DEFENSE_FONT);
  }

  private drawPill(context: CanvasRenderingContext2D) {
    const { x, y, width, height } = this.pill;
    context.beginPath();
    context.roundRect(x, y, width, height, height / 2);
    context.fillStyle = CityBanner.PILL_COLOR;
    context.fill();
    context.lineWidth = 0.75;
    context.strokeStyle = this.city.getPlayer().getCivilizationData()["outside_border_color"] ?? "white";
    context.stroke();
  }

  // The item in a dark circle, like Civ 5's.
  private drawProductionIcon(context: CanvasRenderingContext2D, region: SpriteRegion) {
    const box = this.productionIcon;
    context.beginPath();
    context.arc(box.x + box.width / 2, box.y + box.height / 2, box.width / 2 + 0.5, 0, Math.PI * 2);
    context.fillStyle = CityBanner.BOX_COLOR;
    context.fill();
    CityBanner.drawSprite(context, region, box);
  }

  // Civ 5 shows the city's strength as a whole number.
  private getDefenseText(): string {
    return String(Math.round(this.city.getStrength()));
  }

  private getPopulationText(): string {
    return String(this.city.getPopulation());
  }

  // Turns to the next citizen, or "-" while the city isn't growing.
  private getGrowthTurnsText(): string {
    const turns = this.city.getTurnsToGrow();
    return turns === null || turns === undefined ? "-" : String(turns);
  }

  private getGrowthFraction(): number {
    const required = this.city.getStat("foodRequiredToGrow");
    return required ? (this.city.getStat("foodSurplus") ?? 0) / required : 0;
  }

  private hoverReligion(screenX: number, screenY: number) {
    const camera = Game.getInstance().getCurrentScene().getCamera();
    const world = camera?.screenToWorldFor(this, screenX, screenY);
    // A wrapped world repeats the banner every world-width across, so test the nearest copy.
    const over =
      !!world &&
      CityBanner.inside(this.religionIcon, this.getX() + MapWrap.wrapWorldX(world[0] - this.getX()), world[1]);
    if (over && !this.tooltipShown) {
      this.tooltipShown = true;
      CityReligionTooltip.show(this.city.getName(), this.city.getReligion());
    }
    if (!over) this.hideTooltip();
  }

  private hideTooltip() {
    if (!this.tooltipShown) return;

    this.tooltipShown = false;
    CityReligionTooltip.hide();
  }
}
