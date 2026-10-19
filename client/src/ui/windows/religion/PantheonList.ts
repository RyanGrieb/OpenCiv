import { GameImage, SpriteRegion } from "../../../Assets";
import { Game } from "../../../Game";
import { NetworkEvents, WebsocketClient } from "../../../network/Client";
import { PantheonData, PantheonsEvent } from "../../../religion/Pantheons";
import { Actor } from "../../../scene/Actor";
import { Label } from "../../components/Label";
import { ListBox } from "../../components/Listbox";
import { Tooltip, TooltipYield } from "../../components/Tooltip";
import { UITheme } from "../../UITheme";
import { PantheonTooltip } from "./PantheonTooltip";

/**
 * Civ 5's pantheon picker, down the left of the screen like a city's production list: every pantheon
 * no civilization has founded yet, each with its bonus on the line below its name, written the way
 * the building tooltip writes a building's stats. Hovering one shows its tooltip; clicking it founds it.
 * The server decides what's listed and whether founding goes through (see server PlayerReligion).
 */
export class PantheonList extends ListBox {
  private static readonly WIDTH = 560;
  private static readonly ROW_HEIGHT = 84;
  private static readonly TITLE_HEIGHT = 44;
  private static readonly PADDING = 8;
  private static readonly LINE_GAP = 8;
  // Between a yield's number and the line's text, then between yields - as in Tooltip.
  private static readonly TEXT_GAP = 12;
  private static readonly YIELD_GAP = 2;
  private static readonly BONUS_COLOR = "#8ee07a";
  private static readonly NOT_YET_COLOR = "gray";

  private onChosen: () => void;
  private pantheons: PantheonData[];
  private canFound: boolean;
  // The pantheon under the mouse, and its tooltip once built. tooltipBuild drops a tooltip that finishes
  // building after the mouse has already moved on.
  private hoveredPantheon: PantheonData | undefined;
  private tooltip: PantheonTooltip | undefined;
  private tooltipBuild = 0;
  private rowsByName = new Map<string, { getY(): number }>();

  constructor(options: { onChosen: () => void }) {
    super({
      x: 0,
      y: UITheme.STATUS_BAR_HEIGHT,
      width: PantheonList.WIDTH,
      height: Game.getInstance().getHeight() - UITheme.STATUS_BAR_HEIGHT,
      rowHeight: PantheonList.ROW_HEIGHT,
      textFont: UITheme.FONT,
      fontColor: "white"
    });

    this.onChosen = options.onChosen;
    this.pantheons = [];
    this.canFound = false;

    NetworkEvents.on<PantheonsEvent>({
      eventName: "pantheons",
      parentObject: this,
      callback: (data) => this.build(data)
    });

    WebsocketClient.sendMessage({ event: "requestPantheons" });
  }

  // Whatever is under the yields' number: the bonus in words, gray when the game can't do any of it yet.
  private static getTextColor(pantheon: PantheonData): string {
    const doesNothing = (pantheon.not_yet ?? []).some((text) => text.includes("gives nothing"));
    return doesNothing ? PantheonList.NOT_YET_COLOR : PantheonList.BONUS_COLOR;
  }

  // "+1 [faith] from Shrines": the yields as icons the size the status bar draws them, then the words.
  private static createBonusLine(pantheon: PantheonData, x: number, y: number): Actor[] {
    const color = PantheonList.getTextColor(pantheon);
    const yields: TooltipYield[] = Tooltip.getYields([pantheon.yields ?? {}]);
    const iconY = y - UITheme.centerTextY(UITheme.ICON_SIZE);
    const actors: Actor[] = [];
    let lineX = x;

    yields.forEach((entry, index) => {
      if (index > 0) lineX += PantheonList.YIELD_GAP;
      actors.push(PantheonList.createText(entry.text, lineX, y, color));
      lineX += Game.getInstance().measureText(entry.text, UITheme.FONT).width;
      actors.push(
        new Actor({
          image: Game.getInstance().getImage(GameImage.SPRITESHEET),
          spriteRegion: entry.icon,
          x: lineX,
          y: iconY,
          width: UITheme.ICON_SIZE,
          height: UITheme.ICON_SIZE,
          cameraApplies: false
        })
      );
      lineX += UITheme.ICON_SIZE;
    });

    if (yields.length > 0) lineX += PantheonList.TEXT_GAP - PantheonList.YIELD_GAP;
    actors.push(PantheonList.createText(pantheon.text, lineX, y, color));
    return actors;
  }

  private static createText(text: string, x: number, y: number, color: string): Label {
    return new Label({ text, x, y, font: UITheme.FONT, fontColor: color, cameraApplies: false });
  }

  public getPantheonNames(): string[] {
    return this.pantheons.map((pantheon) => pantheon.name);
  }

  /** Founds the pantheon, as clicking its row would. For scenarios. */
  public choose(name: string): boolean {
    const pantheon = this.pantheons.find((entry) => entry.name === name);
    if (!pantheon || !this.canFound) return false;

    WebsocketClient.sendMessage({ event: "foundPantheon", name: pantheon.name });
    this.onChosen();
    return true;
  }

  /** Opens the pantheon's tooltip, as hovering its row would. For scenarios. */
  public showTooltipFor(name: string): boolean {
    const pantheon = this.pantheons.find((entry) => entry.name === name);
    const row = this.rowsByName.get(name);
    if (!pantheon || !row) return false;

    this.showTooltip(pantheon, row.getY());
    return true;
  }

  public getTooltip(): PantheonTooltip | undefined {
    return this.tooltip;
  }

  public onDestroyed(): void {
    this.hideTooltip();
    NetworkEvents.removeCallbacksByParentObject(this);
    super.onDestroyed();
  }

  private build(data: PantheonsEvent) {
    this.hideTooltip();
    this.clearRows();
    this.rowsByName.clear();
    this.pantheons = data.available;
    this.canFound = data.canFound;

    const title = data.canFound ? `Choose a Pantheon (${data.cost} Faith)` : `Pantheons (${data.cost} Faith)`;
    this.addCategory(title, PantheonList.TITLE_HEIGHT);
    data.available.forEach((pantheon) => this.addPantheonRow(pantheon));
  }

  private addPantheonRow(pantheon: PantheonData) {
    const { x: rowX, y: rowY } = this.getNextRowPosition();
    const textX = rowX + PantheonList.PADDING + UITheme.ICON_SIZE + PantheonList.PADDING;
    const nameY = rowY + PantheonList.PADDING + 4;
    const bonusY = nameY + UITheme.FONT_SIZE + PantheonList.LINE_GAP;

    const row = this.addRow({
      text: pantheon.name,
      textX,
      textY: nameY,
      rowHeight: PantheonList.ROW_HEIGHT,
      actorIcons: [
        new Actor({
          image: Game.getInstance().getImage(GameImage.SPRITESHEET),
          spriteRegion: SpriteRegion.ICON_FAITH,
          x: rowX + PantheonList.PADDING,
          y: rowY + PantheonList.ROW_HEIGHT / 2 - UITheme.ICON_SIZE / 2,
          width: UITheme.ICON_SIZE,
          height: UITheme.ICON_SIZE,
          cameraApplies: false
        }),
        ...PantheonList.createBonusLine(pantheon, textX, bonusY)
      ]
    });
    this.rowsByName.set(pantheon.name, row);

    row.on("clicked", () => this.choose(pantheon.name));
    row.on("mousemove", () => {
      if (!row.isMouseInside()) return;

      if (this.canFound) Game.getInstance().setCursor("pointer");
      if (this.hoveredPantheon !== pantheon) this.showTooltip(pantheon, row.getY());
    });
    row.on("mouse_exit", () => {
      Game.getInstance().setCursor("default");
      if (this.hoveredPantheon === pantheon) this.hideTooltip();
    });
  }

  // Beside the list, level with the row.
  private async showTooltip(pantheon: PantheonData, rowY: number) {
    this.hoveredPantheon = pantheon;
    const build = ++this.tooltipBuild;
    const tooltip = await PantheonTooltip.create(this.x + this.width + 8, rowY, pantheon);
    if (build !== this.tooltipBuild) return;

    this.removeTooltip();
    this.tooltip = tooltip;
    Game.getInstance().getCurrentScene().addActor(tooltip);
  }

  private hideTooltip() {
    this.hoveredPantheon = undefined;
    this.tooltipBuild++;
    this.removeTooltip();
  }

  private removeTooltip() {
    if (!this.tooltip) return;

    Game.getInstance().getCurrentScene().removeActor(this.tooltip);
    this.tooltip = undefined;
  }
}
