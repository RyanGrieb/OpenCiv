/**
 * The price of buying a unit outright with faith, once a belief like Holy Warriors allows it. Faith
 * buildings carry their own price in config/religions.yml.
 */
export class FaithPurchase {
  // A guess at Civ 5's faith prices for units: about twice the production they still need.
  public static readonly FAITH_PER_PRODUCTION = 2;

  public static getUnitCost(remainingProduction: number): number {
    if (remainingProduction <= 0) return 0;

    // Rounded down to a multiple of 10, like gold prices.
    return Math.floor((remainingProduction * FaithPurchase.FAITH_PER_PRODUCTION) / 10) * 10;
  }
}
