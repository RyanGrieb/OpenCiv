import { ClientSettings } from "../../ClientSettings";
import { GameImage, SpriteRegion, resolveSpriteRegion } from "../../Assets";
import { Game } from "../../Game";
import { NotificationData, Notifications } from "../../notification/Notifications";
import { Actor } from "../../scene/Actor";
import { ActorGroup } from "../../scene/ActorGroup";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { UITheme } from "../UITheme";
import { UnitDisplayInfo } from "./UnitDisplayInfo";

const BOX_WIDTH = 320;
const MIN_BOX_HEIGHT = 76;
const PADDING = 10;
const GOTO_BUTTON_SIZE = 44;
const GOTO_BUTTON_GAP = 4;
const ROW_GAP = 6;
const WIDTH = GOTO_BUTTON_SIZE + GOTO_BUTTON_GAP + BOX_WIDTH;
const TEXT_X = PADDING + UITheme.ICON_SIZE + PADDING;

/**
 * The stack of notifications down the top-right of the screen, as in the old_java client: each row
 * is a go-to button beside a box with an icon and text, highest priority on top. Clicking either
 * one acts on the notification. Rows are rebuilt whenever the server sends a new list.
 */
export class NotificationPanel extends ActorGroup {
  private notifications: Notifications;
  private rowActors: Actor[];
  // Rows are laid out after their labels measure themselves (async), so a newer list can arrive
  // mid-build - only the latest build gets to add its rows.
  private buildGeneration: number;
  private changeListener: () => void;

  constructor(notifications: Notifications) {
    const x = Game.getInstance().getWidth() - WIDTH - PADDING;
    const y = UITheme.STATUS_BAR_HEIGHT + PADDING;
    const height = Game.getInstance().getHeight() - UnitDisplayInfo.HEIGHT - y;

    super({ x, y, z: 5, width: WIDTH, height, cameraApplies: false });

    this.notifications = notifications;
    this.rowActors = [];
    this.buildGeneration = 0;
    this.setTransparency(ClientSettings.get("HUD_TRANSPARENCY"));

    this.changeListener = () => this.rebuild();
  }

  private static makeClickable(actor: Actor, onClicked: () => void) {
    actor.on("clicked", onClicked);
    actor.on("mouse_enter", () => Game.getInstance().setCursor("pointer"));
    actor.on("mouse_exit", () => Game.getInstance().setCursor("default"));
  }

  // The scene removes and re-adds this panel whenever a full-screen window opens and closes, so it
  // only follows the list while it's on screen.
  public onCreated(): void {
    this.notifications.onChange(this.changeListener);
    this.rebuild();
  }

  /** Whether a screen point is on one of the rows (the panel's own bounds are mostly empty map). */
  public isOverRow(x: number, y: number): boolean {
    return this.rowActors.some((actor) => actor.insideActor(x, y));
  }

  public onDestroyed(): void {
    super.onDestroyed();
    this.notifications.removeChangeListener(this.changeListener);
  }

  private async rebuild() {
    const generation = ++this.buildGeneration;
    const rows: Actor[][] = [];
    let rowY = this.y;

    for (const notification of this.notifications.getAll()) {
      const row = await this.createRow(notification, rowY);
      if (generation !== this.buildGeneration) return;

      const rowHeight = row[0].getHeight();
      // Whatever doesn't fit above the unit window waits until the rows above it are dealt with.
      if (rowY + rowHeight > this.y + this.height) break;

      rows.push(row);
      rowY += rowHeight + ROW_GAP;
    }

    this.rowActors.forEach((actor) => this.removeActor(actor));
    this.rowActors = rows.flat();
    this.rowActors.forEach((actor) => this.addActor(actor));
  }

  // The box comes first in the returned row, since its height is the row's.
  private async createRow(notification: NotificationData, y: number): Promise<Actor[]> {
    const boxX = this.x + GOTO_BUTTON_SIZE + GOTO_BUTTON_GAP;

    const label = new Label({
      text: notification.text,
      font: UITheme.FONT,
      fontColor: "white",
      maxWidth: BOX_WIDTH - TEXT_X - PADDING
    });
    await label.conformSize();

    const boxHeight = Math.max(MIN_BOX_HEIGHT, label.getHeight() + PADDING * 2);
    label.setPosition(boxX + TEXT_X, y + (boxHeight - label.getHeight()) / 2);

    const box = new Actor({
      image: Game.getInstance().getImage(GameImage.POPUP_BOX),
      x: boxX,
      y,
      width: BOX_WIDTH,
      height: boxHeight,
      nineSlice: true,
      cornerSize: 20
    });
    NotificationPanel.makeClickable(box, () => this.notifications.act(notification));

    const icon = new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: resolveSpriteRegion(notification.icon) ?? SpriteRegion.ICON_UNKNOWN,
      x: boxX + PADDING,
      y: y + (boxHeight - UITheme.ICON_SIZE) / 2,
      width: UITheme.ICON_SIZE,
      height: UITheme.ICON_SIZE
    });

    const gotoButton = new Button({
      buttonImage: GameImage.ICON_BUTTON,
      buttonHoveredImage: GameImage.ICON_BUTTON_HOVERED,
      icon: SpriteRegion.ICON_GOTO_LEFT,
      iconWidth: 32,
      iconHeight: 32,
      width: GOTO_BUTTON_SIZE,
      height: GOTO_BUTTON_SIZE,
      x: this.x,
      y,
      onClicked: () => this.notifications.act(notification)
    });

    return [box, icon, label, gotoButton];
  }
}
