export interface SceneObject {
  draw(canvasContext: CanvasRenderingContext2D): void;
  getZIndex(): number;
  setZValue(value: number): void;
}
