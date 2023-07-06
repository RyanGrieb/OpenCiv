export class Strings {
  public static capitalizeWords(input: string): string {
    return input.replace(/\b\w/g, (match) => match.toUpperCase());
  }
}
