import { ClientSettings } from "../../ClientSettings";
import { GameImage, SpriteRegion } from "../../Assets";
import { Game } from "../../Game";
import { Actor } from "../../scene/Actor";
import { ActorGroup } from "../../scene/ActorGroup";
import { Label } from "./Label";
import { UITheme } from "../UITheme";

// A number drawn with its stat icon after a line's text, e.g. "+2" and the food icon.
export interface TooltipYield {
  text: string;
  icon: SpriteRegion;
}

export interface TooltipLine {
  text: string;
  color: string;
  indent?: boolean;
  yields?: TooltipYield[];
}

/**
 * A box of text lines on the HUD's popup background, like the one that drops down from the status
 * bar's gold. Subclasses pick the lines; this lays them out, keeping the box on screen.
 */
export class Tooltip extends ActorGroup {
  private static readonly PADDING = 12;
  private static readonly INDENT = 20;
  private static readonly LINE_GAP = 4;
  // Stat icons fill the middle of their 32x32 sprite, so this draws them about the size of the text.
  private static readonly YIELD_ICON_SIZE = 32;
  private static readonly YIELD_GAP = 12;

  protected constructor(x: number, y: number, z = 10) {
    super({ x, y, z, width: 0, height: 0, cameraApplies: false });
    this.setTransparency(ClientSettings.get("HUD_TRANSPARENCY"));
  }

  /**
   * Labels measure themselves, hence async. Nudges the box up or left if it would run off screen.
   * `corner` is which corner of the box sits at the (x, y) it was made with.
   */
  protected async layout(lines: TooltipLine[], corner: "topLeft" | "bottomRight" = "topLeft") {
    const padding = Tooltip.PADDING;
    const labels = lines.map(
      (line) => new Label({ text: line.text, font: UITheme.FONT, fontColor: line.color, cameraApplies: false })
    );
    await Promise.all(labels.map((label) => label.conformSize()));

    const yieldLabels = lines.map((line) =>
      (line.yields ?? []).map(
        (entry) => new Label({ text: entry.text, font: UITheme.FONT, fontColor: line.color, cameraApplies: false })
      )
    );
    await Promise.all(yieldLabels.flat().map((label) => label.conformSize()));

    const indentOf = (index: number) => (lines[index].indent ? Tooltip.INDENT : 0);
    const yieldsWidthOf = (index: number) =>
      yieldLabels[index].reduce(
        (total, label) => total + Tooltip.YIELD_GAP + label.getWidth() + Tooltip.YIELD_ICON_SIZE,
        0
      );
    const textWidth = Math.max(
      0,
      ...labels.map((label, index) => indentOf(index) + label.getWidth() + yieldsWidthOf(index))
    );
    const textHeight = labels.reduce((total, label) => total + label.getHeight() + Tooltip.LINE_GAP, -Tooltip.LINE_GAP);
    this.width = textWidth + padding * 2;
    this.height = textHeight + padding * 2;
    if (corner === "bottomRight") {
      this.x -= this.width;
      this.y -= this.height;
    }
    this.x = Math.max(0, Math.min(this.x, Game.getInstance().getWidth() - this.width));
    this.y = Math.max(0, Math.min(this.y, Game.getInstance().getHeight() - this.height));

    const icons: Actor[] = [];
    let lineY = this.y + padding;
    labels.forEach((label, index) => {
      label.setPosition(this.x + padding + indentOf(index), lineY);
      icons.push(...this.placeYields(lines[index].yields ?? [], yieldLabels[index], label));
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
    [...labels, ...yieldLabels.flat(), ...icons].forEach((actor) => this.addActor(actor));
  }

  // Lines up each yield's number and icon after the line's text, returning the icons.
  private placeYields(yields: TooltipYield[], valueLabels: Label[], lineLabel: Label): Actor[] {
    let x = lineLabel.getX() + lineLabel.getWidth();
    const iconY = lineLabel.getY() + (lineLabel.getHeight() - Tooltip.YIELD_ICON_SIZE) / 2;

    return yields.map((entry, index) => {
      x += Tooltip.YIELD_GAP;
      valueLabels[index].setPosition(x, lineLabel.getY());
      x += valueLabels[index].getWidth();

      const icon = new Actor({
        image: Game.getInstance().getImage(GameImage.SPRITESHEET),
        spriteRegion: entry.icon,
        x,
        y: iconY,
        width: Tooltip.YIELD_ICON_SIZE,
        height: Tooltip.YIELD_ICON_SIZE,
        cameraApplies: false
      });
      x += Tooltip.YIELD_ICON_SIZE;
      return icon;
    });
  }
}
