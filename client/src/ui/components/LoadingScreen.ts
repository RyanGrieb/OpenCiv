import { Game } from "../../Game";
import { Actor } from "../../scene/Actor";
import { ActorGroup } from "../../scene/ActorGroup";
import { SceneBackground } from "../../scene/SceneBackground";
import { Label } from "./Label";
import { LoadingBar } from "./LoadingBar";

/**
 * The full-screen "Loading..." view: the panning grassland, a progress bar, and a label above it
 * naming what's being loaded. The loading scene shows it while the server builds the world, then the
 * in-game scene shows it over the map until every tile is drawn, so the two look like one screen.
 */
export class LoadingScreen extends ActorGroup {
  // Where each stage of loading a game starts on the bar. The server generating the world fills the
  // first half (it reports its own progress, 0 to 1, scaled into it); the client then waits for the
  // map, receives it, draws its chunks and blends their shores and terrain edges.
  public static readonly SERVER_SHARE = 0.5;
  public static readonly WAITING_FOR_MAP = 0.5;
  public static readonly RECEIVING_MAP = 0.55;
  public static readonly DRAWING_MAP = 0.6;
  public static readonly BLENDING_MAP = 0.85;

  // Above the map, its fog and every HUD element.
  private static readonly Z = 1000;
  private static readonly BAR_WIDTH = 400;
  private static readonly BAR_HEIGHT = 20;
  private static readonly LABEL_GAP = 12;
  private static readonly FONT = "bold 24px arial";
  // How quickly the bar catches up to the progress it's been given: it closes this share of the gap
  // per 100ms, so a big jump glides rather than snaps - and never slower than MIN_SPEED (bar widths a
  // second), so the last stretch doesn't crawl.
  private static readonly GLIDE_PER_100MS = 0.35;
  private static readonly MIN_SPEED = 0.8;
  private static readonly FADE_MS = 400;

  // Kept from one scene to the next, so the terrain doesn't jump when the in-game scene takes over.
  private static background: Actor;
  private static backgroundWidth: number;
  private static backgroundHeight: number;
  // Where the last screen's bar had got to, so the next one carries on from there rather than jumping.
  private static shownProgress = 0;

  private label: Label;
  private bar: LoadingBar;
  // The progress the bar is gliding towards; the bar itself shows where it has got to.
  private targetProgress: number;
  private lastFrameMs: number;
  // Set by finish(): called once the bar has filled and the screen has faded out.
  private onFinished: () => void;
  private fadeStartMs: number;

  constructor(text: string, progress: number) {
    const width = Game.getInstance().getWidth();
    const height = Game.getInstance().getHeight();
    super({ x: 0, y: 0, width, height, cameraApplies: false, z: LoadingScreen.Z });

    const continuing = LoadingScreen.background !== undefined;
    this.addActor(LoadingScreen.getBackground());

    this.bar = new LoadingBar({
      x: width / 2 - LoadingScreen.BAR_WIDTH / 2,
      y: height / 2,
      width: LoadingScreen.BAR_WIDTH,
      height: LoadingScreen.BAR_HEIGHT,
      progress: continuing ? Math.min(progress, LoadingScreen.shownProgress) : progress
    });
    this.addActor(this.bar);

    this.label = new Label({
      text,
      font: LoadingScreen.FONT,
      fontColor: "white",
      shadowColor: "black",
      lineWidth: 4,
      shadowBlur: 20
    });
    this.addActor(this.label);
    this.centerLabel();

    this.targetProgress = progress;
    this.lastFrameMs = Date.now();
  }

  // Forgets the background, so the next load starts on fresh terrain.
  public static discardBackground() {
    LoadingScreen.background = undefined;
    LoadingScreen.shownProgress = 0;
  }

  private static getBackground(): Actor {
    const width = Game.getInstance().getWidth();
    const height = Game.getInstance().getHeight();
    if (
      !LoadingScreen.background ||
      LoadingScreen.backgroundWidth !== width ||
      LoadingScreen.backgroundHeight !== height
    ) {
      LoadingScreen.background = SceneBackground.generatePanningGrassland();
      LoadingScreen.backgroundWidth = width;
      LoadingScreen.backgroundHeight = height;
    }
    return LoadingScreen.background;
  }

  /**
   * @param text What's being loaded right now.
   * @param progress How far through the whole load, from 0 to 1.
   */
  public setStatus(text: string, progress: number) {
    this.targetProgress = Math.max(this.targetProgress, progress);
    if (text === this.label.getText()) return;

    this.label.setText(text);
    this.centerLabel();
  }

  public getText(): string {
    return this.label.getText();
  }

  public getProgress(): number {
    return this.targetProgress;
  }

  /**
   * Lets the bar fill up the rest of the way, then fades the screen out to show what's under it.
   * @param onFinished Called once it has faded away, to remove it.
   */
  public finish(text: string, onFinished: () => void) {
    this.setStatus(text, 1);
    this.onFinished = onFinished;
  }

  public draw(canvasContext: CanvasRenderingContext2D) {
    this.advance();
    super.draw(canvasContext);
  }

  private advance() {
    const now = Date.now();
    const elapsedMs = now - this.lastFrameMs;
    this.lastFrameMs = now;

    const gap = this.targetProgress - this.bar.getProgress();
    const glide = gap * (1 - Math.pow(1 - LoadingScreen.GLIDE_PER_100MS, elapsedMs / 100));
    const step = Math.max(glide, (LoadingScreen.MIN_SPEED * elapsedMs) / 1000);
    this.bar.setProgress(this.bar.getProgress() + Math.min(gap, step));
    if (!this.onFinished) LoadingScreen.shownProgress = this.bar.getProgress();

    if (!this.onFinished || this.bar.getProgress() < 1) return;

    this.fadeStartMs ??= now;
    const fade = (now - this.fadeStartMs) / LoadingScreen.FADE_MS;
    if (fade < 1) {
      this.setTransparency(1 - fade);
      return;
    }

    const onFinished = this.onFinished;
    this.onFinished = undefined;
    onFinished();
  }

  private centerLabel() {
    const { width } = Game.getInstance().measureText(this.label.getText(), LoadingScreen.FONT);
    // Measured on fixed text rather than the label's own, so descenders don't bob the label up and down.
    const { height } = Game.getInstance().measureText("Ag", LoadingScreen.FONT);
    this.label.setSize(width, height);
    this.label.setPosition(this.width / 2 - width / 2, this.bar.getY() - LoadingScreen.LABEL_GAP - height);
  }
}
