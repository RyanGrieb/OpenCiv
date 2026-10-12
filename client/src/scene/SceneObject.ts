export interface SceneObject {
  draw(canvasContext: CanvasRenderingContext2D): void;
  getZIndex(): number;
  setZValue(value: number): void;
  /**
   * Whatever changes how it draws besides its own position, size, image and color (or a line's ends
   * and color) - for copies of the map that are drawn again only when something on them changes (the
   * globe's ground). Most things need none.
   */
  getDrawState?(): number | string;
}
