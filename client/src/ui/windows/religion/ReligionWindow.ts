import { GameImage, SpriteRegion } from "../../../Assets";
import { Game } from "../../../Game";
import { NetworkEvents, WebsocketClient } from "../../../network/Client";
import { BeliefSummary, ReligionOverview, Religions } from "../../../religion/Religions";
import { Actor } from "../../../scene/Actor";
import { ActorGroup } from "../../../scene/ActorGroup";
import { Button, ButtonSize } from "../../components/Button";
import { Label } from "../../components/Label";
import { YieldText } from "../../components/YieldText";
import { UITheme } from "../../UITheme";

const WINDOW_WIDTH = 760;
const PADDING = 16;
const LINE_HEIGHT = UITheme.FONT_SIZE + 14;
const SECTION_GAP = 12;
const TITLE_FONT = `bold ${UITheme.FONT_SIZE}px serif`;
const RULE_COLOR = "rgba(255, 255, 255, 0.3)";
const BONUS_COLOR = "#8ee07a";
const NOT_YET_COLOR = "gray";
const ICON_SIZE = UITheme.FONT_SIZE + 8;

// One line of the window: words, or yields with words after them.
interface WindowLine {
  text: string;
  color: string;
  font?: string;
  stats?: Record<string, number>;
  // A rule above the line, starting a new section.
  rule?: boolean;
  // Drawn before the words.
  icon?: SpriteRegion;
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
          icon: Religions.getIcon(overview.religion.name),
          color: "white",
          font: TITLE_FONT,
          rule: true
        },
        ...ReligionWindow.describe("Founder Belief", overview.founderBelief),
        ...ReligionWindow.describe("Follower Belief", overview.followerBelief),
        ...ReligionWindow.describe("Follower Belief", overview.followerBelief2),
        ...ReligionWindow.describe("Enhancer Belief", overview.enhancerBelief),
        { text: ReligionWindow.describeProphetChance(overview), color: "lightgray" }
      ];
    }

    const prophet = overview.pantheon
      ? ReligionWindow.describeProphetChance(overview)
      : `Found a pantheon first. A Great Prophet is then born at ${overview.prophetCost} Faith.`;
    return [
      { text: "Religion: none yet", color: "white", font: TITLE_FONT, rule: true },
      {
        text: overview.hasProphet ? "Your Great Prophet can found one in any of your cities." : prophet,
        color: "lightgray"
      }
    ];
  }

  // From the Great Prophet's cost on, a 5% chance each turn and 1% more for each Faith past it.
  private static describeProphetChance(overview: ReligionOverview): string {
    const cost = `Next Great Prophet from ${overview.prophetCost} Faith (you have ${overview.faith})`;
    return overview.prophetChance > 0 ? `${cost}: ${overview.prophetChance}% chance each turn.` : `${cost}.`;
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
      ...overview.cities.map((city) => ({
        text: ReligionWindow.describeCity(overview, city),
        color: city.civilization ? "lightgray" : "white",
        stats: city.bonuses
      })),
      ...(Object.keys(overview.empire).length > 0
        ? [{ text: "Empire-wide", color: "white", stats: overview.empire }]
        : [])
    ];
  }

  // "Rome (2 of 3 citizens follow)", or for another civilization's city "Washington, America (...)".
  private static describeCity(overview: ReligionOverview, city: ReligionOverview["cities"][number]): string {
    const name = city.civilization ? `${city.name}, ${city.civilization}` : city.name;
    if (!overview.religion) return name;

    return `${name} (${city.followers} of ${city.population} follow)`;
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

  // Any icon, the words, then any yields after them: "Rome +2 [faith]".
  private static createLine(line: WindowLine, x: number, y: number): Actor[] {
    const icon = line.icon ? [ReligionWindow.createIcon(line.icon, x, y)] : [];
    const textX = line.icon ? x + ICON_SIZE + 6 : x;
    const label = new Label({ text: line.text, x: textX, y, font: line.font ?? UITheme.FONT, fontColor: line.color });
    if (!line.stats) return [...icon, label];

    const textWidth = Game.getInstance().measureText(line.text, line.font ?? UITheme.FONT).width;
    const yields = new Label({
      text: YieldText.of([line.stats]),
      x: textX + textWidth + 12,
      y,
      font: UITheme.FONT,
      fontColor: BONUS_COLOR
    });
    return [...icon, label, yields];
  }

  // Centred on the line's text.
  private static createIcon(spriteRegion: SpriteRegion, x: number, y: number): Actor {
    return new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion,
      x,
      y: y + UITheme.FONT_SIZE / 2 - ICON_SIZE / 2 + 2,
      width: ICON_SIZE,
      height: ICON_SIZE,
      cameraApplies: false
    });
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
