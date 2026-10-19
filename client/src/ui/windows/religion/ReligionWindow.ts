import { GameImage, SpriteRegion } from "../../../Assets";
import { Game } from "../../../Game";
import { NetworkEvents, WebsocketClient } from "../../../network/Client";
import { BeliefSummary, ReligionOverview } from "../../../religion/Religions";
import { Actor } from "../../../scene/Actor";
import { ActorGroup } from "../../../scene/ActorGroup";
import { Button, ButtonSize } from "../../components/Button";
import { Label } from "../../components/Label";
import { YieldLine } from "../../components/YieldLine";
import { UITheme } from "../../UITheme";

const WINDOW_WIDTH = 760;
const PADDING = 16;
const LINE_HEIGHT = UITheme.FONT_SIZE + 14;
const SECTION_GAP = 12;
const TITLE_FONT = `bold ${UITheme.FONT_SIZE}px serif`;
const RULE_COLOR = "rgba(255, 255, 255, 0.3)";
const BONUS_COLOR = "#8ee07a";
const NOT_YET_COLOR = "gray";

// One line of the window: words, or yields with words after them.
interface WindowLine {
  text: string;
  color: string;
  font?: string;
  stats?: Record<string, number>;
  // A rule above the line, starting a new section.
  rule?: boolean;
}

/**
 * The faith button's window: the player's pantheon and its bonus, their religion with its founder and
 * follower beliefs, which cities follow them and what each gets from them, and what it all adds up to. The server works it all out and sends it as "religionOverview"; this only shows it.
 */
export class ReligionWindow extends ActorGroup {
  private onClose: () => void;
  private overview: ReligionOverview | undefined;

  constructor(options: { onClose: () => void }) {
    super({ x: 0, y: 0, z: 7, width: WINDOW_WIDTH, height: 0, cameraApplies: false });

    this.onClose = options.onClose;

    NetworkEvents.on<ReligionOverview>({
      eventName: "religionOverview",
      parentObject: this,
      callback: (data) => this.build(data)
    });

    WebsocketClient.sendMessage({ event: "requestReligionOverview" });
  }

  private static getLines(overview: ReligionOverview): WindowLine[] {
    return [
      ...ReligionWindow.getPantheonLines(overview),
      ...ReligionWindow.getBeliefLines(overview),
      ...ReligionWindow.getBonusLines(overview)
    ];
  }

  private static getPantheonLines(overview: ReligionOverview): WindowLine[] {
    if (overview.pantheon) return ReligionWindow.describe("Pantheon", overview.pantheon);

    const cost = `Found one at ${overview.pantheonCost} Faith (you have ${overview.faith}).`;
    return [
      { text: "Pantheon: none yet", color: "white", font: TITLE_FONT },
      { text: overview.canFoundPantheon ? "You can found one now: Choose Pantheon." : cost, color: "lightgray" }
    ];
  }

  private static getBeliefLines(overview: ReligionOverview): WindowLine[] {
    if (overview.religion) {
      return [
        {
          text: `Religion: ${overview.religion.name} (holy city ${overview.religion.holyCity})`,
          color: "white",
          font: TITLE_FONT,
          rule: true
        },
        ...ReligionWindow.describe("Founder Belief", overview.founderBelief),
        ...ReligionWindow.describe("Follower Belief", overview.followerBelief)
      ];
    }

    const cost = overview.pantheon
      ? `Found one at ${overview.religionCost} Faith (you have ${overview.faith}).`
      : `Found a pantheon first, then a religion at ${overview.religionCost} Faith.`;
    return [
      { text: "Religion: none yet", color: "white", font: TITLE_FONT, rule: true },
      { text: overview.canFoundReligion ? "You can found one now: Found Religion." : cost, color: "lightgray" }
    ];
  }

  // "Pantheon: Desert Folklore", its bonus, and whatever of it isn't in the game yet.
  private static describe(heading: string, belief: BeliefSummary | null): WindowLine[] {
    if (!belief) return [];

    return [
      { text: `${heading}: ${belief.name}`, color: "white", font: TITLE_FONT },
      { text: belief.description, color: BONUS_COLOR },
      ...belief.not_yet.map((text) => ({ text: `Not in the game yet: ${text}`, color: NOT_YET_COLOR }))
    ];
  }

  private static getBonusLines(overview: ReligionOverview): WindowLine[] {
    if (overview.cities.length < 1) {
      return [
        { text: "Cities following it", color: "white", font: TITLE_FONT, rule: true },
        { text: "None yet", color: NOT_YET_COLOR }
      ];
    }

    const hasTotals = Object.keys(overview.totals).length > 0;
    return [
      { text: "Total each turn:", color: "white", font: TITLE_FONT, rule: true, stats: overview.totals },
      ...(hasTotals ? [] : [{ text: "No yields from it right now", color: NOT_YET_COLOR }]),
      { text: "Cities following it", color: "white", font: TITLE_FONT, rule: true },
      ...overview.cities.map((city) => ({ text: city.name, color: "white", stats: city.bonuses })),
      ...(Object.keys(overview.empire).length > 0
        ? [{ text: "Empire-wide", color: "white", stats: overview.empire }]
        : [])
    ];
  }

  private static createRule(x: number, y: number): Actor {
    return new Actor({
      color: RULE_COLOR,
      x: x + PADDING,
      y,
      width: WINDOW_WIDTH - PADDING * 2,
      height: 1,
      cameraApplies: false
    });
  }

  // The words, then any yields after them: "Rome +2 [faith]".
  private static createLine(line: WindowLine, x: number, y: number): Actor[] {
    const label = new Label({ text: line.text, x, y, font: line.font ?? UITheme.FONT, fontColor: line.color });
    if (!line.stats) return [label];

    const textWidth = Game.getInstance().measureText(line.text, line.font ?? UITheme.FONT).width;
    const yields = YieldLine.create({ stats: line.stats, x: x + textWidth + 12, y, color: BONUS_COLOR });
    return [label, ...yields.actors];
  }
  public getOverview(): ReligionOverview | undefined {
    return this.overview;
  }

  // Every Label in the window, for the scenario test to check what's shown.
  public getTexts(): string[] {
    return this.getActors()
      .filter((actor): actor is Label => actor instanceof Label)
      .map((label) => label.getText());
  }

  public onDestroyed() {
    super.onDestroyed();
    NetworkEvents.removeCallbacksByParentObject(this);
  }

  private async build(overview: ReligionOverview) {
    const lines = ReligionWindow.getLines(overview);
    const rules = lines.filter((line) => line.rule).length;

    const title = new Label({ text: "Religion", font: TITLE_FONT, fontColor: "white" });
    await title.conformSize();

    const listTop = PADDING + title.getHeight() + 14;
    const height = listTop + lines.length * LINE_HEIGHT + rules * SECTION_GAP + PADDING;
    const x = Game.getInstance().getWidth() / 2 - WINDOW_WIDTH / 2;
    const y = Math.max(UITheme.STATUS_BAR_HEIGHT, Game.getInstance().getHeight() / 2 - height / 2);

    const actors: Actor[] = [
      new Actor({
        image: Game.getInstance().getImage(GameImage.POPUP_BOX),
        x,
        y,
        width: WINDOW_WIDTH,
        height,
        nineSlice: true,
        cornerSize: 20
      }),
      title,
      new Button({
        icon: SpriteRegion.ICON_CANCEL,
        iconOnly: true,
        size: ButtonSize.ICON_SMALL,
        x: x + WINDOW_WIDTH - PADDING - ButtonSize.ICON_SMALL.width,
        y: y + PADDING,
        onClicked: () => this.onClose()
      })
    ];
    title.setPosition(x + WINDOW_WIDTH / 2 - title.getWidth() / 2, y + PADDING);

    let lineY = y + listTop;
    for (const line of lines) {
      if (line.rule) {
        actors.push(ReligionWindow.createRule(x, lineY + SECTION_GAP / 2));
        lineY += SECTION_GAP;
      }
      actors.push(...ReligionWindow.createLine(line, x + PADDING, lineY + 7));
      lineY += LINE_HEIGHT;
    }

    for (const actor of [...this.getActors()]) this.removeActor(actor);
    this.setPosition(x, y);
    this.setSize(WINDOW_WIDTH, height);
    actors.forEach((actor) => this.addActor(actor));
    this.overview = overview;
  }
}
