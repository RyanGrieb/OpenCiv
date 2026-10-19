import { ServerEvents } from "../Events";
import { Game } from "../Game";
import { GameMap } from "../map/GameMap";
import type { Player } from "../Player";
import { PantheonData, Pantheons } from "./Pantheons";

/**
 * A player's faith-bought beliefs. For now that's their pantheon: once their faith reaches
 * Pantheons.getCost() they may found one that no other civilization has, which spends the faith.
 */
export class PlayerReligion {
  private player: Player;
  private pantheonName: string | undefined;

  constructor(player: Player) {
    this.player = player;

    ServerEvents.on({
      eventName: "requestPantheons",
      parentObject: this,
      callback: (data, websocket) => {
        if (this.player.getWebsocket() != websocket) return;

        this.sendPantheons();
      },
      globalEvent: true
    });

    ServerEvents.on({
      eventName: "foundPantheon",
      parentObject: this,
      callback: (data, websocket) => {
        if (this.player.getWebsocket() != websocket) return;

        this.foundPantheon(data["name"]);
      },
      globalEvent: true
    });
  }

  public getPantheonName(): string | undefined {
    return this.pantheonName;
  }

  public getPantheon(): PantheonData | undefined {
    return this.pantheonName ? Pantheons.getByName(this.pantheonName) : undefined;
  }

  // What the status bar's faith tooltip shows: the pantheon founded, or what the next one costs.
  public getFaithBreakdown() {
    const pantheon = this.getPantheon();
    return {
      pantheon: pantheon ? { name: pantheon.name, description: pantheon.description } : null,
      pantheonCost: Pantheons.getCost(),
      pantheonsLeft: Pantheons.getAvailable().length
    };
  }

  // Enough faith, no pantheon yet, and one left to found. The barbarians never found one.
  public canFoundPantheon(): boolean {
    if (this.pantheonName || this.player.isBarbarian() || !this.player.hasClient()) return false;
    if ((this.player.getAccumulatedStats()["faith"] ?? 0) < Pantheons.getCost()) return false;

    return Pantheons.getAvailable().length > 0;
  }

  /** Founds the pantheon, spending the faith it costs. False if the player can't found that one. */
  public foundPantheon(name: string): boolean {
    const pantheon = Pantheons.getAvailable().find((available) => available.name === name);
    if (!pantheon || !this.canFoundPantheon()) return false;

    this.player.addToAccumulatedStat("faith", -Pantheons.getCost());
    this.pantheonName = pantheon.name;

    this.player.getNotifications().addMessage("ICON_FAITH", `You have founded a pantheon: ${pantheon.name}.`);
    this.announceToOthers(pantheon);
    this.applyFounded();
    return true;
  }

  // The list the client's pantheon picker shows, and what founding one costs.
  public sendPantheons() {
    this.player.sendNetworkEvent({
      event: "pantheons",
      cost: Pantheons.getCost(),
      faith: this.player.getAccumulatedStats()["faith"] ?? 0,
      pantheon: this.pantheonName ?? null,
      canFound: this.canFoundPantheon(),
      available: Pantheons.getAvailable()
    });
  }

  private announceToOthers(pantheon: PantheonData) {
    const civName = this.player.getCivilizationName() ?? this.player.getName();

    Game.getInstance()
      .getPlayers()
      .forEach((other) => {
        if (other === this.player) return;

        other.getNotifications().addMessage("ICON_FAITH", `${civName} has founded a pantheon: ${pantheon.name}.`);
        other.getReligion().sendPantheons();
      });
  }

  // A pantheon can change tile yields, every city's stats and the empire's happiness.
  private applyFounded() {
    const territory = this.player.getCities().flatMap((city) => city.getTerritory());
    if (territory.length > 0) GameMap.getInstance().sendTilesToPlayer(this.player, territory);

    this.player.getCities().forEach((city) => city.updateWorkedTiles({ sendStatUpdate: true }));
    this.player.sendTotalStatsUpdate();
    this.sendPantheons();
  }
}
