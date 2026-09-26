import { Game } from "../Game";
import { NetworkEvents, WebsocketClient } from "../network/Client";
import { ClientPlayer } from "../player/ClientPlayer";
import { InGameScene } from "../scene/type/InGameScene";

// Mirrors server/src/notification/PlayerNotifications.ts's NotificationData - keep both in sync.
export interface NotificationData {
  id: string;
  type: "research" | "production" | "unitOrders" | "message";
  icon: string;
  text: string;
  priority: number;
  turnBlockingLabel?: string;
  cityNames?: string[];
  unitIds?: number[];
}

/**
 * Holds the notifications the server says this player has, and carries out a click on one. The
 * server decides what is shown and when it goes away; the client only opens the right window or
 * selects the right unit, which is UI the server can't do.
 */
export class Notifications {
  private player: ClientPlayer;
  private notifications: NotificationData[];
  // Repeated clicks on a notification covering several cities or units step through them.
  private cycleIndexes: Map<string, number>;
  private changeListeners: (() => void)[];

  constructor(player: ClientPlayer) {
    this.player = player;
    this.notifications = [];
    this.cycleIndexes = new Map();
    this.changeListeners = [];

    NetworkEvents.on<{ notifications: NotificationData[] }>({
      eventName: "notifications",
      parentObject: this,
      callback: (data) => {
        this.notifications = data.notifications;
        this.changeListeners.forEach((listener) => listener());
      }
    });

    WebsocketClient.sendMessage({ event: "requestNotifications" });
  }

  public getAll(): NotificationData[] {
    return this.notifications;
  }

  /** The first notification the player has to deal with before ending their turn, if any. */
  public getTurnBlocker(): NotificationData | undefined {
    return this.notifications.find((notification) => notification.turnBlockingLabel);
  }

  public onChange(listener: () => void) {
    this.changeListeners.push(listener);
  }

  public removeChangeListener(listener: () => void) {
    this.changeListeners = this.changeListeners.filter((existing) => existing !== listener);
  }

  public act(notification: NotificationData) {
    const scene = Game.getInstance().getCurrentSceneAs<InGameScene>();

    switch (notification.type) {
      case "research":
        scene.toggleResearchUI();
        return;
      case "production":
        this.openNextCity(notification, scene);
        return;
      case "unitOrders":
        this.selectNextUnit(notification, scene);
        return;
      case "message":
        WebsocketClient.sendMessage({ event: "dismissNotification", id: notification.id });
        return;
    }
  }

  private openNextCity(notification: NotificationData, scene: InGameScene) {
    const cityName = this.nextTarget(notification, notification.cityNames);
    const city = this.player.getCities().find((city) => city.getName() === cityName);
    if (!city) return;

    scene.toggleCityUI(city);
  }

  private selectNextUnit(notification: NotificationData, scene: InGameScene) {
    const unitId = this.nextTarget(notification, notification.unitIds);
    const unit = this.player.getUnits().find((unit) => unit.getID() === unitId);
    if (!unit) return;

    scene.focusOnTile(unit.getTile(), scene.getCamera().getZoomAmount());
    this.player.selectUnit(unit);
  }

  private nextTarget<T>(notification: NotificationData, targets: T[] | undefined): T | undefined {
    if (!targets || targets.length < 1) return undefined;

    const index = (this.cycleIndexes.get(notification.id) ?? 0) % targets.length;
    this.cycleIndexes.set(notification.id, index + 1);
    return targets[index];
  }
}
