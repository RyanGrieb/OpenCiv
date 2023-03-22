export class Numbers {
  public static clamp(num, min, max): number {
    return Math.min(Math.max(num, min), max);
  }
}
