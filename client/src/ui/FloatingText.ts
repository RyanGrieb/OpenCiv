import { Game } from "../Game";
import { Label } from "./Label";

/**
 * Civ 5's combat numbers: text in world coordinates that rises from `fromY` to `toY` and then fades out
 * a little further up, removing itself from the scene when it's gone.
 */
export class FloatingText extends Label {
  private static readonly RISE_MS = 1100;
  private static readonly FADE_MS = 600;

  private centerX: number;
  private fromY: number;
  private toY: number;
  private startTime: number;

  constructor(options: { text: string; color: string; centerX: number; fromY: number; toY: number }) {
    super({
      text: options.text,
      font: "bold 8px sans-serif",
      fontColor: options.color,
      lineWidth: 2,
      cameraApplies: true,
      z: 6
    });

    this.centerX = options.centerX;
    this.fromY = options.fromY;
    this.toY = options.toY;
  }

  /**
   * Adds the text to the current scene once its width is known, so it can be centered.
   */
  public show() {
    this.conformSize().then(() => {
      this.startTime = performance.now();
      this.setPosition(this.centerX - this.getWidth() / 2, this.fromY);
      Game.getInstance().getCurrentScene().addActor(this);
    });
  }

  public draw(canvasContext: CanvasRenderingContext2D) {
    const elapsed = performance.now() - this.startTime;
    const speed = (this.toY - this.fromY) / FloatingText.RISE_MS;

    if (elapsed >= FloatingText.RISE_MS + FloatingText.FADE_MS) {
      Game.getInstance().getCurrentScene().removeActor(this);
      return;
    }

    // Keeps rising at the same speed while it fades, so it drifts off rather than stopping dead.
    this.setPosition(this.getX(), this.fromY + speed * elapsed);
    const fade = Math.max(0, elapsed - FloatingText.RISE_MS) / FloatingText.FADE_MS;
    this.setTransparency(1 - fade);
    super.draw(canvasContext);
  }
}
