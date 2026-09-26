import { ServerEvents } from "../Events";
import { Game } from "../Game";
import { Player } from "../Player";
import { Unit } from "../unit/Unit";

// Higher priorities sit nearer the top of the client's notification stack.
export enum NotificationPriority {
  LOWEST,
  LOW,
  MEDIUM,
  HIGH
}

// What the client does when the notification is clicked: open the research tree, open a city
// needing production, select a unit needing orders, or dismiss a one-off message.
export type NotificationType = "research" | "production" | "unitOrders" | "message";

export interface NotificationData {
  id: string;
  type: NotificationType;
  // A SpriteRegion key on the client.
  icon: string;
  text: string;
  priority: NotificationPriority;
  // Set when the player must deal with this before ending the turn. The client's Next Turn button
  // shows this label and acts on the notification instead.
  turnBlockingLabel?: string;
  // What a click cycles through, for "production" and "unitOrders".
  cityNames?: string[];
  unitIds?: number[];
}

interface MessageOptions {
  priority?: NotificationPriority;
  // Tips about moving a unit go away as soon as the player moves one.
  dismissOnUnitMove?: boolean;
}

interface Message {
  data: NotificationData;
  dismissOnUnitMove: boolean;
}

/**
 * Decides which notifications a player has and pushes the whole list to their client whenever it
 * changes. Most of them are derived from game state on every refresh (no research chosen, a city
 * with nothing to build, units still able to move), so they can't go stale; one-off messages (a
 * finished building, a discovered tech) are stored until the player dismisses them or the turn ends.
 */
export class PlayerNotifications {
  private static readonly MOVE_UNIT_TIP_ID = "moveUnitTip";
  // The right-click-to-move tip only helps a player who hasn't found it yet.
  private static readonly MOVE_UNIT_TIP_LAST_TURN = 1;

  private static nextMessageId = 1;

  private player: Player;
  private messages: Message[];
  private currentTurn: number;
  private lastSentJSON: string;
  private refreshQueued: boolean;

  constructor(player: Player) {
    this.player = player;
    this.messages = [];
    this.currentTurn = 0;
    this.lastSentJSON = JSON.stringify([]);
    this.refreshQueued = false;

    ServerEvents.on({
      eventName: "requestNotifications",
      parentObject: this,
      callback: (data, websocket) => {
        if (this.player.getWebsocket() != websocket) return;

        this.resend();
      },
      globalEvent: true
    });

    ServerEvents.on({
      eventName: "dismissNotification",
      parentObject: this,
      callback: (data, websocket) => {
        if (this.player.getWebsocket() != websocket) return;

        this.dismissMessage(data["id"]);
      },
      globalEvent: true
    });

    ServerEvents.on({
      eventName: "requestMoveUnitTip",
      parentObject: this,
      callback: (data, websocket) => {
        if (this.player.getWebsocket() != websocket) return;

        this.addMoveUnitTip();
      },
      globalEvent: true
    });

    ServerEvents.on({
      eventName: "moveUnit",
      parentObject: this,
      callback: (data, websocket) => {
        if (this.player.getWebsocket() != websocket) return;

        this.messages = this.messages.filter((message) => !message.dismissOnUnitMove);
      },
      globalEvent: true
    });
  }

  /**
   * Re-checks every player's notifications once the current batch of work is done. Called after
   * each client message and each turn change - between them, those are everything that can change
   * a notification.
   */
  public static refreshAll() {
    Game.getInstance()
      .getPlayers()
      .forEach((player) => player.getNotifications().queueRefresh());
  }

  // A unit heading somewhere, fortified, or working an improvement already has its orders.
  private static needsOrders(unit: Unit): boolean {
    if (unit.getAvailableMovement() <= 0) return false;

    return !unit.hasMovementQueue() && !unit.isFortified() && !unit.getBuildingImprovement();
  }

  /**
   * Called before a new turn is processed, so messages from the old turn are gone before the new
   * turn's (a tech discovered, a unit finished) are added.
   */
  public startTurn(turn: number) {
    this.currentTurn = turn;
    this.messages = [];
  }

  public addMessage(icon: string, text: string, options?: MessageOptions) {
    this.pushMessage(`message${PlayerNotifications.nextMessageId++}`, icon, text, options);
  }

  public dismissMessage(id: string) {
    this.messages = this.messages.filter((message) => message.data.id !== id);
  }

  public queueRefresh() {
    if (this.refreshQueued) return;

    this.refreshQueued = true;
    setImmediate(() => {
      this.refreshQueued = false;
      this.refresh();
    });
  }

  public refresh() {
    const json = JSON.stringify(this.getNotifications());
    if (json === this.lastSentJSON) return;

    this.lastSentJSON = json;
    this.player.sendNetworkEvent({ event: "notifications", notifications: JSON.parse(json) });
  }

  /** Sends the list even if it hasn't changed, e.g. to a client that has just (re)loaded. */
  public resend() {
    this.lastSentJSON = undefined;
    this.refresh();
  }

  /** Every active notification, highest priority first. */
  public getNotifications(): NotificationData[] {
    const derived = [this.getResearchNotification(), this.getProductionNotification(), this.getUnitOrdersNotification()];
    const notifications = [...derived.filter((notification) => notification), ...this.messages.map((message) => message.data)];

    // Stable sort: equal priorities keep the order they were added in.
    return notifications.sort((a, b) => b.priority - a.priority);
  }

  private getResearchNotification(): NotificationData | undefined {
    // Science only comes from cities, so there's nothing to research until the first is founded.
    if (this.player.getCities().length < 1 || this.player.getCurrentResearch()) return undefined;
    if (!this.player.hasTechsLeftToResearch()) return undefined;

    return {
      id: "research",
      type: "research",
      icon: "ICON_SCIENCE",
      text: "You can research a new technology.",
      priority: NotificationPriority.HIGH,
      turnBlockingLabel: "Choose Research"
    };
  }

  private getProductionNotification(): NotificationData | undefined {
    const idleCities = this.player.getCities().filter((city) => city.getProductionQueue().length < 1);
    if (idleCities.length < 1) return undefined;

    return {
      id: "production",
      type: "production",
      icon: "ICON_PRODUCTION",
      text: "A city can choose production.",
      priority: NotificationPriority.MEDIUM,
      turnBlockingLabel: "Choose Production",
      cityNames: idleCities.map((city) => city.getName())
    };
  }

  private getUnitOrdersNotification(): NotificationData | undefined {
    const idleUnits = this.player.getUnits().filter((unit) => PlayerNotifications.needsOrders(unit));
    if (idleUnits.length < 1) return undefined;

    return {
      id: "unitOrders",
      type: "unitOrders",
      icon: "ICON_MOVE",
      text: "You can move a unit.",
      priority: NotificationPriority.LOW,
      unitIds: idleUnits.map((unit) => unit.getId())
    };
  }

  private addMoveUnitTip() {
    if (this.currentTurn > PlayerNotifications.MOVE_UNIT_TIP_LAST_TURN) return;
    if (this.messages.some((message) => message.data.id === PlayerNotifications.MOVE_UNIT_TIP_ID)) return;

    this.pushMessage(PlayerNotifications.MOVE_UNIT_TIP_ID, "ICON_QUESTION", "Tip: Right-click a tile to move a unit.", {
      priority: NotificationPriority.LOWEST,
      dismissOnUnitMove: true
    });
  }

  private pushMessage(id: string, icon: string, text: string, options?: MessageOptions) {
    this.messages.push({
      data: { id, type: "message", icon, text, priority: options?.priority ?? NotificationPriority.LOW },
      dismissOnUnitMove: options?.dismissOnUnitMove ?? false
    });
  }
}
