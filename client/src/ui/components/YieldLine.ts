import { GameImage } from "../../Assets";
import { Game } from "../../Game";
import { Actor } from "../../scene/Actor";
import { UITheme } from "../UITheme";
import { Label } from "./Label";
import { Tooltip } from "./Tooltip";

/**
 * One line of yields drawn the way tooltips draw them - "+1 [faith] +2 [culture]", each icon the status
 * bar's size - optionally followed by words ("from Shrines"). For lists and windows that lay out their
 * own rows rather than using a Tooltip.
 */
export class YieldLine {
  // From the last icon to the words after it. Negative: the icon's sprite is mostly empty around the
  // edges, so the words tuck in the way the status bar's numbers do (8px into the icon there).
  private static readonly TEXT_GAP = -6;
  // Between yields, as in Tooltip.
  private static readonly YIELD_GAP = 2;

  /** The line's actors, with the top of its text at (x, y), and how wide it came out. */
  public static create(options: {
    stats: Record<string, number>;
    x: number;
    y: number;
    color: string;
    text?: string;
  }): { actors: Actor[]; width: number } {
    const yields = Tooltip.getYields([options.stats]);
    const iconY = options.y - UITheme.centerTextY(UITheme.ICON_SIZE);
    const actors: Actor[] = [];
    let lineX = options.x;

    yields.forEach((entry, index) => {
      if (index > 0) lineX += YieldLine.YIELD_GAP;
      actors.push(YieldLine.createText(entry.text, lineX, options.y, options.color));
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

    if (options.text) {
      if (yields.length > 0) lineX += YieldLine.TEXT_GAP;
      actors.push(YieldLine.createText(options.text, lineX, options.y, options.color));
      lineX += Game.getInstance().measureText(options.text, UITheme.FONT).width;
    }

    return { actors, width: lineX - options.x };
  }

  private static createText(text: string, x: number, y: number, color: string): Label {
    return new Label({ text, x, y, font: UITheme.FONT, fontColor: color, cameraApplies: false });
  }
}
