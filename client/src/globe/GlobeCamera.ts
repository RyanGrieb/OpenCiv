import { Game } from "../Game";
import { Camera, WorldView } from "../scene/Camera";
import { GlobeView } from "./GlobeView";

/**
 * The in-game camera when the map is a globe (see GlobeView). It looks down at a longitude and
 * latitude from some altitude, tilting toward the horizon close to the ground like Civ's camera.
 * Drag to turn the globe, scroll or +/- to zoom (out past the planet to the whole solar system),
 * and the arrow keys pan. Everything else that asks the camera about the map - drawing it, finding the
 * tile under the mouse, focusing on a tile - goes through the globe rather than a flat pan and zoom.
 */
export class GlobeCamera extends Camera {
  private static readonly MAX_ALTITUDE = 260;
  // The closest the camera comes, in tile widths above the ground at the equator: about the flat map's
  // closest zoom. Tiles shrink toward the poles, so it may come closer there.
  private static readonly CLOSEST_TILES = 7;
  // Below this many times its closest, the camera tilts toward the horizon, up to MAX_TILT radians.
  private static readonly TILT_UNTIL = 4;
  private static readonly MAX_TILT = 0.6;
  // The furthest north or south the camera looks: past the map's edge, onto the polar caps.
  private static readonly MAX_LATITUDE = 1.35;
  // How much of the way to its target the camera moves each frame, like the flat map's camera.
  private static readonly EASING = 0.3;
  private static readonly WHEEL_ZOOM = 1.25;
  // Zooming toward the mouse stops this far out, where the view starts to take in the solar system.
  private static readonly ZOOM_TO_MOUSE_UNTIL = 3;
  // Screen pixels of ground the arrow keys pan by each frame.
  private static readonly KEY_PAN_PIXELS = 10;
  private static readonly PAN_KEYS: Record<string, [number, number]> = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, 1],
    ArrowDown: [0, -1]
  };

  private readonly globe: GlobeView;
  private longitude = 0;
  private latitude = 0;
  private altitude = 1;
  private targetLongitude = 0;
  private targetLatitude = 0;
  private targetAltitude = 1;
  private dragging = false;
  private lastPointer: [number, number] = [0, 0];
  private readonly heldKeys = new Set<string>();
  // The last screenToWorld() answer, as every actor asks it about the same mouse position.
  private pickedAt: [number, number] = [NaN, NaN];
  private picked: [number, number] | undefined;

  constructor(gridWidth: number, gridHeight: number) {
    super({ wasd_controls: false, mouse_controls: false, arrow_controls: false });
    this.globe = new GlobeView(gridWidth, gridHeight);
    this.listen();
  }

  // The shorter way round from one longitude to another, in radians.
  private static angleBetween(from: number, to: number) {
    return Math.atan2(Math.sin(to - from), Math.cos(to - from));
  }

  /** Flies to a world point, from as high as shows it at the flat map's `zoomAmount`. */
  public zoomToLocation(x: number, y: number, zoomAmount: number) {
    const [longitude, latitude] = this.globe.projection.toSphere(x, y);
    this.targetLongitude = longitude;
    this.targetLatitude = Math.max(-GlobeCamera.MAX_LATITUDE, Math.min(GlobeCamera.MAX_LATITUDE, latitude));
    this.targetAltitude = this.clampAltitude(
      this.altitudeForZoom(zoomAmount, this.targetLatitude),
      this.targetLatitude
    );
  }

  /** zoomToLocation() without the flight. */
  public jumpToLocation(x: number, y: number, zoomAmount: number) {
    this.zoomToLocation(x, y, zoomAmount);
    this.longitude = this.targetLongitude;
    this.latitude = this.targetLatitude;
    this.altitude = this.targetAltitude;
  }

  /** The world point the camera is headed to look at. */
  public getTargetLocation(): [number, number] {
    return this.globe.projection.toWorld(this.targetLongitude, this.targetLatitude);
  }

  /** The flat map's zoom that shows the ground in view at the size it is now. */
  public getZoomAmount() {
    return this.zoomForAltitude(this.altitude, this.latitude);
  }

  /** The flat map's zoom for where the camera is headed, as getZoomAmount() is for where it is. */
  public getTargetZoomAmount() {
    return this.zoomForAltitude(this.targetAltitude, this.targetLatitude);
  }

  // The +/- keys, through Camera: in by `amount` times, or out.
  public zoom(atX: number, atY: number, amount: number) {
    this.targetAltitude = this.clampAltitude(this.targetAltitude / amount, this.targetLatitude);
  }

  public updateOffset() {
    this.panWithKeys();

    const easing = GlobeCamera.EASING;
    this.targetAltitude = this.clampAltitude(this.targetAltitude, this.targetLatitude);
    this.longitude += GlobeCamera.angleBetween(this.longitude, this.targetLongitude) * easing;
    this.latitude += (this.targetLatitude - this.latitude) * easing;
    this.altitude = Math.exp(
      Math.log(this.altitude) + (Math.log(this.targetAltitude) - Math.log(this.altitude)) * easing
    );

    this.globe.placeCamera(this.longitude, this.latitude, this.altitude, this.tilt());
    this.globe.beginFrame();
    this.pickedAt = [NaN, NaN];
  }

  public getWorldViews(): WorldView[] {
    return this.globe.getWorldViews();
  }

  public useWorldView(index: number) {
    this.globe.useWorldView(index);
  }

  public getWorldView(): WorldView {
    return this.globe.getWorldView();
  }

  public screenToWorld(screenX: number, screenY: number): [number, number] | undefined {
    if (screenX !== this.pickedAt[0] || screenY !== this.pickedAt[1]) {
      this.pickedAt = [screenX, screenY];
      this.picked = this.globe.pick(screenX, screenY);
    }
    return this.picked;
  }

  public rendersWorldOffscreen() {
    return true;
  }

  public presentWorld(visible: boolean) {
    this.globe.setVisible(visible);
    if (visible) this.globe.render();
  }

  /** Shows or hides the globe, for switching between it and the flat map. */
  public setVisible(visible: boolean) {
    this.globe.setVisible(visible);
  }

  public dispose() {
    this.globe.dispose();
  }

  private listen() {
    this.onSceneInput("mousedown", (options) => {
      if (options.button !== 0 || this.isLocked()) return;
      this.dragging = true;
      this.lastPointer = [options.clientX, options.clientY];
    });
    this.onSceneInput("mousemove", (options) => {
      if (!this.dragging) return;
      this.drag(options.clientX - this.lastPointer[0], options.clientY - this.lastPointer[1]);
      this.lastPointer = [options.clientX, options.clientY];
    });
    this.onSceneInput("mouseup", () => (this.dragging = false));
    this.onSceneInput("mouseleave", () => (this.dragging = false));
    this.onSceneInput("wheel", (options) => {
      if (this.isLocked() || !options.deltaY) return;
      this.zoomAt(options.x, options.y, options.deltaY < 0 ? GlobeCamera.WHEEL_ZOOM : 1 / GlobeCamera.WHEEL_ZOOM);
    });
    this.onSceneInput("keydown", (options) => {
      if (GlobeCamera.PAN_KEYS[options.key]) this.heldKeys.add(options.key);
    });
    // Whichever camera is in use, so a key let go after switching to the flat map doesn't stay held.
    Game.getInstance()
      .getCurrentScene()
      .on("keyup", (options) => this.heldKeys.delete(options.key));
  }

  // Zooms in by `amount` times (or out), keeping the ground under the mouse there, as the flat map does.
  private zoomAt(screenX: number, screenY: number, amount: number) {
    const ground = this.globe.pick(screenX, screenY);
    if (ground && this.targetAltitude < GlobeCamera.ZOOM_TO_MOUSE_UNTIL) {
      const [longitude, latitude] = this.globe.projection.toSphere(ground[0], ground[1]);
      const pull = 1 - 1 / amount;
      this.targetLongitude += GlobeCamera.angleBetween(this.targetLongitude, longitude) * pull;
      this.targetLatitude += (latitude - this.targetLatitude) * pull;
      this.targetLatitude = Math.max(
        -GlobeCamera.MAX_LATITUDE,
        Math.min(GlobeCamera.MAX_LATITUDE, this.targetLatitude)
      );
    }
    this.targetAltitude = this.clampAltitude(this.targetAltitude / amount, this.targetLatitude);
  }

  // Turns the globe with the mouse: the ground moves about as far as the mouse did.
  private drag(dx: number, dy: number) {
    const radiansPerPixel = this.groundPerPixel();
    this.longitude -= (dx * radiansPerPixel) / Math.max(0.2, Math.cos(this.latitude));
    this.latitude = Math.max(
      -GlobeCamera.MAX_LATITUDE,
      Math.min(GlobeCamera.MAX_LATITUDE, this.latitude + dy * radiansPerPixel)
    );
    this.targetLongitude = this.longitude;
    this.targetLatitude = this.latitude;
  }

  private panWithKeys() {
    if (this.heldKeys.size === 0 || this.isLocked()) return;

    const step = this.groundPerPixel() * GlobeCamera.KEY_PAN_PIXELS;
    for (const key of this.heldKeys) {
      const [east, north] = GlobeCamera.PAN_KEYS[key];
      this.targetLongitude += (east * step) / Math.max(0.2, Math.cos(this.targetLatitude));
      this.targetLatitude = Math.max(
        -GlobeCamera.MAX_LATITUDE,
        Math.min(GlobeCamera.MAX_LATITUDE, this.targetLatitude + north * step)
      );
    }
  }

  // Radians of the globe's surface one screen pixel spans, straight below the camera; capped, so the
  // planet doesn't spin wildly when it's a speck far away.
  private groundPerPixel() {
    const perPixel = (2 * this.altitude * Math.tan((GlobeView.FOV / 2) * (Math.PI / 180))) / window.innerHeight;
    return Math.min(perPixel, 0.01);
  }

  private tilt() {
    const closest = this.closestAltitude(this.latitude);
    const t = (this.altitude - closest) / (closest * (GlobeCamera.TILT_UNTIL - 1));
    const far = Math.max(0, Math.min(1, t));
    return GlobeCamera.MAX_TILT * (1 - far * far * (3 - 2 * far));
  }

  private closestAltitude(latitude: number) {
    const tileWidth = (2 * Math.PI) / this.globe.projection.gridWidth;
    return GlobeCamera.CLOSEST_TILES * tileWidth * Math.max(0.3, Math.cos(latitude));
  }

  private clampAltitude(altitude: number, latitude: number) {
    return Math.max(this.closestAltitude(latitude), Math.min(GlobeCamera.MAX_ALTITUDE, altitude));
  }

  // The flat map's zoom is CSS pixels per world pixel; here, a world pixel's arc over the distance
  // it's seen from, in CSS pixels.
  private zoomForAltitude(altitude: number, latitude: number) {
    return this.pixelsPerRadianAt(altitude) * this.radiansPerWorldPixel(latitude);
  }

  private altitudeForZoom(zoomAmount: number, latitude: number) {
    return (this.pixelsPerRadianAt(1) * this.radiansPerWorldPixel(latitude)) / zoomAmount;
  }

  private pixelsPerRadianAt(distance: number) {
    return window.innerHeight / 2 / Math.tan((GlobeView.FOV / 2) * (Math.PI / 180)) / distance;
  }

  private radiansPerWorldPixel(latitude: number) {
    return ((2 * Math.PI) / this.globe.projection.worldWidth) * Math.cos(latitude);
  }
}
