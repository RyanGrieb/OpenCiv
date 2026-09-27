import { ClientSettings } from "../../ClientSettings";
import { GameImage } from "../../Assets";
import { Game } from "../../Game";
import { Actor } from "../../scene/Actor";
import { ActorGroup } from "../../scene/ActorGroup";
import { Strings } from "../../util/Strings";
import { Label } from "../components/Label";
import { UITheme } from "../UITheme";

// One line of the server's gold breakdown, e.g. { source: "Rome", amount: 4 }.
export interface GoldEntry {
  source: string;
  amount: number;
}

// Sent by the server with every updateTotalStats. The server works it out; this only shows it.
export interface GoldBreakdown {
  income: GoldEntry[];
  expenses: GoldEntry[];
  net: number;
}

interface TooltipLine {
  text: string;
  color: string;
  indent?: boolean;
}

/**
 * The box that drops down from the status bar's gold while the mouse is over it: where the gold
 * comes from each turn, what it's spent on, and what's left.
 */
export class GoldTooltip extends ActorGroup {
  private static readonly PADDING = 12;
  private static readonly INDENT = 20;
  private static readonly LINE_GAP = 4;
  private static readonly INCOME_COLOR = "#8ee07a";
  private static readonly EXPENSE_COLOR = "#ff8a80";

  private constructor(x: number, y: number) {
    super({ x, y, z: 10, width: 0, height: 0, cameraApplies: false });
    this.setTransparency(ClientSettings.get("HUD_TRANSPARENCY"));
  }

  /** Builds the tooltip with its top-left corner at (x, y). Labels measure themselves, hence async. */
  public static async create(x: number, y: number, breakdown: GoldBreakdown): Promise<GoldTooltip> {
    const tooltip = new GoldTooltip(x, y);
    await tooltip.layout(GoldTooltip.getLines(breakdown));
    return tooltip;
  }

  private static getLines(breakdown: GoldBreakdown): TooltipLine[] {
    const lines: TooltipLine[] = [{ text: "Income", color: "white" }];

    if (breakdown.income.length === 0) lines.push({ text: "None", color: "gray", indent: true });
    breakdown.income.forEach((entry) =>
      lines.push({ text: `+${entry.amount} from ${entry.source}`, color: GoldTooltip.INCOME_COLOR, indent: true })
    );

    lines.push({ text: "Expenses", color: "white" });
    if (breakdown.expenses.length === 0) lines.push({ text: "None", color: "gray", indent: true });
    breakdown.expenses.forEach((entry) =>
      lines.push({ text: `-${entry.amount} ${entry.source}`, color: GoldTooltip.EXPENSE_COLOR, indent: true })
    );

    lines.push({ text: `${Strings.convertToStatUnit(breakdown.net)} gold per turn`, color: "white" });
    return lines;
  }

  private async layout(lines: TooltipLine[]) {
    const padding = GoldTooltip.PADDING;
    const labels = lines.map(
      (line) => new Label({ text: line.text, font: UITheme.FONT, fontColor: line.color, cameraApplies: false })
    );
    await Promise.all(labels.map((label) => label.conformSize()));

    let lineY = this.y + padding;
    let width = 0;
    labels.forEach((label, index) => {
      const indent = lines[index].indent ? GoldTooltip.INDENT : 0;
      label.setPosition(this.x + padding + indent, lineY);
      lineY += label.getHeight() + GoldTooltip.LINE_GAP;
      width = Math.max(width, indent + label.getWidth());
    });

    this.width = width + padding * 2;
    this.height = lineY - GoldTooltip.LINE_GAP + padding - this.y;

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
    labels.forEach((label) => this.addActor(label));
  }
}
