import { Strings } from "../../util/Strings";

/**
 * Yields written for a Label with icons: "+2 !{food}+1 !{production}" draws as "+2 [food] +1 [production]".
 * No space after each icon, so the next number keeps the icon's empty edge as its gap instead of tucking in
 * the way words do.
 */
export class YieldText {
  // The stats drawn as icons, in the order they're listed.
  private static readonly STATS = [
    "population",
    "food",
    "production",
    "gold",
    "science",
    "culture",
    "faith",
    "happiness",
    "defense",
    "city_health"
  ];

  public static isYieldStat(stat: string): boolean {
    return YieldText.STATS.includes(stat);
  }

  /** Each yield stat that isn't zero, added up across `stats`. Other stats are left out. */
  public static of(stats: Record<string, number>[]): string {
    const totals: Record<string, number> = {};
    stats
      .flatMap((stat) => Object.entries(stat))
      .forEach(([name, value]) => (totals[name] = (totals[name] ?? 0) + value));

    return YieldText.STATS.filter((name) => (totals[name] ?? 0) !== 0)
      .map((name) => `${Strings.convertToStatUnit(totals[name])} !{${name}}`)
      .join("");
  }

  /** The yields, then the words after them: "+1 !{faith} from Desert tiles". Either may be empty. */
  public static withText(stats: Record<string, number>, text?: string): string {
    return [YieldText.of([stats]), text].filter((part) => !!part).join(" ");
  }
}
