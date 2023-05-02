import { Game } from "../Game";

export interface LineOptions {
  color: string;
  girth: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export class Line {
  color: string;
  girth: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;

  constructor(options: LineOptions) {
    this.color = options.color;
    this.girth = options.girth;
    this.x1 = options.x1;
    this.y1 = options.y1;
    this.x2 = options.x2;
    this.y2 = options.y2;
  }

  public draw(canvasContext: CanvasRenderingContext2D) {
    Game.drawLine(this, canvasContext);
  }

  public getColor(): string {
    return this.color;
  }

  public getGirth(): number {
    return this.girth;
  }

  public getX1(): number {
    return this.x1;
  }

  public getY1(): number {
    return this.y1;
  }

  public getX2(): number {
    return this.x2;
  }

  public getY2(): number {
    return this.y2;
  }
}
