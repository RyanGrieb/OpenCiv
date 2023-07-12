import { Line } from "../scene/Line";
import { Tile } from "./Tile";

export class TileOutline {
  public line: Line;
  public edge: number;
  public cityOutline: boolean;
  private effectedOutlines: Map<Tile, TileOutline[]>;

  public constructor(line: Line, edge: number, cityOutline: boolean) {
    this.line = line;
    this.edge = edge;
    this.effectedOutlines = new Map<Tile, TileOutline[]>();
    this.cityOutline = cityOutline;
  }

  public addEffectedOutlines(tile: Tile, tileOutline: TileOutline) {
    if (!this.effectedOutlines.has(tile)) {
      this.effectedOutlines.set(tile, []);
    }
    const tileOutlines = this.effectedOutlines.get(tile);
    tileOutlines.push(tileOutline);

    //this.effectedOutlines.set(tile, tileOutlines);
  }

  public getEffectedOutlines(): Map<Tile, TileOutline[]> {
    return this.effectedOutlines;
  }
}
