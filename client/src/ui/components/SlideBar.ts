import { Game } from "../../Game";
import { Actor } from "../../scene/Actor";
import { Numbers } from "../../util/Numbers";

export interface SlideBarOptions {
  x: number;
  y: number;
  z?: number;
  width: number;
  height: number;
  min: number;
  max: number;
  step?: number;
  value: number;
  // Fired once, when the drag (or click) ends - not on every intermediate step. A parent
  // that re-renders its whole options list in response (see GameOptionsGroup) would
  // otherwise tear down and rebuild this very SlideBar mid-drag if it fired continuously.
  onChanged: (value: number) => void;
  // Fired on every step while dragging, purely for live UI feedback (e.g. updating a
  // value label) - cheap and client-side only, unlike onChanged.
  onDragging?: (value: number) => void;
}

// Draggable horizontal slider - track + thumb are drawn directly (like ListBox's
// scrollbar) rather than from sprites, since there's no slider artwork yet.
export class SlideBar extends Actor {
  private static readonly TRACK_HEIGHT = 6;
  private static readonly TRACK_COLOR = "rgba(0, 0, 0, 0.35)";
  private static readonly THUMB_WIDTH = 16;
  private static readonly THUMB_COLOR = "rgba(255, 255, 255, 0.85)";

  private min: number;
  private max: number;
  private step: number;
  private value: number;
  private onChangedCallback: (value: number) => void;
  private onDraggingCallback?: (value: number) => void;
  private isDragging: boolean;
  // Bound once so the same reference can be passed to both addEventListener and
  // removeEventListener - mirrors ListBox's scrollbar drag handling: the mouseup that
  // should end a drag must be caught even if the cursor has moved off this actor by then.
  private readonly onWindowMouseUp = () => this.commitDrag();

  constructor(options: SlideBarOptions) {
    super({
      x: options.x,
      y: options.y,
      z: options.z,
      width: options.width,
      height: options.height,
      cameraApplies: false
    });

    this.min = options.min;
    this.max = options.max;
    this.step = options.step ?? 1;
    this.value = options.value;
    this.onChangedCallback = options.onChanged;
    this.onDraggingCallback = options.onDragging;
    this.isDragging = false;

    this.on("mousemove", (moveOptions: { x: number; y: number }) => {
      if (this.mouseInside) {
        Game.getInstance().setCursor("pointer");
      }

      if (this.isDragging) {
        const previousValue = this.value;
        this.setValue(this.xToValue(moveOptions.x));

        if (this.value !== previousValue) {
          this.onDraggingCallback?.(this.value);
        }
      }
    });

    this.on("mousedown", (downOptions: { x: number; y: number; button: number }) => {
      if (downOptions.button !== 0 || !this.insideActor(downOptions.x, downOptions.y)) {
        return;
      }

      this.isDragging = true;
      this.setValue(this.xToValue(downOptions.x));
      this.onDraggingCallback?.(this.value);
      window.addEventListener("mouseup", this.onWindowMouseUp);
    });

    this.on("mouse_enter", () => Game.getInstance().setCursor("pointer"));
    this.on("mouse_exit", () => Game.getInstance().setCursor("default"));
  }

  public draw(canvasContext: CanvasRenderingContext2D) {
    const trackY = this.y + this.height / 2 - SlideBar.TRACK_HEIGHT / 2;
    Game.getInstance().drawRect({
      x: this.x,
      y: trackY,
      width: this.width,
      height: SlideBar.TRACK_HEIGHT,
      color: SlideBar.TRACK_COLOR,
      fill: true,
      canvasContext
    });

    Game.getInstance().drawRect({
      x: this.valueToThumbX(),
      y: this.y,
      width: SlideBar.THUMB_WIDTH,
      height: this.height,
      color: SlideBar.THUMB_COLOR,
      fill: true,
      canvasContext
    });
  }

  public getValue() {
    return this.value;
  }

  // Updates the displayed value without notifying onChanged - for the live drag preview
  // above, and for syncing to a value that came from the server.
  public setValue(value: number) {
    const stepped = Math.round((value - this.min) / this.step) * this.step + this.min;
    this.value = Numbers.clamp(stepped, this.min, this.max);
  }

  public onDestroyed(): void {
    super.onDestroyed();

    if (!this.isDragging) {
      return;
    }

    this.isDragging = false;
    window.removeEventListener("mouseup", this.onWindowMouseUp);
  }

  private valueToThumbX(): number {
    const percent = (this.value - this.min) / (this.max - this.min);
    return this.x + percent * (this.width - SlideBar.THUMB_WIDTH);
  }

  private xToValue(mouseX: number): number {
    const usableWidth = this.width - SlideBar.THUMB_WIDTH;
    const percent = Numbers.clamp((mouseX - this.x - SlideBar.THUMB_WIDTH / 2) / usableWidth, 0, 1);
    return this.min + percent * (this.max - this.min);
  }

  private commitDrag() {
    if (!this.isDragging) {
      return;
    }

    this.isDragging = false;
    window.removeEventListener("mouseup", this.onWindowMouseUp);
    this.onChangedCallback(this.value);
  }
}
