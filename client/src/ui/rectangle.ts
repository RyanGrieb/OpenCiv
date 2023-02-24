export interface RectangleOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export class Rectangle {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public color: string;
  constructor(options: RectangleOptions) {
    this.x = options.x;
    this.y = options.y;
    this.width = options.width;
    this.height = options.height;
    this.color = options.color;
  }
}
