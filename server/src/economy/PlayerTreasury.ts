import { Player } from "../Player";
import { Unit } from "../unit/Unit";

// One line of the gold breakdown the status bar's tooltip shows, e.g. { source: "Rome", amount: 4 }.
export interface GoldEntry {
  source: string;
  amount: number;
}

export interface GoldBreakdown {
  income: GoldEntry[];
  expenses: GoldEntry[];
  // Gold gained (or lost, when negative) at the end of the turn.
  net: number;
}

/**
 * Where a player's gold comes from and goes each turn: cities earn it, and buildings and units
 * cost upkeep, as in Civ 5. The banked gold itself lives in Player's accumulated stats.
 *
 * Unit upkeep is a simplified Civ 5 rule: the first FREE_UNITS units are free and every unit past
 * them costs GOLD_PER_UNIT (Civ 5 also raises the per-unit cost as the game goes on). Running the
 * treasury dry disbands a unit each turn it stays empty, again as in Civ 5.
 */
export class PlayerTreasury {
  public static readonly FREE_UNITS = 3;
  public static readonly GOLD_PER_UNIT = 1;

  private player: Player;

  constructor(player: Player) {
    this.player = player;
  }

  public getBuildingUpkeep(): number {
    return this.player.getCities().reduce((total, city) => total + city.getBuildingMaintenance(), 0);
  }

  public getUnitUpkeep(): number {
    // The barbarians have no treasury to pay from.
    if (this.player.isBarbarian()) return 0;

    const paidUnits = Math.max(0, this.player.getUnits().length - PlayerTreasury.FREE_UNITS);
    return paidUnits * PlayerTreasury.GOLD_PER_UNIT;
  }

  public getUpkeep(): number {
    return this.getBuildingUpkeep() + this.getUnitUpkeep();
  }

  public getBreakdown(): GoldBreakdown {
    const income = this.player
      .getCities()
      .map((city) => ({ source: city.getName(), amount: city.getStatline({ asArray: false }).gold }))
      .filter((entry) => entry.amount !== 0);

    const expenses = [
      { source: "Building maintenance", amount: this.getBuildingUpkeep() },
      { source: `Unit maintenance (${this.getPaidUnitsText()})`, amount: this.getUnitUpkeep() }
    ].filter((entry) => entry.amount !== 0);

    const net =
      income.reduce((total, entry) => total + entry.amount, 0) -
      expenses.reduce((total, entry) => total + entry.amount, 0);

    return { income, expenses, net };
  }

  public getGold(): number {
    return this.player.getAccumulatedStats()["gold"] ?? 0;
  }

  public canAfford(amount: number): boolean {
    return this.getGold() >= amount;
  }

  public spend(amount: number) {
    this.player.addToAccumulatedStat("gold", -amount);
  }

  /**
   * Called once this turn's gold is banked. A treasury left below zero is emptied instead, and a
   * unit is disbanded to cut costs - a military one first, since they're what an empire can spare.
   */
  public settleDebt() {
    const gold = this.getGold();
    if (gold >= 0) return;

    this.player.addToAccumulatedStat("gold", -gold);

    const unit = this.pickUnitToDisband();
    if (!unit) return;

    unit.delete();
    this.player
      .getNotifications()
      .addMessage("ICON_GOLD", `Your treasury is empty! A ${unit.getName()} has been disbanded to pay for upkeep.`);
  }

  private pickUnitToDisband(): Unit | undefined {
    const units = this.player.getUnits();
    return [...units].reverse().find((unit) => unit.canFight()) ?? units[units.length - 1];
  }

  // e.g. "5 units, 3 free"
  private getPaidUnitsText(): string {
    const count = this.player.getUnits().length;
    return `${count} unit${count === 1 ? "" : "s"}, ${PlayerTreasury.FREE_UNITS} free`;
  }
}
