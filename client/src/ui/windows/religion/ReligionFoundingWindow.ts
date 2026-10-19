import { GameImage, SpriteRegion } from "../../../Assets";
import { Game } from "../../../Game";
import { NetworkEvents, WebsocketClient } from "../../../network/Client";
import { BeliefData, Religions, ReligionsEvent } from "../../../religion/Religions";
import { Actor } from "../../../scene/Actor";
import { ActorGroup } from "../../../scene/ActorGroup";
import { Button, ButtonSize } from "../../components/Button";
import { Label } from "../../components/Label";
import { SectionList, SectionListRow } from "../../components/SectionList";
import { YieldLine } from "../../components/YieldLine";
import { UITheme } from "../../UITheme";
import { BeliefTooltip } from "./BeliefTooltip";

export type ReligionChoice = "religion" | "founderBelief" | "followerBelief";

// A clickable row of the list: highlighted while chosen, lighter while the mouse is over it.
class ChoiceRow extends Actor {
  private static readonly COLOR = "rgba(0, 0, 0, 0.2)";
  private static readonly HOVER_COLOR = "rgba(255, 255, 255, 0.12)";
  private static readonly CHOSEN_COLOR = "rgba(255, 215, 0, 0.3)";

  constructor(options: {
    x: number;
    y: number;
    width: number;
    height: number;
    chosen: boolean;
    onClicked: () => void;
    onHover: (hovered: boolean) => void;
  }) {
    const color = options.chosen ? ChoiceRow.CHOSEN_COLOR : ChoiceRow.COLOR;
    super({ ...options, color, cameraApplies: false });

    this.on("mouse_enter", () => {
      if (!options.chosen) this.color = ChoiceRow.HOVER_COLOR;
      Game.getInstance().setCursor("pointer");
      options.onHover(true);
    });
    this.on("mouse_exit", () => {
      this.color = color;
      Game.getInstance().setCursor("default");
      options.onHover(false);
    });
    this.on("clicked", options.onClicked);
  }

  public onDestroyed(): void {
    super.onDestroyed();
    // Choosing a row rebuilds the list under the cursor, so mouse_exit never fires for it.
    if (this.mouseInside) Game.getInstance().setCursor("default");
  }
}

/**
 * Civ 5's religion founding screen, opened from a Great Prophet's Found Religion action and down the
 * left of the screen like the pantheon list: a religion no
 * one has founded yet, a founder belief and a follower belief, each in its own section, then a Found
 * Religion button once all three are chosen. Each belief shows its bonus below its name the way the
 * pantheon list does, and its tooltip on hover. The server decides what's offered and whether founding
 * goes through (see server PlayerReligion).
 */
export class ReligionFoundingWindow extends ActorGroup {
  private static readonly WIDTH = 560;
  private static readonly PADDING = 12;
  private static readonly TITLE_HEIGHT = 48;
  private static readonly FOOTER_HEIGHT = 120;
  private static readonly NAME_ROW_HEIGHT = 44;
  private static readonly NAME_ICON_SIZE = 32;
  private static readonly BELIEF_ROW_HEIGHT = 84;
  private static readonly ROW_GAP = 4;
  private static readonly LINE_GAP = 8;
  private static readonly TITLE_FONT = `bold ${UITheme.FONT_SIZE}px serif`;
  private static readonly BONUS_COLOR = "#8ee07a";
  private static readonly NOT_YET_COLOR = "gray";

  // The Great Prophet founding the religion, which the server uses up.
  private prophetId: number;
  private onChosen: () => void;
  private onClose: () => void;
  private data: ReligionsEvent | undefined;
  private chosen: Record<ReligionChoice, string | undefined> = {
    religion: undefined,
    founderBelief: undefined,
    followerBelief: undefined
  };
  private list: SectionList;
  private footerActors: Actor[] = [];
  // The belief under the mouse, and its tooltip once built. tooltipBuild drops a tooltip that finishes
  // building after the mouse has already moved on.
  private hoveredBelief: BeliefData | undefined;
  private tooltip: BeliefTooltip | undefined;
  private tooltipBuild = 0;

  constructor(options: { prophetId: number; onChosen: () => void; onClose: () => void }) {
    const y = UITheme.STATUS_BAR_HEIGHT;
    const height = Game.getInstance().getHeight() - y;
    super({ x: 0, y, z: 7, width: ReligionFoundingWindow.WIDTH, height, cameraApplies: false });

    this.prophetId = options.prophetId;
    this.onChosen = options.onChosen;
    this.onClose = options.onClose;

    const padding = ReligionFoundingWindow.PADDING;
    this.addActor(
      new Actor({
        image: Game.getInstance().getImage(GameImage.POPUP_BOX),
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        nineSlice: true,
        cornerSize: 20,
        cameraApplies: false
      })
    );
    this.addActor(
      new Button({
        icon: SpriteRegion.ICON_CANCEL,
        iconOnly: true,
        size: ButtonSize.ICON_SMALL,
        x: this.x + this.width - padding - ButtonSize.ICON_SMALL.width,
        y: this.y + (ReligionFoundingWindow.TITLE_HEIGHT - ButtonSize.ICON_SMALL.height) / 2,
        onClicked: () => this.onClose()
      })
    );

    this.list = new SectionList({
      x: this.x + padding,
      y: this.y + ReligionFoundingWindow.TITLE_HEIGHT,
      width: this.width - padding * 2,
      height: this.height - ReligionFoundingWindow.TITLE_HEIGHT - ReligionFoundingWindow.FOOTER_HEIGHT,
      headerHeight: 40,
      font: UITheme.FONT
    });
    this.addActor(this.list);

    NetworkEvents.on<ReligionsEvent>({
      eventName: "religions",
      parentObject: this,
      callback: (data) => this.build(data)
    });

    WebsocketClient.sendMessage({ event: "requestReligions", unitId: this.prophetId });
  }

  // Whatever is under the yields' number: the bonus in words, gray when the game can't do any of it yet.
  private static getTextColor(belief: BeliefData): string {
    const doesNothing = (belief.not_yet ?? []).some((text) => text.includes("gives nothing"));
    return doesNothing ? ReligionFoundingWindow.NOT_YET_COLOR : ReligionFoundingWindow.BONUS_COLOR;
  }

  /** The religions, founder beliefs and follower beliefs on offer, by name. For scenarios. */
  public getChoices(): Record<ReligionChoice, string[]> {
    return {
      religion: this.data?.religions ?? [],
      founderBelief: (this.data?.founderBeliefs ?? []).map((belief) => belief.name),
      followerBelief: (this.data?.followerBeliefs ?? []).map((belief) => belief.name)
    };
  }

  public getChosen(): Record<ReligionChoice, string | undefined> {
    return { ...this.chosen };
  }

  /** Chooses the religion or belief, as clicking its row would. */
  public choose(choice: ReligionChoice, name: string): boolean {
    if (!this.getChoices()[choice].includes(name)) return false;

    this.chosen[choice] = name;
    this.refresh();
    return true;
  }

  /** Founds the chosen religion, as the Found Religion button would. False until all three are chosen. */
  public found(): boolean {
    const { religion, founderBelief, followerBelief } = this.chosen;
    if (!this.data?.canFound || !religion || !founderBelief || !followerBelief) return false;

    WebsocketClient.sendMessage({
      event: "foundReligion",
      unitId: this.prophetId,
      name: religion,
      founderBelief,
      followerBelief
    });
    this.onChosen();
    return true;
  }

  /** Opens the belief's tooltip, as hovering its row would. For scenarios. */
  public showTooltipFor(name: string): boolean {
    const belief = [...(this.data?.founderBeliefs ?? []), ...(this.data?.followerBeliefs ?? [])].find(
      (entry) => entry.name === name
    );
    if (!belief) return false;

    this.showTooltip(belief, this.list.getY());
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

  private build(data: ReligionsEvent) {
    this.data = data;
    // Anything another civilization took meanwhile can't stay chosen.
    (Object.keys(this.chosen) as ReligionChoice[])
      .filter((choice) => !this.getChoices()[choice].includes(this.chosen[choice]))
      .forEach((choice) => (this.chosen[choice] = undefined));
    this.refresh();
  }

  // Rebuilds the list and the footer around whatever is chosen now.
  private refresh() {
    if (!this.data) return;

    this.hideTooltip();
    this.list.setSections([
      { title: "Religion", rows: this.data.religions.map((name) => this.createNameRow(name)) },
      {
        title: "Founder Belief",
        rows: this.data.founderBeliefs.map((belief) => this.createBeliefRow("founderBelief", belief))
      },
      {
        title: "Follower Belief",
        rows: this.data.followerBeliefs.map((belief) => this.createBeliefRow("followerBelief", belief))
      }
    ]);
    this.buildHeaderAndFooter();
  }

  private createNameRow(name: string): SectionListRow {
    const height = ReligionFoundingWindow.NAME_ROW_HEIGHT;
    return {
      height: height + ReligionFoundingWindow.ROW_GAP,
      create: (x, y, width) => [
        new ChoiceRow({
          x,
          y,
          width,
          height,
          chosen: this.chosen.religion === name,
          onClicked: () => this.choose("religion", name),
          onHover: () => {}
        }),
        new Actor({
          image: Game.getInstance().getImage(GameImage.SPRITESHEET),
          spriteRegion: Religions.getIcon(name),
          x: x + ReligionFoundingWindow.PADDING,
          y: y + (height - ReligionFoundingWindow.NAME_ICON_SIZE) / 2,
          width: ReligionFoundingWindow.NAME_ICON_SIZE,
          height: ReligionFoundingWindow.NAME_ICON_SIZE,
          cameraApplies: false
        }),
        new Label({
          text: name,
          font: UITheme.FONT,
          fontColor: "white",
          x: x + ReligionFoundingWindow.PADDING * 2 + ReligionFoundingWindow.NAME_ICON_SIZE,
          y: y + UITheme.centerTextY(height)
        })
      ]
    };
  }

  private createBeliefRow(choice: ReligionChoice, belief: BeliefData): SectionListRow {
    const height = ReligionFoundingWindow.BELIEF_ROW_HEIGHT;
    return {
      height: height + ReligionFoundingWindow.ROW_GAP,
      create: (x, y, width) => {
        const padding = ReligionFoundingWindow.PADDING;
        const textX = x + padding + UITheme.ICON_SIZE + padding;
        const nameY = y + padding;
        return [
          new ChoiceRow({
            x,
            y,
            width,
            height,
            chosen: this.chosen[choice] === belief.name,
            onClicked: () => this.choose(choice, belief.name),
            onHover: (hovered) => (hovered ? this.showTooltip(belief, y) : this.hideTooltipOf(belief))
          }),
          new Actor({
            image: Game.getInstance().getImage(GameImage.SPRITESHEET),
            spriteRegion: SpriteRegion.ICON_FAITH,
            x: x + padding,
            y: y + height / 2 - UITheme.ICON_SIZE / 2,
            width: UITheme.ICON_SIZE,
            height: UITheme.ICON_SIZE,
            cameraApplies: false
          }),
          new Label({ text: belief.name, font: UITheme.FONT, fontColor: "white", x: textX, y: nameY }),
          ...YieldLine.create({
            stats: belief.yields ?? {},
            x: textX,
            y: nameY + UITheme.FONT_SIZE + ReligionFoundingWindow.LINE_GAP,
            color: ReligionFoundingWindow.getTextColor(belief),
            text: belief.text
          }).actors
        ];
      }
    };
  }

  // The title, and below the list what's chosen so far with the Found Religion button.
  private buildHeaderAndFooter() {
    this.footerActors.forEach((actor) => this.removeActor(actor));

    const padding = ReligionFoundingWindow.PADDING;
    const data = this.data;
    const { religion, founderBelief, followerBelief } = this.chosen;
    const title = data.canFound ? "Found a Religion" : "Religions";
    const footerY = this.y + this.height - ReligionFoundingWindow.FOOTER_HEIGHT + padding;
    const ready = data.canFound && !!religion && !!founderBelief && !!followerBelief;

    this.footerActors = [
      new Label({
        text: title,
        font: ReligionFoundingWindow.TITLE_FONT,
        fontColor: "white",
        x: this.x + padding,
        y: this.y + UITheme.centerTextY(ReligionFoundingWindow.TITLE_HEIGHT)
      }),
      new Label({
        text: [
          religion ?? "No religion",
          founderBelief ?? "no founder belief",
          followerBelief ?? "no follower belief"
        ].join(", "),
        font: UITheme.FONT,
        fontColor: ready ? "white" : "lightgray",
        x: this.x + padding,
        y: footerY,
        maxWidth: this.width - padding * 2
      })
    ];
    if (ready) {
      this.footerActors.push(
        new Button({
          text: "Found Religion",
          icon: SpriteRegion.ICON_FAITH,
          size: ButtonSize.LARGE,
          fontColor: "white",
          x: this.x + this.width / 2 - ButtonSize.LARGE.width / 2,
          y: footerY + UITheme.FONT_SIZE + 20,
          onClicked: () => this.found()
        })
      );
    }
    this.footerActors.forEach((actor) => this.addActor(actor));
  }

  // Beside the window, level with the row.
  private async showTooltip(belief: BeliefData, rowY: number) {
    this.hoveredBelief = belief;
    const build = ++this.tooltipBuild;
    const tooltip = await BeliefTooltip.create(this.x + this.width + 8, rowY, belief);
    if (build !== this.tooltipBuild) return;

    this.removeTooltip();
    this.tooltip = tooltip;
    Game.getInstance().getCurrentScene().addActor(tooltip);
  }

  private hideTooltipOf(belief: BeliefData) {
    if (this.hoveredBelief === belief) this.hideTooltip();
  }

  private hideTooltip() {
    this.hoveredBelief = undefined;
    this.tooltipBuild++;
    this.removeTooltip();
  }

  private removeTooltip() {
    if (!this.tooltip) return;

    Game.getInstance().getCurrentScene().removeActor(this.tooltip);
    this.tooltip = undefined;
  }
}
