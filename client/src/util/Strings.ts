export class Strings {
  public static capitalizeWords(input: string): string {
    return input.replace(/\b\w/g, (match) => match.toUpperCase());
  }

  // "Composite Bowman" -> "COMPOSITE_BOWMAN", matching our SCREAMING_SNAKE_CASE asset keys.
  public static toConstantCase(input: string): string {
    return input.toUpperCase().replace(/ /g, "_");
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
