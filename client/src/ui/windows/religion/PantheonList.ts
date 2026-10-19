import { GameImage, SpriteRegion } from "../../../Assets";
import { Game } from "../../../Game";
import { NetworkEvents, WebsocketClient } from "../../../network/Client";
import { PantheonData, PantheonsEvent } from "../../../religion/Pantheons";
import { Actor } from "../../../scene/Actor";
import { ButtonSize } from "../../components/Button";
import { ListBox } from "../../components/Listbox";
import { YieldLine } from "../../components/YieldLine";
import { UITheme } from "../../UITheme";
import { BeliefTooltip } from "./BeliefTooltip";

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
  private static readonly BONUS_COLOR = "#8ee07a";
  private static readonly NOT_YET_COLOR = "gray";

  private onChosen: () => void;
  private onClose: () => void;
  private pantheons: PantheonData[];
  private canFound: boolean;
  // The pantheon under the mouse, and its tooltip once built. tooltipBuild drops a tooltip that finishes
  // building after the mouse has already moved on.
  private hoveredPantheon: PantheonData | undefined;
  private tooltip: BeliefTooltip | undefined;
  private tooltipBuild = 0;
  private rowsByName = new Map<string, { getY(): number }>();

  constructor(options: { onChosen: () => void; onClose: () => void }) {
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
    this.onClose = options.onClose;
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

  public getTooltip(): BeliefTooltip | undefined {
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
    this.addCloseButton();
    data.available.forEach((pantheon) => this.addPantheonRow(pantheon));
  }

  // In the title's row, so it scrolls with the title and never sits over a pantheon a click would found.
  // A plain icon rather than a Button: rows scroll by moving each actor in them, and a Button's own icon
  // wouldn't move with it.
  private addCloseButton() {
    const titleRow = this.getRows()[0];
    const size = ButtonSize.ICON_SMALL;
    const close = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.ICON_CANCEL,
      x: titleRow.getX() + titleRow.getWidth() - PantheonList.PADDING - size.width,
      y: titleRow.getY() + (PantheonList.TITLE_HEIGHT - size.height) / 2,
      width: size.width,
      height: size.height,
      cameraApplies: false
    });
    // A row's children never hear the click itself (ActorGroup only relays "clicked" one level down),
    // but they do track the mouse, so the title row asks whether it was over the icon.
    titleRow.on("clicked", () => {
      if (close.isMouseInside()) this.onClose();
    });
    close.on("mousemove", () => {
      if (close.isMouseInside()) Game.getInstance().setCursor("pointer");
    });
    close.on("mouse_exit", () => Game.getInstance().setCursor("default"));
    titleRow.addActor(close);
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
        ...YieldLine.create({
          stats: pantheon.yields ?? {},
          x: textX,
          y: bonusY,
          color: PantheonList.getTextColor(pantheon),
          text: pantheon.text
        }).actors
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
    const tooltip = await BeliefTooltip.create(this.x + this.width + 8, rowY, pantheon);
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
