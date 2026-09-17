import { GameImage } from "../Assets";
import { Game } from "../Game";
import { Actor } from "../scene/Actor";
import { ActorGroup } from "../scene/ActorGroup";
import { Numbers } from "../util/Numbers";
import { Vector } from "../util/Vector";
import { Label } from "./Label";
import { RectangleOptions } from "./Rectangle";

interface RowOptions extends RectangleOptions {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  color: string;
  text?: string;
  font?: string;
  fontColor?: string;
  textX?: number;
  textY?: number;
  maxWidth?: number;
  // Rows outside [viewportTop, viewportBottom] are scrolled out of view - hit-testing
  // must reject them even though their actual (translated) bounds still overlap the
  // cursor, or a row clipped by ListBox.draw() would still be clickable/hoverable.
  viewportTop?: number;
  viewportBottom?: number;
  // Suppresses hover/click while the scrollbar thumb is being dragged - without this,
  // releasing the drag over a row (rows span the full box width, under the thumb)
  // would fire that row's "clicked" handler.
  isInteractionBlocked?: () => boolean;
  // Rows span the full box width, so their bounds normally extend underneath the
  // scrollbar track drawn on top of them - without this, hovering the scrollbar
  // itself would still register as hovering whatever row sits behind it.
  isOverScrollbar?: (x: number, y: number) => boolean;
}

class Row extends ActorGroup {
  // Translucent overlays (not flat grays) so the ListBox's POPUP_BOX texture shows through the stripes.
  public static readonly stripeColorA = "rgba(0, 0, 0, 0.18)";
  public static readonly stripeColorB = "rgba(0, 0, 0, 0.0)";

  private label: Label;
  private viewportTop?: number;
  private viewportBottom?: number;
  private isInteractionBlocked?: () => boolean;
  private isOverScrollbar?: (x: number, y: number) => boolean;

  // TODO: Support image
  constructor(options: RowOptions) {
    super({
      x: options.x,
      y: options.y,
      z: options.z,
      width: options.width,
      height: options.height,
      cameraApplies: false
    });

    this.viewportTop = options.viewportTop;
    this.viewportBottom = options.viewportBottom;
    this.isInteractionBlocked = options.isInteractionBlocked;
    this.isOverScrollbar = options.isOverScrollbar;

    this.addActor(
      new Actor({
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        color: options.color
      })
    );

    const label = new Label({
      text: options.text,
      fontColor: options.fontColor,
      font: options.font,
      x: options.textX ?? this.x,
      y: options.textY ?? this.y,
      maxWidth: options.maxWidth
    });

    this.label = label;
    this.addActor(label);
  }

  // Overrides the plain rect check so a row scrolled outside the ListBox's visible
  // window - or any row at all, mid scrollbar-drag - stops registering hover/clicks,
  // even though its stored x/y/width/height still say the cursor is "inside" it.
  public insideActor(x: number, y: number): boolean {
    if (this.isInteractionBlocked?.()) return false;
    if (this.isOverScrollbar?.(x, y)) return false;
    if (this.viewportTop !== undefined && (y < this.viewportTop || y > this.viewportBottom)) return false;

    return super.insideActor(x, y);
  }

  // Shifts this row and everything in it (background, label, any actorIcons) by the
  // same amount, keeping them moving together as one unit - used for scrolling.
  public translate(dy: number) {
    this.y += dy;
    for (const actor of this.actors) {
      actor.setPosition(actor.getX(), actor.getY() + dy);
    }
  }

  public conformLabelSize(): Promise<void> {
    return this.label.conformSize();
  }

  public setLabelPosition(x: number, y: number) {
    this.label.setPosition(x, y);
  }

  public getWidth() {
    return this.width;
  }

  public getX() {
    return this.x;
  }

  public getY() {
    return this.y;
  }

  public getHeight() {
    return this.height;
  }

  public getLabel() {
    return this.label;
  }

  public onDestroyed(): void {
    super.onDestroyed();
    // Mirrors Button.onDestroyed() - a row destroyed while hovered (e.g. clicking
    // it tears down the whole ListBox) will never fire mouse_exit, so force the
    // cursor back or it stays stuck on "pointer".
    if (this.mouseInside) {
      Game.getInstance().setCursor("default");
    }
  }
}

export interface ListBoxOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  rowHeight?: number;
  textFont: string;
  fontColor: string;
}

interface ScrollRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class ListBox extends ActorGroup {
  private static readonly SCROLLBAR_WIDTH = 12;
  private static readonly SCROLLBAR_MARGIN = 2;
  private static readonly MIN_THUMB_HEIGHT = 30;
  private static readonly TRACK_COLOR = "rgba(0, 0, 0, 0.25)";
  private static readonly THUMB_COLOR = "rgba(255, 255, 255, 0.6)";

  private rowHeight: number;
  private rows: Row[];
  private textFont: string;
  private fontColor: string;

  // Rows are laid out once at their unscrolled position (see getNextRowPosition) and
  // then physically shifted by -scrollOffset - see setScrollOffset/Row.translate -
  // rather than the box applying a canvas transform, so each row's own stored bounds
  // (used for hover/click hit-testing) always match what's visually drawn.
  private scrollOffset = 0;
  private isDraggingScrollbar = false;
  private dragStartMouseY = 0;
  private dragStartScrollOffset = 0;
  // Game only gives "wheel" events a deltaY, not a cursor position (unlike
  // mousemove/mousedown), so hovering state has to be tracked ourselves to gate
  // wheel-scrolling to when the cursor is actually over this box.
  private lastMouseX = 0;
  private lastMouseY = 0;
  // Bound once so the same reference can be passed to both addEventListener and
  // removeEventListener - see the mousedown handler and stopDraggingScrollbar.
  private readonly onWindowMouseUp = () => this.stopDraggingScrollbar();

  constructor(options: ListBoxOptions) {
    // ListBox is screen-fixed UI - must be false from construction, not left to
    // whatever parent adds it later, or rows added via addRow()/addCategory() in
    // between inherit the wrong (default-true) value and their click/hover
    // detection ends up wrongly camera-transformed.
    super({ ...options, cameraApplies: false });

    this.rowHeight = options.rowHeight ?? 32;
    this.textFont = options.textFont;
    this.fontColor = options.fontColor;
    this.rows = [];

    this.addActor(
      new Actor({
        image: Game.getInstance().getImage(GameImage.POPUP_BOX),
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        nineSlice: true,
        cornerSize: 20
      })
    );

    this.on("mousemove", (moveOptions: { x: number; y: number }) => {
      this.lastMouseX = moveOptions.x;
      this.lastMouseY = moveOptions.y;

      if (this.isDraggingScrollbar) {
        this.dragScrollbarTo(moveOptions.y);
      }
    });

    this.on("mousedown", (downOptions: { x: number; y: number; button: number }) => {
      if (downOptions.button !== 0) return;

      const thumb = this.getScrollThumbBounds();
      if (thumb && this.pointInRect(downOptions.x, downOptions.y, thumb)) {
        this.isDraggingScrollbar = true;
        this.dragStartMouseY = downOptions.y;
        this.dragStartScrollOffset = this.scrollOffset;
        // A ListBox is often nested inside another window's ActorGroup (e.g.
        // CityDisplayInfo) rather than added straight to the Scene, and the release
        // that should end this drag is a raw "mouseup" - unlike mousemove/mousedown,
        // ActorGroup's relay never rebroadcasts a raw mouseup to nested actors (it
        // only derives "clicked" from it), so without this the drag would never see
        // its end and would keep tracking the cursor forever. Listening on window
        // directly sidesteps the actor event tree entirely and always fires.
        window.addEventListener("mouseup", this.onWindowMouseUp);
        return;
      }

      const track = this.getScrollTrackBounds();
      if (track && this.pointInRect(downOptions.x, downOptions.y, track)) {
        // Clicked the empty track above/below the thumb - page toward the click.
        const direction = downOptions.y < thumb.y ? -1 : 1;
        this.setScrollOffset(this.scrollOffset + direction * this.height);
      }
    });

    this.on("mouseup", () => {
      this.stopDraggingScrollbar();
    });

    this.on("mouseleave", () => {
      this.stopDraggingScrollbar();
    });

    this.on("wheel", (wheelOptions: { deltaY: number }) => {
      if (!this.insideActor(this.lastMouseX, this.lastMouseY)) return;

      this.setScrollOffset(this.scrollOffset + Math.sign(wheelOptions.deltaY) * this.rowHeight);
    });
  }

  public onDestroyed(): void {
    super.onDestroyed();
    this.stopDraggingScrollbar();
  }

  public addCategory(name: string) {
    // Add row with category name & hide/view option button on left side.

    const row = new Row({
      x: this.getNextRowPosition().x,
      y: this.getNextRowPosition().y,
      z: this.z,
      width: this.width,
      height: 25, //FIXME: Should be dependent on text height
      color: this.rows.length % 2 == 0 ? Row.stripeColorA : Row.stripeColorB,
      font: this.textFont,
      fontColor: this.fontColor,
      text: name,
      viewportTop: this.y,
      viewportBottom: this.y + this.height,
      isInteractionBlocked: () => this.isDraggingScrollbar,
      isOverScrollbar: (x, y) => this.isPointOverScrollbar(x, y)
    });

    row.conformLabelSize().then(() => {
      row.setLabelPosition(
        row.getLabel().getX() + row.getWidth() / 2 - row.getLabel().getWidth() / 2,
        row.getLabel().getY() + row.getHeight() / 2 - row.getLabel().getHeight() / 2
      );
    });

    if (this.scrollOffset !== 0) {
      row.translate(-this.scrollOffset);
    }

    this.rows.push(row);
    this.addActor(row);
  }

  public addRow(options: {
    category?: string;
    text: string;
    actorIcons?: Actor[];
    rowHeight?: number;
    color?: string;
    textX?: number;
    textY?: number;
    centerTextY?: boolean;
    maxWidth?: number;
  }) {
    const row = new Row({
      x: this.getNextRowPosition().x,
      y: this.getNextRowPosition().y,
      z: this.z,
      text: options.text,
      width: this.width,
      height: options.rowHeight ?? this.rowHeight,
      color: options.color ?? (this.rows.length % 2 == 0 ? Row.stripeColorA : Row.stripeColorB),
      font: this.textFont,
      fontColor: this.fontColor,
      textX: options.textX,
      textY: options.textY,
      maxWidth: options.maxWidth,
      viewportTop: this.y,
      viewportBottom: this.y + this.height,
      isInteractionBlocked: () => this.isDraggingScrollbar,
      isOverScrollbar: (x, y) => this.isPointOverScrollbar(x, y)
    });

    for (const actionIcon of options.actorIcons ?? []) {
      row.addActor(actionIcon);
    }

    if (options.centerTextY) {
      row.getLabel().setText(options.text, true);
      row.conformLabelSize().then(() => {
        row.setLabelPosition(
          row.getLabel().getX(),
          row.getLabel().getY() + row.getHeight() / 2 - row.getLabel().getHeight() / 2
        );
      });
    }

    if (this.scrollOffset !== 0) {
      row.translate(-this.scrollOffset);
    }

    this.rows.push(row);
    this.addActor(row);

    return row;
  }

  public getNextRowPosition(): Vector {
    let nextY = this.y;
    for (const row of this.rows) {
      nextY += row.getHeight();
    }

    return new Vector(this.x, nextY);
  }

  public clearRows() {
    for (const row of this.rows) {
      this.removeActor(row);
    }

    this.rows = [];
    this.scrollOffset = 0;
  }

  public getRows(): Row[] {
    return this.rows;
  }

  // Rows scrolled above/below the box would otherwise still be drawn (and clickable -
  // see Row.insideActor) past its edges, so everything drawn here (background,
  // stripes, rows) is clipped to the box's own rect first. The scrollbar itself is
  // drawn afterward, unclipped, since it always sits within that same rect anyway.
  public draw(canvasContext: CanvasRenderingContext2D) {
    canvasContext.save();
    canvasContext.beginPath();
    canvasContext.rect(this.x, this.y, this.width, this.height);
    canvasContext.clip();

    super.draw(canvasContext);

    canvasContext.restore();

    this.drawScrollbar(canvasContext);
  }

  private drawScrollbar(canvasContext: CanvasRenderingContext2D) {
    const track = this.getScrollTrackBounds();
    const thumb = this.getScrollThumbBounds();
    if (!track || !thumb) return;

    Game.getInstance().drawRect({ ...track, color: ListBox.TRACK_COLOR, fill: true, canvasContext });
    Game.getInstance().drawRect({ ...thumb, color: ListBox.THUMB_COLOR, fill: true, canvasContext });
  }

  private getContentHeight(): number {
    return this.getNextRowPosition().y - this.y;
  }

  private getMaxScroll(): number {
    return Math.max(0, this.getContentHeight() - this.height);
  }

  // undefined (rather than a zero-size rect) when nothing overflows, so callers can
  // use it directly as "is there a scrollbar at all" without a separate check.
  private getScrollTrackBounds(): ScrollRect | undefined {
    if (this.getMaxScroll() <= 0) return undefined;

    return {
      x: this.x + this.width - ListBox.SCROLLBAR_WIDTH - ListBox.SCROLLBAR_MARGIN,
      y: this.y + ListBox.SCROLLBAR_MARGIN,
      width: ListBox.SCROLLBAR_WIDTH,
      height: this.height - ListBox.SCROLLBAR_MARGIN * 2
    };
  }

  private getScrollThumbBounds(): ScrollRect | undefined {
    const track = this.getScrollTrackBounds();
    if (!track) return undefined;

    const thumbHeight = Math.max(ListBox.MIN_THUMB_HEIGHT, track.height * (this.height / this.getContentHeight()));
    const thumbY = track.y + (this.scrollOffset / this.getMaxScroll()) * (track.height - thumbHeight);

    return { x: track.x, y: thumbY, width: track.width, height: thumbHeight };
  }

  private pointInRect(x: number, y: number, rect: ScrollRect): boolean {
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
  }

  // Checked against the full track column (not just the thumb) so hovering any part
  // of the scrollbar - not only where the thumb currently sits - blocks the row
  // drawn behind it from reacting, matching what's actually drawn on top.
  private isPointOverScrollbar(x: number, y: number): boolean {
    const track = this.getScrollTrackBounds();
    return !!track && this.pointInRect(x, y, track);
  }

  private dragScrollbarTo(mouseY: number) {
    const track = this.getScrollTrackBounds();
    const thumb = this.getScrollThumbBounds();
    if (!track || !thumb) return;

    const draggableRange = track.height - thumb.height;
    if (draggableRange <= 0) return;

    const deltaScroll = ((mouseY - this.dragStartMouseY) / draggableRange) * this.getMaxScroll();
    this.setScrollOffset(this.dragStartScrollOffset + deltaScroll);
  }

  private setScrollOffset(offset: number) {
    const clamped = Numbers.clamp(offset, 0, this.getMaxScroll());
    const delta = clamped - this.scrollOffset;
    if (delta === 0) return;

    this.scrollOffset = clamped;
    for (const row of this.rows) {
      row.translate(-delta);
    }
  }

  private stopDraggingScrollbar() {
    if (!this.isDraggingScrollbar) return;

    this.isDraggingScrollbar = false;
    window.removeEventListener("mouseup", this.onWindowMouseUp);
  }
}
