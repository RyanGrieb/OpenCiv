import { Game } from "../Game";
import { Vector } from "../util/Vector";
import { SceneObject } from "./SceneObject";

export interface LineOptions {
  color: string;
  girth: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  z?: number;
  transparency?: number;
}

export class Line implements SceneObject {
  private color: string;
  private girth: number;
  private x1: number;
  private y1: number;
  private x2: number;
  private y2: number;
  private z: number;
  private transparency: number;
  private originalPositions: Vector[];

  constructor(options: LineOptions) {
    this.color = options.color;
    this.girth = options.girth;
    this.x1 = options.x1;
    this.y1 = options.y1;
    this.x2 = options.x2;
    this.y2 = options.y2;
    this.z = options.z ?? 0;
    this.transparency = options.transparency ?? 1;

    this.originalPositions = [];
    this.originalPositions.push(
      new Vector(this.x1, this.y1),
      new Vector(this.x2, this.y2)
    );
  }

  public increaseDistance(amount: number) {
    const dx = this.x2 - this.x1;
    const dy = this.y2 - this.y1;
    const currentDistance = Math.sqrt(dx * dx + dy * dy);

    const unitVectorX = dx / currentDistance;
    const unitVectorY = dy / currentDistance;

    const newDistance = currentDistance + amount;

    this.x1 -= unitVectorX * (amount / 2);
    this.y1 -= unitVectorY * (amount / 2);
    this.x2 = this.x1 + unitVectorX * newDistance;
    this.y2 = this.y1 + unitVectorY * newDistance;
  }

  public setPosition(options: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }) {
    this.x1 = options.x1;
    this.y1 = options.y1;
    this.x2 = options.x2;
    this.y2 = options.y2;
  }

  public setToOriginalPositions() {
    if (this.originalPositions.length < 1) return;

    this.x1 = this.originalPositions[0].x;
    this.y1 = this.originalPositions[0].y;
    this.x2 = this.originalPositions[1].x;
    this.y2 = this.originalPositions[1].y;
  }

  public getVectors() {
    const vectors: Vector[] = [];
    vectors.push(new Vector(this.x1, this.y1));
    vectors.push(new Vector(this.x2, this.y2));
    return vectors;
  }

  public setGirth(girth: number) {
    this.girth = girth;
  }

  public getTransparency() {
    return this.transparency;
  }

  public getZIndex(): number {
    return this.z;
  }

  public setZValue(value: number): void {
    this.z = value;
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
