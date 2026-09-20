import { Game } from "../Game";

// East-west map wrapping. Whether a map wraps is the server's GameOptions.wrapMap, sent with mapSize.
export class MapWrap {
  // Caps the per-frame cost when zoomed far out.
  private static readonly MAX_DRAW_COPIES = 5;
  private static readonly NO_OFFSETS = [0];

  private static gridWidth = 0;
  private static worldWidth = 0;
  private static wrapped = false;

  public static init(gridWidth: number, tileWidth: number, wrapped: boolean) {
    MapWrap.gridWidth = gridWidth;
    MapWrap.worldWidth = gridWidth * tileWidth;
    MapWrap.wrapped = wrapped;
  }

  /** Whether this map's east and west edges are adjacent, per the server. */
  public static isWrapped() {
    return MapWrap.wrapped && MapWrap.worldWidth > 0;
  }

  public static getWorldWidth() {
    return MapWrap.worldWidth;
  }

  // World-x offsets to repeat camera-space objects at; always at least [0] (the unwrapped case).
  public static getDrawOffsets(): number[] {
    if (!MapWrap.isWrapped()) return MapWrap.NO_OFFSETS;

    const game = Game.getInstance();
    const camera = game.getCurrentScene()?.getCamera();
    if (!camera) return MapWrap.NO_OFFSETS;

    const zoom = camera.getZoomAmount();
    if (!(zoom > 0)) return MapWrap.NO_OFFSETS;

    const width = MapWrap.worldWidth;
    const viewLeft = -camera.getX() / zoom;
    const viewRight = (game.getWidth() / game.getDPR() - camera.getX()) / zoom;

    const first = Math.floor(viewLeft / width);
    const last = Math.floor(viewRight / width);
    if (!Number.isFinite(first) || !Number.isFinite(last)) return MapWrap.NO_OFFSETS;

    const offsets: number[] = [];
    for (let copy = first; copy <= last && offsets.length < MapWrap.MAX_DRAW_COPIES; copy++) {
      offsets.push(copy * width);
    }

    return offsets.length > 0 ? offsets : MapWrap.NO_OFFSETS;
  }

  // Whole worlds needed to bring the viewport's left edge back into the first copy. A count, not a
  // distance: the camera and its lerp target sit at different zooms mid-zoom and convert separately.
  public static cameraWrapCopies(cameraX: number, zoom: number) {
    if (!MapWrap.isWrapped() || !(zoom > 0)) return 0;

    const copies = Math.floor(-cameraX / zoom / MapWrap.worldWidth);
    return Number.isFinite(copies) ? copies : 0;
  }

  // Snaps zoom so one world is a whole number of device pixels; at a fractional width the copies'
  // edges antialias against the background and show a seam.
  public static snapZoom(zoom: number) {
    if (!MapWrap.isWrapped() || !(zoom > 0)) return zoom;

    const pixelsPerWorld = MapWrap.worldWidth * Game.getInstance().getDPR();
    const snapped = Math.round(zoom * pixelsPerWorld) / pixelsPerWorld;

    return snapped > 0 ? snapped : zoom;
  }

  /** Shifts a camera x by whole worlds to land on whichever copy sits nearest `nearX`. */
  public static nearestCameraX(cameraX: number, nearX: number, zoom: number) {
    if (!MapWrap.isWrapped() || !(zoom > 0)) return cameraX;

    const period = MapWrap.worldWidth * zoom;
    return cameraX - Math.round((cameraX - nearX) / period) * period;
  }

  // Brings a world x into the first copy, so a point past either edge names a real tile.
  public static wrapWorldX(x: number) {
    if (!MapWrap.isWrapped()) return x;

    const width = MapWrap.worldWidth;
    return ((x % width) + width) % width;
  }

  /** Signed world-x distance from one point to another, going around the seam when that is shorter. */
  public static shortestDeltaX(fromX: number, toX: number) {
    const delta = toX - fromX;
    if (!MapWrap.isWrapped()) return delta;

    const width = MapWrap.worldWidth;
    return delta - Math.round(delta / width) * width;
  }

  // Grid-space x wrap for adjacency; returns gridX untouched when off, for callers to reject.
  public static wrapGridX(gridX: number) {
    if (!MapWrap.isWrapped()) return gridX;

    const width = MapWrap.gridWidth;
    return ((gridX % width) + width) % width;
  }

  /** Signed grid-x delta, going around the seam when that is shorter. */
  public static shortestGridDeltaX(deltaX: number) {
    if (!MapWrap.isWrapped()) return deltaX;

    const width = MapWrap.gridWidth;
    return deltaX - Math.round(deltaX / width) * width;
  }
}
