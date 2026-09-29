import { ClientSettings } from "../../ClientSettings";
import { GameImage } from "../../Assets";
import { Game } from "../../Game";
import { Actor } from "../../scene/Actor";
import { ActorGroup } from "../../scene/ActorGroup";
import { Label } from "./Label";
import { UITheme } from "../UITheme";

export interface TooltipLine {
  text: string;
  color: string;
  indent?: boolean;
}

/**
 * A box of text lines on the HUD's popup background, like the one that drops down from the status
 * bar's gold. Subclasses pick the lines; this lays them out, keeping the box on screen.
 */
export class Tooltip extends ActorGroup {
  private static readonly PADDING = 12;
  private static readonly INDENT = 20;
  private static readonly LINE_GAP = 4;

  protected constructor(x: number, y: number, z = 10) {
    super({ x, y, z, width: 0, height: 0, cameraApplies: false });
    this.setTransparency(ClientSettings.get("HUD_TRANSPARENCY"));
  }

  /** Labels measure themselves, hence async. Nudges the box up or left if it would run off screen. */
  protected async layout(lines: TooltipLine[]) {
    const padding = Tooltip.PADDING;
    const labels = lines.map(
      (line) => new Label({ text: line.text, font: UITheme.FONT, fontColor: line.color, cameraApplies: false })
    );
    await Promise.all(labels.map((label) => label.conformSize()));

    const indentOf = (index: number) => (lines[index].indent ? Tooltip.INDENT : 0);
    const textWidth = Math.max(0, ...labels.map((label, index) => indentOf(index) + label.getWidth()));
    const textHeight = labels.reduce((total, label) => total + label.getHeight() + Tooltip.LINE_GAP, -Tooltip.LINE_GAP);
    this.width = textWidth + padding * 2;
    this.height = textHeight + padding * 2;
    this.x = Math.max(0, Math.min(this.x, Game.getInstance().getWidth() - this.width));
    this.y = Math.max(0, Math.min(this.y, Game.getInstance().getHeight() - this.height));

    let lineY = this.y + padding;
    labels.forEach((label, index) => {
      label.setPosition(this.x + padding + indentOf(index), lineY);
      lineY += label.getHeight() + Tooltip.LINE_GAP;
    });

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
