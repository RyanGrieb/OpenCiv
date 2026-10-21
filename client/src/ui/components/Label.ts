import { Actor } from "../../scene/Actor";
import { Game } from "../../Game";
import { GameImage, SpriteRegion, resolveSpriteRegion } from "../../Assets";
import { UITheme } from "../UITheme";

export interface LabelOptions {
  text: string;
  x?: number;
  y?: number;
  z?: number;
  font?: string;
  fontColor?: string;
  lineWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  cameraApplies?: boolean;
  transparency?: number;
  onClick?: Function;
  maxWidth?: number;
}

// Words or one icon of a label with icons, placed from the label's top left.
interface LabelPiece {
  x: number;
  y: number;
  text?: string;
  icon?: Actor;
}

interface IconLayout {
  key: string;
  pieces: LabelPiece[];
  width: number;
  height: number;
  lines: number;
}

// One step of laying out a label with icons: a word, the spaces between words, or an icon.
interface LabelToken {
  text?: string;
  icon?: SpriteRegion;
  // Comes right after an icon with spaces between them, so it tucks in against the icon.
  afterIcon?: boolean;
}

/**
 * Text on screen. `!{name}` in the text draws an icon there: "+1 !{faith} from Desert tiles". The name is
 * a sprite's, without its ICON_ prefix (faith = ICON_FAITH) or in full (UNIT_WARRIOR), or a stat's
 * (happiness, city_health). Icons are drawn the status bar's size and centered on the text, and don't
 * make the label taller. Spaces before an icon are left out, since the sprite's empty edges already
 * leave a gap; words after one tuck into it, the way the status bar's numbers do.
 */
export class Label extends Actor {
  private static readonly ICON_PATTERN = /!\{(\w+)\}/;
  // Stats whose icon isn't named after them.
  private static readonly ICON_ALIASES: Record<string, string> = { happiness: "MORALE", city_health: "HEALTH" };
  // From an icon to the words after it, at UITheme.FONT. Negative: into the sprite's empty right edge.
  private static readonly AFTER_ICON_GAP = -6;
  // How much of an icon's height the lines of a wrapped label with icons overlap, at UITheme.FONT.
  private static readonly ICON_LINE_OVERLAP = 12;

  private text: string;
  private font: string;
  private fontColor: string;
  private lineWidth: number; // For drawing bold text
  private shadowColor: string;
  private shadowBlur: number;
  private onClickCallback: Function;
  private maxWidth: number;
  private wrappedText: string;
  private unwrappedWordHeight: number;
  private oldText: string; // When were waiting to conform label size.
  private iconLayout: IconLayout | undefined;

  constructor(options: LabelOptions) {
    super({
      x: options.x,
      y: options.y,
      z: options.z,
      cameraApplies: options.cameraApplies || false,
      width: 0,
      height: 0,
      transparency: options.transparency
    });

    this.text = options.text;
    this.font = options.font ?? "24px sans-serif";
    this.fontColor = options.fontColor;
    this.lineWidth = options.lineWidth ?? 0;
    this.shadowColor = options.shadowColor ?? this.color;
    this.shadowBlur = options.shadowBlur ?? 0;
    this.maxWidth = options.maxWidth;

    if (options.onClick) {
      this.setOnClick(options.onClick);
    }
  }

  public static hasIcons(text: string): boolean {
    return !!text && Label.ICON_PATTERN.test(text);
  }

  /** How big `text` draws in `font`, counting its icons, and on how many lines when wrapped to `maxWidth`. */
  public static measure(
    text: string,
    font: string = UITheme.FONT,
    maxWidth?: number
  ): { width: number; height: number; lines: number } {
    if (!Label.hasIcons(text)) return { ...Game.getInstance().measureText(text, font), lines: 1 };

    const { width, height, lines } = Label.layoutIcons(text, font, maxWidth);
    return { width, height, lines };
  }

  /** How far apart the lines of a label with icons are, wrapped or with line breaks. */
  public static iconLineHeight(font: string = UITheme.FONT): number {
    const scale = Label.getFontSize(font) / UITheme.FONT_SIZE;
    return Math.round(UITheme.ICON_SIZE * scale) - Label.ICON_LINE_OVERLAP * scale;
  }

  /** The text with its icons left out, for searching or comparing it. */
  public static stripIcons(text: string): string {
    return text.replace(new RegExp(Label.ICON_PATTERN, "g"), "").replace(/ {2,}/g, " ").trim();
  }

  private static resolveIcon(name: string): SpriteRegion {
    const key = Label.ICON_ALIASES[name] ?? name.toUpperCase();
    return resolveSpriteRegion(`ICON_${key}`) ?? resolveSpriteRegion(key) ?? SpriteRegion.ICON_UNKNOWN;
  }

  private static getFontSize(font: string): number {
    const match = /(\d+(\.\d+)?)px/.exec(font);
    return match ? Number(match[1]) : UITheme.FONT_SIZE;
  }

  // Words, spaces and icons in order, without the spaces that touch an icon.
  private static tokenize(text: string): LabelToken[] {
    const parts = text.split(new RegExp(Label.ICON_PATTERN, "g"));
    const tokens: LabelToken[] = [];
    parts.forEach((part, index) => {
      // split() puts each icon's name at the odd indexes.
      if (index % 2 === 1) {
        tokens.push({ icon: Label.resolveIcon(part) });
        return;
      }
      part
        .split(/( +)/)
        .filter((word) => word.length > 0)
        .forEach((word) => tokens.push({ text: word }));
    });

    return tokens.filter((token, index) => {
      if (!Label.isSpace(token)) return true;
      if (tokens[index - 1]?.icon !== undefined) {
        if (tokens[index + 1]) tokens[index + 1].afterIcon = true;
        return false;
      }
      return tokens[index + 1]?.icon === undefined;
    });
  }

  private static isSpace(token: LabelToken): boolean {
    return token.text !== undefined && token.text.trim() === "";
  }

  // Groups the tokens that wrapping keeps on one line: a number with its icon, an icon with the words
  // tucked in after it. A line can break at a space, or between an icon and a number right after it.
  private static chunk(tokens: LabelToken[]): LabelToken[][] {
    const chunks: LabelToken[][] = [];
    tokens.forEach((token, index) => {
      const previous = tokens[index - 1];
      const startsChunk =
        !previous ||
        Label.isSpace(token) ||
        Label.isSpace(previous) ||
        (previous.icon !== undefined && !token.afterIcon);
      if (startsChunk) chunks.push([token]);
      else chunks[chunks.length - 1].push(token);
    });
    return chunks;
  }

  // Where each word and icon goes, breaking onto a new line before a word that won't fit `maxWidth`.
  private static layoutIcons(text: string, font: string, maxWidth?: number): IconLayout {
    const fontSize = Label.getFontSize(font);
    const scale = fontSize / UITheme.FONT_SIZE;
    const iconSize = Math.round(UITheme.ICON_SIZE * scale);
    const iconOffsetY = -(iconSize - fontSize) / 2;
    const textHeight = Game.getInstance().measureText(Label.stripIcons(text), font).height || fontSize;
    const lineStep = Label.iconLineHeight(font);
    const pieces: LabelPiece[] = [];
    let line = 0;
    let x = 0;
    let width = 0;

    const gapBefore = (token: LabelToken) => (token.afterIcon ? Label.AFTER_ICON_GAP * scale : 0);
    const widthOf = (token: LabelToken) =>
      token.icon !== undefined ? iconSize : Game.getInstance().measureText(token.text, font).width;

    for (const hardLine of text.split("\n")) {
      for (const chunk of Label.chunk(Label.tokenize(hardLine))) {
        const isSpace = Label.isSpace(chunk[0]);
        if (isSpace && x === 0) continue;

        const chunkWidth = chunk.reduce((total, token) => total + gapBefore(token) + widthOf(token), 0);
        if (maxWidth && x > 0 && !isSpace && x + chunkWidth > maxWidth) {
          line++;
          x = 0;
        }

        for (const token of chunk) {
          const y = line * lineStep;
          x += gapBefore(token);

          const last = pieces[pieces.length - 1];
          if (token.icon !== undefined) {
            pieces.push({ x, y: y + iconOffsetY, icon: Label.createIcon(token.icon, iconSize) });
          } else if (last?.text !== undefined && last.y === y && !token.afterIcon) {
            last.text += token.text;
          } else {
            pieces.push({ x, y, text: token.text });
          }
          x += widthOf(token);
          width = Math.max(width, x);
        }
      }
      line++;
      x = 0;
    }

    return {
      key: Label.layoutKey(text, font, maxWidth),
      pieces,
      width: maxWidth ?? width,
      height: textHeight + lineStep * (line - 1),
      lines: line
    };
  }

  private static layoutKey(text: string, font: string, maxWidth?: number): string {
    return `${text}|${font}|${maxWidth}`;
  }

  private static createIcon(spriteRegion: SpriteRegion, size: number): Actor {
    return new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion,
      x: 0,
      y: 0,
      width: size,
      height: size
    });
  }

  public setOnClick(onClickCallback: Function) {
    this.onClickCallback = onClickCallback;
    if (this.onClickCallback) {
      this.on("clicked", () => {
        this.onClickCallback();
      });

      // Change cursor to pointer when mouse is over label
      this.on("mousemove", () => {
        if (this.mouseInside) {
          if (!Game.getInstance().getCurrentScene().hasSystemMenuOpen()) {
            Game.getInstance().setCursor("pointer");
          } else {
            Game.getInstance().setCursor("default");
          }
        }
      });

      // Redundant:
      //this.on("mouse_enter", () => {
      //Game.getInstance().setCursor("pointer");
      //});

      this.on("mouse_exit", () => {
        Game.getInstance().setCursor("default");
      });
    }
  }

  public draw(canvasContext: CanvasRenderingContext2D) {
    const shownText = this.oldText ?? this.text;
    if (Label.hasIcons(shownText)) {
      this.drawWithIcons(shownText, canvasContext);
      return;
    }

    let text = this.text;

    if (this.wrappedText) {
      text = this.wrappedText;
    }

    if (this.oldText) {
      text = this.oldText;
    }

    Game.getInstance().drawText(
      {
        text: text,
        x: this.x,
        y: this.y,
        height: this.wrappedText ? this.unwrappedWordHeight : this.height,
        color: this.fontColor,
        font: this.font,
        shadowColor: this.shadowColor,
        shadowBlur: this.shadowBlur,
        lineWidth: this.lineWidth,
        applyCamera: this.cameraApplies,
        transparency: this.transparency,
        maxWidth: this.maxWidth
      },
      canvasContext
    );
  }

  /**
   * Updates the width and height of the label to conform to whatever the text is
   */
  public async conformSize() {
    if (Label.hasIcons(this.text)) {
      this.iconLayout = Label.layoutIcons(this.text, this.font, this.maxWidth);
      this.width = this.iconLayout.width;
      this.height = this.iconLayout.height;
    } else if (this.maxWidth) {
      const [wrappedText, wrappedHeight, unwrappedWordHeight] = await Game.getInstance().getWrappedText(
        this.text,
        this.font,
        this.maxWidth
      );
      this.wrappedText = wrappedText;
      this.width = this.maxWidth;
      this.height = wrappedHeight;
      this.unwrappedWordHeight = unwrappedWordHeight;
    } else {
      const { width: textWidth, height: textHeight } = Game.getInstance().measureText(this.text, this.font);
      this.width = textWidth;
      this.height = textHeight;
    }

    this.oldText = undefined;
  }

  public getDrawState() {
    return [this.oldText ?? this.wrappedText ?? this.text, this.font, this.fontColor, this.lineWidth].join("|");
  }

  public setText(text: string, waitForConformSize: boolean = false) {
    if (waitForConformSize) {
      this.oldText = this.text;
    }

    this.text = text;
  }

  public setFontColor(fontColor: string) {
    this.fontColor = fontColor;
  }

  // Whether conformSize() broke the text onto more than one line to fit maxWidth.
  public isWrapped(): boolean {
    if (Label.hasIcons(this.text)) return this.getIconLayout(this.text).lines > 1;
    return !!this.wrappedText?.includes("\n");
  }

  public getText(): string {
    return this.text;
  }

  public getFont() {
    return this.font;
  }

  private getIconLayout(text: string): IconLayout {
    if (this.iconLayout?.key !== Label.layoutKey(text, this.font, this.maxWidth)) {
      this.iconLayout = Label.layoutIcons(text, this.font, this.maxWidth);
    }
    return this.iconLayout;
  }

  private drawWithIcons(text: string, canvasContext: CanvasRenderingContext2D) {
    for (const piece of this.getIconLayout(text).pieces) {
      if (piece.icon) {
        piece.icon.setPosition(this.x + piece.x, this.y + piece.y);
        piece.icon.setTransparency(this.transparency);
        piece.icon.setCameraApplies(this.cameraApplies);
        Game.getInstance().drawImageFromActor(piece.icon, canvasContext);
        continue;
      }

      Game.getInstance().drawText(
        {
          text: piece.text,
          x: this.x + piece.x,
          y: this.y + piece.y,
          color: this.fontColor,
          font: this.font,
          shadowColor: this.shadowColor,
          shadowBlur: this.shadowBlur,
          lineWidth: this.lineWidth,
          applyCamera: this.cameraApplies,
          transparency: this.transparency
        },
        canvasContext
      );
    }
  }
}
