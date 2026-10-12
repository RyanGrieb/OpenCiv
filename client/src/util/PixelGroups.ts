/** The separate things painted on a picture, as groups of its pixels touching one another. */
export class PixelGroups {
  // Steps from a pixel to those touching it on a side, then to those touching it only at a corner.
  private static readonly SIDES: [number, number][] = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];
  private static readonly AROUND: [number, number][] = [...PixelGroups.SIDES, [1, 1], [1, -1], [-1, 1], [-1, -1]];

  /**
   * The groups of a mask's set pixels (one entry per pixel of a picture, row by row) touching one
   * another on a side - or at a corner too, unless `corners` is false - each as its pixels' indices,
   * in the order of their first pixel.
   */
  public static find(mask: Uint8Array, width: number, height: number, corners = true): number[][] {
    const steps = corners ? PixelGroups.AROUND : PixelGroups.SIDES;
    const seen = new Uint8Array(mask.length);
    const groups: number[][] = [];

    for (let start = 0; start < mask.length; start++) {
      if (!mask[start] || seen[start]) continue;

      const group = [start];
      seen[start] = 1;
      for (let i = 0; i < group.length; i++) {
        const x = group[i] % width;
        const y = Math.floor(group[i] / width);
        for (const [dx, dy] of steps) {
          const nx = x + dx;
          const ny = y + dy;
          const next = nx + ny * width;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height || !mask[next] || seen[next]) continue;
          seen[next] = 1;
          group.push(next);
        }
      }
      groups.push(group);
    }
    return groups;
  }
}
