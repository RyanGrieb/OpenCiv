export class Strings {
  public static capitalizeWords(input: string): string {
    return input.replace(/\b\w/g, (match) => match.toUpperCase());
  }

  // "Anti-Tank Gun" -> "ANTI_TANK_GUN", matching our SCREAMING_SNAKE_CASE asset keys.
  public static toConstantCase(input: string): string {
    return input.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
  }

  /**
   * Returns a string with +n if the number is >= 0, otherwise -n.
   * @param input
   */
  public static convertToStatUnit(n: number) {
    if (n >= 0) {
      return "+" + n;
    } else {
      return n.toString();
    }
  }
}
