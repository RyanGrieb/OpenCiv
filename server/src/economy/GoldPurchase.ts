/**
 * Civ 5's price for buying production outright with gold. It grows slower than the production
 * cost itself, so big items are cheaper per hammer, and it only charges for the production an item
 * still needs - an item half built costs less to finish.
 */
export class GoldPurchase {
  // Civ 5's GOLD_PURCHASE_GOLD_PER_PRODUCTION and HURRY_GOLD_PRODUCTION_EXPONENT.
  public static readonly GOLD_PER_PRODUCTION = 30;
  public static readonly PRODUCTION_EXPONENT = 0.75;
  // Civ 5 gives units a HurryCostModifier of 20: they cost 20% more gold than a building would.
  public static readonly UNIT_COST_MODIFIER = 0.2;

  public static getCost(type: "unit" | "building", remainingProduction: number): number {
    if (remainingProduction <= 0) return 0;

    const baseCost = Math.pow(remainingProduction * GoldPurchase.GOLD_PER_PRODUCTION, GoldPurchase.PRODUCTION_EXPONENT);
    const cost = type === "unit" ? baseCost * (1 + GoldPurchase.UNIT_COST_MODIFIER) : baseCost;

    // Civ 5 rounds prices down to a multiple of 10.
    return Math.floor(cost / 10) * 10;
  }
}
