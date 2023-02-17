export interface RectangleOptions {
    x: number;
    y: number;
    width: number;
    height: number;
  }
  
  export class Rectangle {
    public x: number;
    public y: number;
    public width: number;
    public height: number;
    constructor(options: RectangleOptions) {
        this.x = options.x;
        this.y = options.y;
        this.width = options.width;
        this.height = options.height;
    }


  }