import { GameImage, resolveSpriteRegion, SpriteRegion } from "../../Assets";
import { Game } from "../../Game";
import { NetworkEvents, WebsocketClient } from "../../network/Client";
import { Actor } from "../../scene/Actor";
import { ListBox } from "../components/Listbox";
import { UITheme } from "../UITheme";
import { TechDetailData, TechDetailWindow } from "./TechDetailWindow";

interface FreeTechsEvent {
  count: number;
  choices: string[];
  technologies: TechDetailData[];
}

/**
 * Civ 5's free tech picker (after the Great Library), down the left of the screen like the pantheon
 * list: every tech the player could research now, each with what it unlocks on the line below its name.
 * Clicking one opens the research tree's TechDetailWindow, whose Pick Free Tech button takes it.
 * The server decides what's listed and whether the pick goes through (see server Player.chooseFreeTech).
 */
export class FreeTechList extends ListBox {
  private static readonly WIDTH = 560;
  private static readonly ROW_HEIGHT = 84;
  private static readonly TITLE_HEIGHT = 44;
  private static readonly PADDING = 8;
  private static readonly LINE_GAP = 8;
  private static readonly UNLOCK_ICON_SIZE = 28;
  private static readonly DETAIL_GAP = 16;

  private onChosen: () => void;
  private onClose: () => void;
  private choices: TechDetailData[];
  private technologies: TechDetailData[];
  private detailWindow: TechDetailWindow | undefined;

  constructor(options: { onChosen: () => void; onClose: () => void }) {
    super({
      x: 0,
      y: UITheme.STATUS_BAR_HEIGHT,
      width: FreeTechList.WIDTH,
      height: Game.getInstance().getHeight() - UITheme.STATUS_BAR_HEIGHT,
      rowHeight: FreeTechList.ROW_HEIGHT,
      textFont: UITheme.FONT,
      fontColor: "white"
    });

    this.onChosen = options.onChosen;
    this.onClose = options.onClose;
    this.choices = [];
    this.technologies = [];

    NetworkEvents.on<FreeTechsEvent>({
      eventName: "freeTechs",
      parentObject: this,
      callback: (data) => this.build(data)
    });

    WebsocketClient.sendMessage({ event: "requestFreeTechs" });
  }

  private static createIcon(assetName: string | undefined, x: number, y: number, size: number): Actor {
    return new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: (assetName && resolveSpriteRegion(assetName)) || SpriteRegion.ICON_UNKNOWN,
      x,
      y,
      width: size,
      height: size,
      cameraApplies: false
    });
  }

  public getTechNames(): string[] {
    return this.choices.map((tech) => tech.name);
  }

  public getDetailWindow(): TechDetailWindow | undefined {
    return this.detailWindow;
  }

  /** Opens the tech's detail window, as clicking its row would. For scenarios. */
  public openTechDetail(name: string): boolean {
    const tech = this.technologies.find((candidate) => candidate.name === name);
    if (!tech) return false;

    this.closeTechDetail();
    this.detailWindow = new TechDetailWindow({
      tech,
      allTechs: this.technologies,
      onClose: () => this.closeTechDetail(),
      onOpenTech: (techName) => this.openTechDetail(techName),
      onPickFree: () => this.onChosen(),
      left: this.x + this.width + FreeTechList.DETAIL_GAP
    });
    Game.getInstance().getCurrentScene().addActor(this.detailWindow);
    return true;
  }

  public onDestroyed(): void {
    this.closeTechDetail();
    NetworkEvents.removeCallbacksByParentObject(this);
    super.onDestroyed();
  }

  private build(data: FreeTechsEvent) {
    this.clearRows();
    this.technologies = data.technologies;
    this.choices = data.choices
      .map((name) => data.technologies.find((tech) => tech.name === name))
      .filter((tech) => tech !== undefined);

    const title = data.count > 1 ? `Pick ${data.count} Free Techs` : "Pick a Free Tech";
    this.addClosableTitle(title, FreeTechList.TITLE_HEIGHT, this.onClose);
    this.choices.forEach((tech) => this.addTechRow(tech));
  }

  private addTechRow(tech: TechDetailData) {
    const { x: rowX, y: rowY } = this.getNextRowPosition();
    const textX = rowX + FreeTechList.PADDING + UITheme.ICON_SIZE + FreeTechList.PADDING;
    const nameY = rowY + FreeTechList.PADDING + 4;
    const unlocksY = nameY + UITheme.FONT_SIZE + FreeTechList.LINE_GAP;

    const row = this.addRow({
      text: tech.name,
      textX,
      textY: nameY,
      rowHeight: FreeTechList.ROW_HEIGHT,
      actorIcons: [
        FreeTechList.createIcon(
          tech.asset_name,
          rowX + FreeTechList.PADDING,
          rowY + FreeTechList.ROW_HEIGHT / 2 - UITheme.ICON_SIZE / 2,
          UITheme.ICON_SIZE
        ),
        ...this.createUnlockIcons(tech, textX, unlocksY)
      ]
    });

    row.on("clicked", () => this.openTechDetail(tech.name));
    row.on("mousemove", () => {
      if (row.isMouseInside()) Game.getInstance().setCursor("pointer");
    });
    row.on("mouse_exit", () => Game.getInstance().setCursor("default"));
  }

  // What the tech unlocks, as the icons the research tree shows for it, as many as fit the row.
  private createUnlockIcons(tech: TechDetailData, x: number, y: number): Actor[] {
    const unlocks = [
      ...(tech.unlocks?.units ?? []),
      ...(tech.unlocks?.buildings ?? []),
      ...(tech.unlocks?.wonders ?? []),
      ...(tech.unlocks?.improvements ?? [])
    ];
    const step = FreeTechList.UNLOCK_ICON_SIZE + 4;
    const fits = Math.floor((this.x + this.width - FreeTechList.PADDING - x) / step);

    return unlocks
      .slice(0, fits)
      .map((unlock, index) =>
        FreeTechList.createIcon(unlock.asset_name, x + index * step, y, FreeTechList.UNLOCK_ICON_SIZE)
      );
  }

  private closeTechDetail() {
    if (!this.detailWindow) return;

    Game.getInstance().getCurrentScene().removeActor(this.detailWindow);
    this.detailWindow = undefined;
  }
}
