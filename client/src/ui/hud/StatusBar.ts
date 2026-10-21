import { GameImage, SpriteRegion } from "../../Assets";
import { Game } from "../../Game";
import { NetworkEvents } from "../../network/Client";
import { Actor } from "../../scene/Actor";
import { ActorGroup } from "../../scene/ActorGroup";
import { InGameScene } from "../../scene/type/InGameScene";
import { Strings } from "../../util/Strings";
import { Label } from "../components/Label";
import { Tooltip } from "../components/Tooltip";
import { UITheme } from "../UITheme";
import { FaithTooltip } from "./FaithTooltip";
import { GoldTooltip } from "./GoldTooltip";
import { HappinessStatus, HappinessTooltip } from "./HappinessTooltip";

interface TurnTimeEvent {
  turn: number;
  turnTime: number;
}

// The stats that drop down a breakdown while the mouse is over them.
type HoverStat = "gold" | "happiness" | "faith";

export class StatusBar extends ActorGroup {
  private static readonly HAPPINESS_COLORS: Record<HappinessStatus, string> = {
    content: "white",
    unhappy: "#f0c850",
    veryUnhappy: "#ff8a80"
  };

  private statusBarActor: Actor;

  private currentTurnText: string; //when currentTurnLabel may not be initalized yet
  private currentTurnLabel: Label;

  // "Science: [icon] +5", each stat one label, left to right.
  private scienceLabel: Label;
  private cultureLabel: Label;
  private goldLabel: Label;
  private happinessLabel: Label;
  private faithLabel: Label;
  private tradeLabel: Label;

  private hoveredStat: HoverStat | undefined;
  private tooltip: Tooltip | undefined;
  // Tooltips are built async - only the newest build may be shown.
  private tooltipBuild = 0;

  constructor() {
    super({
      x: 0,
      y: 0,
      z: 5,
      width: Game.getInstance().getWidth(),
      height: UITheme.STATUS_BAR_HEIGHT,
      cameraApplies: false
    });

    this.generateActors();
    // Wait until this async method is done

    NetworkEvents.on<TurnTimeEvent>({
      eventName: "newTurn",
      parentObject: this,
      callback: (data) => {
        this.updateCurrentTurnLabel(data);
      }
    });

    NetworkEvents.on<TurnTimeEvent>({
      eventName: "turnTimeDecrement",
      parentObject: this,
      callback: (data) => {
        this.updateCurrentTurnLabel(data);
      }
    });

    NetworkEvents.on({
      eventName: "updateTotalStats",
      parentObject: this,
      callback: () => {
        this.updateStatLabels();
        if (this.hoveredStat) this.showTooltip();
      }
    });

    this.on("mousemove", (options) => this.setHoveredStat(this.getStatAt(options.x, options.y)));
    this.on("mouseleave", () => this.setHoveredStat(undefined));
  }

  public onDestroyed(): void {
    super.onDestroyed();
    this.setHoveredStat(undefined);
  }

  // Anywhere on a stat's name, its icon or its numbers.
  private getStatAt(x: number, y: number): HoverStat | undefined {
    if (!this.happinessLabel || y < this.y || y > this.y + this.height) return undefined;

    const isOver = (label: Label) => x >= label.getX() && x <= label.getX() + label.getWidth();
    if (isOver(this.goldLabel)) return "gold";
    if (isOver(this.happinessLabel)) return "happiness";
    if (isOver(this.faithLabel)) return "faith";
    return undefined;
  }

  private setHoveredStat(stat: HoverStat | undefined) {
    if (stat === this.hoveredStat) return;

    this.hoveredStat = stat;
    if (stat) this.showTooltip();
    else this.hideTooltip();
  }

  // Builds the hovered stat's tooltip from its latest breakdown, then swaps it in for any tooltip already showing.
  private async showTooltip() {
    const build = ++this.tooltipBuild;
    const stat = this.hoveredStat;
    const tooltip = await this.createTooltip(stat);
    if (build !== this.tooltipBuild || stat !== this.hoveredStat) return;

    this.removeTooltip();
    this.tooltip = tooltip;
    Game.getInstance().getCurrentScene().addActor(tooltip);
  }

  private createTooltip(stat: HoverStat): Promise<Tooltip> {
    const clientPlayer = Game.getInstance().getCurrentSceneAs<InGameScene>().getClientPlayer();
    const y = this.y + this.height;

    if (stat === "gold") return GoldTooltip.create(this.goldLabel.getX(), y, clientPlayer.getGoldBreakdown());
    if (stat === "faith") return FaithTooltip.create(this.faithLabel.getX(), y, clientPlayer.getFaithBreakdown());
    return HappinessTooltip.create(this.happinessLabel.getX(), y, clientPlayer.getHappinessBreakdown());
  }

  private hideTooltip() {
    this.tooltipBuild++;
    this.removeTooltip();
  }

  private removeTooltip() {
    if (!this.tooltip) return;

    Game.getInstance().getCurrentScene().removeActor(this.tooltip);
    this.tooltip = undefined;
  }

  private updateCurrentTurnLabel(data: TurnTimeEvent) {
    const text = `Turns: ${data.turn} (${data.turnTime}s)`;

    if (!this.currentTurnLabel) {
      this.currentTurnText = text;
    } else {
      this.currentTurnLabel.setText(text);
      this.currentTurnLabel.conformSize().then(() => {
        this.currentTurnLabel.setPosition(Game.getInstance().getWidth() - this.currentTurnLabel.getWidth() - 1, 8);
      });
    }
  }

  private async generateActors() {
    this.statusBarActor = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.UI_STATUSBAR,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    });
    this.addActor(this.statusBarActor);

    this.scienceLabel = StatusBar.createStatLabel();
    this.cultureLabel = StatusBar.createStatLabel();
    this.goldLabel = StatusBar.createStatLabel();
    this.happinessLabel = StatusBar.createStatLabel();
    this.faithLabel = StatusBar.createStatLabel();
    this.tradeLabel = StatusBar.createStatLabel();
    this.getStatLabels().forEach((label) => this.addActor(label));

    // Current turn information
    this.currentTurnLabel = new Label({
      text: this.currentTurnText,
      font: UITheme.FONT,
      fontColor: "white"
    });
    await this.currentTurnLabel.conformSize();
    this.currentTurnLabel.setPosition(Game.getInstance().getWidth() - this.currentTurnLabel.getWidth() - 1, 8);
    this.addActor(this.currentTurnLabel);

    // Covers totals that already arrived (via the initial requestTotalStats) before
    // these labels finished being built.
    this.updateStatLabels();
  }

  private static createStatLabel(): Label {
    return new Label({ text: "", font: UITheme.FONT, fontColor: "white" });
  }

  private getStatLabels(): Label[] {
    return [
      this.scienceLabel,
      this.cultureLabel,
      this.goldLabel,
      this.happinessLabel,
      this.faithLabel,
      this.tradeLabel
    ];
  }

  // Re-flows every label after the changed one, since a wider/narrower number
  // shifts everything to its right in this left-to-right layout.
  private async updateStatLabels() {
    if (!this.scienceLabel) return;

    const clientPlayer = Game.getInstance().getCurrentSceneAs<InGameScene>().getClientPlayer();
    const rate = (stat: string) => Strings.convertToStatUnit(clientPlayer.getTotalStat(stat));
    const happiness = clientPlayer.getHappinessBreakdown();
    const happinessIcon = happiness.net < 0 ? "unhappy" : "happiness";

    this.scienceLabel.setText(`Science: !{science} ${rate("science")}`);
    this.cultureLabel.setText(`Culture: !{culture} ${rate("culture")}`);
    this.goldLabel.setText(`Gold: !{gold} ${clientPlayer.getAccumulatedStat("gold")} (${rate("gold")})`);
    this.happinessLabel.setText(`Happiness: !{${happinessIcon}} ${Strings.convertToStatUnit(happiness.net)}`);
    this.happinessLabel.setFontColor(StatusBar.HAPPINESS_COLORS[happiness.status]);
    this.faithLabel.setText(`Faith: !{faith} ${clientPlayer.getAccumulatedStat("faith")} (${rate("faith")})`);
    this.tradeLabel.setText("Trade: !{trade} 0/0");

    let x = this.x + 1;
    for (const label of this.getStatLabels()) {
      await label.conformSize();
      label.setPosition(x, 8);
      x += label.getWidth() + 10;
    }
  }
}
