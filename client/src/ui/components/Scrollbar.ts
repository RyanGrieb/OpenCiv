import { Game } from "../../Game";
import { Numbers } from "../../util/Numbers";

export interface ScrollbarOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  // Called with the new scroll value whenever the thumb is dragged or the track clicked.
  onScroll: (value: number) => void;
}

interface ScrollRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// A vertical scrollbar in whatever units its owner scrolls by (pixels, rows, ...). It is a plain
// helper rather than an Actor: its owner forwards mousedown/mousemove and calls draw(), so it
// never gets the same event twice from ActorGroup's relays when the owner is itself nested.
export class Scrollbar {
  private static readonly MIN_THUMB_HEIGHT = 30;
  private static readonly TRACK_COLOR = "rgba(0, 0, 0, 0.25)";
  private static readonly THUMB_COLOR = "rgba(255, 255, 255, 0.6)";

  private track: ScrollRect;
  private onScroll: (value: number) => void;
  private value = 0;
  private maxValue = 0;
  // How many units fit on screen at once - sizes the thumb and the step of a track click.
  private visibleAmount = 1;
  private isDragging = false;
  private dragStartMouseY = 0;
  private dragStartValue = 0;
  // Bound once so the same reference reaches both addEventListener and removeEventListener.
  private readonly onWindowMouseUp = () => this.stopDragging();

  constructor(options: ScrollbarOptions) {
    this.track = { x: options.x, y: options.y, width: options.width, height: options.height };
    this.onScroll = options.onScroll;
  }

  private static pointInRect(x: number, y: number, rect: ScrollRect): boolean {
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
  }

  public setRange(maxValue: number, visibleAmount: number) {
    this.maxValue = Math.max(0, maxValue);
    this.visibleAmount = Math.max(1, visibleAmount);
    this.value = Numbers.clamp(this.value, 0, this.maxValue);
  }

  public setValue(value: number) {
    this.value = Numbers.clamp(value, 0, this.maxValue);
  }

  // Only shown, and only takes input, when there is something to scroll.
  public isVisible(): boolean {
    return this.maxValue > 0;
  }

  public containsPoint(x: number, y: number): boolean {
    return this.isVisible() && Scrollbar.pointInRect(x, y, this.track);
  }

  public draw(canvasContext: CanvasRenderingContext2D) {
    if (!this.isVisible()) return;

    Game.getInstance().drawRect({ ...this.track, color: Scrollbar.TRACK_COLOR, fill: true, canvasContext });
    Game.getInstance().drawRect({ ...this.getThumb(), color: Scrollbar.THUMB_COLOR, fill: true, canvasContext });
  }

  // Returns true when the press landed on the scrollbar, so the owner can ignore it otherwise.
  public handleMouseDown(options: { x: number; y: number; button: number }): boolean {
    if (options.button !== 0 || !this.containsPoint(options.x, options.y)) return false;

    const thumb = this.getThumb();
    if (Scrollbar.pointInRect(options.x, options.y, thumb)) {
      this.isDragging = true;
      this.dragStartMouseY = options.y;
      this.dragStartValue = this.value;
      // A raw mouseup is never relayed to nested actors, so listen on window for the drag's end.
      window.addEventListener("mouseup", this.onWindowMouseUp);
      return true;
    }

    // Clicked the empty track above/below the thumb - page toward the click.
    const direction = options.y < thumb.y ? -1 : 1;
    this.onScroll(Numbers.clamp(this.value + direction * this.visibleAmount, 0, this.maxValue));
    return true;
  }

  public handleMouseMove(options: { x: number; y: number }) {
    if (!this.isDragging) return;

    const draggableRange = this.track.height - this.getThumb().height;
    if (draggableRange <= 0) return;

    const delta = ((options.y - this.dragStartMouseY) / draggableRange) * this.maxValue;
    this.onScroll(Numbers.clamp(this.dragStartValue + delta, 0, this.maxValue));
  }

  public stopDragging() {
    if (!this.isDragging) return;

    this.isDragging = false;
    window.removeEventListener("mouseup", this.onWindowMouseUp);
  }

  private getThumb(): ScrollRect {
    const totalAmount = this.maxValue + this.visibleAmount;
    const thumbHeight = Math.max(Scrollbar.MIN_THUMB_HEIGHT, this.track.height * (this.visibleAmount / totalAmount));
    const thumbY = this.track.y + (this.value / this.maxValue) * (this.track.height - thumbHeight);

    return { x: this.track.x, y: thumbY, width: this.track.width, height: thumbHeight };
  }
}
