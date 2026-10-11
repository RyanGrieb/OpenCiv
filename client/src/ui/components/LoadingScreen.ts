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
  // Above the map, its fog and every HUD element.
  private static readonly Z = 1000;
  private static readonly BAR_WIDTH = 400;
  private static readonly BAR_HEIGHT = 20;
  private static readonly LABEL_GAP = 12;
  private static readonly FONT = "bold 24px arial";

  // Kept from one scene to the next, so the terrain doesn't jump when the in-game scene takes over.
  private static background: Actor;
  private static backgroundWidth: number;
  private static backgroundHeight: number;

  private label: Label;
  private bar: LoadingBar;

  constructor(text: string, progress: number) {
    const width = Game.getInstance().getWidth();
    const height = Game.getInstance().getHeight();
    super({ x: 0, y: 0, width, height, cameraApplies: false, z: LoadingScreen.Z });

    this.addActor(LoadingScreen.getBackground());

    this.bar = new LoadingBar({
      x: width / 2 - LoadingScreen.BAR_WIDTH / 2,
      y: height / 2,
      width: LoadingScreen.BAR_WIDTH,
      height: LoadingScreen.BAR_HEIGHT,
      progress
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
  }

  // Forgets the background, so the next load starts on fresh terrain.
  public static discardBackground() {
    LoadingScreen.background = undefined;
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
    this.bar.setProgress(progress);
    if (text === this.label.getText()) return;

    this.label.setText(text);
    this.centerLabel();
  }

  public getText(): string {
    return this.label.getText();
  }

  public getProgress(): number {
    return this.bar.getProgress();
  }

  private centerLabel() {
    const { width } = Game.getInstance().measureText(this.label.getText(), LoadingScreen.FONT);
    // Measured on fixed text rather than the label's own, so descenders don't bob the label up and down.
    const { height } = Game.getInstance().measureText("Ag", LoadingScreen.FONT);
    this.label.setSize(width, height);
    this.label.setPosition(this.width / 2 - width / 2, this.bar.getY() - LoadingScreen.LABEL_GAP - height);
  }
}
