// Shared sizing for in-game UI. Kept in one place so font and icon scale stay in
// step - the surrounding containers are sized against these, so changing one
// without the other will clip text.
export class UITheme {
  public static readonly FONT_SIZE = 24;
  public static readonly FONT = `${UITheme.FONT_SIZE}px serif`;
  public static readonly ICON_SIZE = 40;
  public static readonly STATUS_BAR_HEIGHT = 40;

  /**
   * Top offset that vertically centers a single FONT line inside a box of `height`.
   */
  public static centerTextY(height: number): number {
    return (height - UITheme.FONT_SIZE) / 2;
  }
}
