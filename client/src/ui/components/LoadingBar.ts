import { Actor } from "../../scene/Actor";
import { ActorGroup } from "../../scene/ActorGroup";

export interface LoadingBarOptions {
  x: number;
  y: number;
  z?: number;
  width: number;
  height: number;
  // 0-1. Defaults to 0.
  progress?: number;
  fillColor?: string;
  backgroundColor?: string;
  cameraApplies?: boolean;
}

// Generic 0-1 progress bar: a background track plus a fill that scales with progress.
// Caller owns any label/number - this only draws the bar itself, so it fits any
// fill-over-time readout (city growth, production, health, etc).
export class LoadingBar extends ActorGroup {
  private fillActor: Actor;
  private fillColor: string;
  private progress: number;

  constructor(options: LoadingBarOptions) {
    super({
      x: options.x,
      y: options.y,
      z: options.z,
      width: options.width,
      height: options.height,
      cameraApplies: options.cameraApplies ?? false
    });

    this.fillColor = options.fillColor ?? "rgb(0, 200, 0)";
    this.progress = Math.min(1, Math.max(0, options.progress ?? 0));

    this.addActor(
      new Actor({
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        color: options.backgroundColor ?? "rgb(40, 40, 40)"
      })
    );

    this.fillActor = new Actor({
      x: this.x,
      y: this.y,
      width: this.width * this.progress,
      height: this.height,
      color: this.fillColor
    });
    this.addActor(this.fillActor);
  }

  public setProgress(progress: number) {
    this.progress = Math.min(1, Math.max(0, progress));
    this.fillActor.setSize(this.width * this.progress, this.height);
  }

  public setFillColor(color: string) {
    this.fillColor = color;
    this.fillActor.setColor(color);
  }
}
