export class Camera {
  //TODO: Implement zoom: https://stackoverflow.com/questions/5189968/zoom-canvas-to-mouse-cursor/5526721#5526721

  private x: number;
  private y: number;

  private xVelAmount: number;
  private yVelAmount: number;

  constructor() {
    this.x = 0;
    this.y = 0;
    this.xVelAmount = 0;
    this.yVelAmount = 0;
  }
  public addVel(x: number, y: number) {
    this.xVelAmount += x;
    this.yVelAmount += y;
  }

  public getX() {
    return this.x;
  }

  public getY() {
    return this.y;
  }

  public setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public updateOffset() {
    if (this.xVelAmount) {
      this.x += this.xVelAmount;
    }

    if (this.yVelAmount) {
      this.y += this.yVelAmount;
    }
  }
}
