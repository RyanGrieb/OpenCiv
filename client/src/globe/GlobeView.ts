import * as THREE from "three";
import { Game } from "../Game";
import { WorldView } from "../scene/Camera";
import { GlobeCaps } from "./GlobeCaps";
import { GlobeMapLayer } from "./GlobeMapLayer";
import { GlobeProjection } from "./GlobeProjection";
import { PlanetMesh } from "./PlanetMesh";
import { SolarSystem } from "./SolarSystem";

// What of the map part of the screen shows, in world pixels, and the most screen pixels a world pixel covers there.
interface ViewBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  screenPixelsPerWorldPixel: number;
}

/**
 * The game's map wrapped around a globe, inside the solar system, drawn with three.js on a canvas
 * behind the game's (whose UI stays on top). The map isn't rebuilt in 3D: each frame the game draws
 * the part of it in view - terrain, units, borders, fog and all, just as on the flat map - into the
 * globe's canvases (see getWorldViews()), and the band between the polar caps samples them through
 * GlobeProjection as its texture.
 *
 * There are two canvases, each about the size of the screen: an overview of everything in view, and
 * a detailed one of the lower part of the screen, which the camera's tilt brings closest. Each is
 * drawn at about the screen's resolution for what it covers, so up close the map is as sharp as the
 * flat map, and a frame costs about the same however big the map is.
 */
export class GlobeView {
  public static readonly FOV = 45;
  private static readonly MAX_TEXTURE_SIZE = 4096;
  // Device pixels per CSS pixel from which the screen is sharp enough to draw the globe unsmoothed.
  private static readonly SHARP_SCREEN = 1.5;
  // Rays cast along each side of the screen to find what's in view.
  private static readonly EDGE_SAMPLES = 12;
  // World pixels drawn past what's in view, as the screen's edge bulges a little between the rays.
  private static readonly REGION_MARGIN = 48;
  // The detailed canvas covers the screen from this far down (0 the top, 1 the bottom).
  private static readonly DETAIL_FROM = 0.3;
  // It's only drawn when it would be this much sharper than the overview.
  private static readonly DETAIL_WORTHWHILE = 1.1;
  // Shows where the map's canvases are empty: past its top and bottom rows' points, under the caps.
  private static readonly BACKDROP_COLOR = 0xdde4e8;
  private static readonly SPACE_COLOR = 0x03040a;

  // Fragment shader additions for the band: the canvases' uniforms, the band point's position, and
  // a world point's place on a canvas - its x taken around the globe to the copy nearest the
  // canvas's middle.
  private static readonly BAND_FRAGMENT_HEADER = `
    uniform sampler2D overviewMap;
    uniform vec2 overviewOrigin;
    uniform float overviewScale;
    uniform vec2 overviewSize;
    uniform sampler2D detailMap;
    uniform vec2 detailOrigin;
    uniform float detailScale;
    uniform vec2 detailSize;
    uniform float detailShown;
    uniform float worldWidth;
    uniform float edgeMercator;
    uniform float rowStep;
    uniform vec3 backdropColor;
    varying vec3 vGlobePoint;

    vec2 mapLayerUv(vec2 world, vec2 origin, float scale, vec2 size) {
      float middle = origin.x + 0.5 * size.x / scale;
      world.x -= worldWidth * floor((world.x - middle) / worldWidth + 0.5);
      return (world - origin) * scale / size;
    }
  `;
  // GlobeProjection.toWorld() per pixel, then that world point on the canvases. The detailed one
  // fades into the overview toward its edges, so the change in sharpness doesn't show as a line.
  // Inside the map nothing is see-through (clouds cover the unexplored part), but where two of its
  // chunks meet between canvas pixels a GPU canvas leaves the pixels there partly covered - so
  // anything at least half covered counts as covered, or the backdrop would show as a faint seam.
  private static readonly BAND_MAP_FRAGMENT = `
    vec3 globePoint = normalize(vGlobePoint);
    float longitude = atan(globePoint.x, globePoint.z);
    float latitude = asin(clamp(globePoint.y, -1.0, 1.0));
    float mercator = log(tan(0.25 * PI + 0.5 * latitude));
    vec2 world = vec2(
      longitude / (2.0 * PI) * worldWidth + 16.0,
      16.0 + (edgeMercator - mercator) / rowStep * 25.0
    );
    vec4 mapColor = texture2D(overviewMap, mapLayerUv(world, overviewOrigin, overviewScale, overviewSize));
    vec2 detailUv = mapLayerUv(world, detailOrigin, detailScale, detailSize);
    vec2 fromEdge = min(detailUv, 1.0 - detailUv);
    float detail = detailShown * smoothstep(0.0, 0.05, min(fromEdge.x, fromEdge.y));
    mapColor = mix(mapColor, texture2D(detailMap, detailUv), detail);
    diffuseColor.rgb *= mix(backdropColor, mapColor.rgb, clamp(mapColor.a * 2.0, 0.0, 1.0));
  `;

  public readonly projection: GlobeProjection;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly planet = new THREE.Group();
  private readonly planetSphere: THREE.Sphere;
  private readonly solarSystem: SolarSystem;
  private readonly caps: PlanetMesh;
  private readonly bandGeometry: THREE.BufferGeometry;
  private readonly bandMaterial: THREE.MeshLambertMaterial;
  private readonly overview = new GlobeMapLayer();
  private readonly detail = new GlobeMapLayer();
  private readonly bandUniforms = {
    overviewMap: { value: null as THREE.Texture },
    overviewOrigin: { value: this.overview.origin },
    overviewScale: { value: 1 },
    overviewSize: { value: new THREE.Vector2(1, 1) },
    detailMap: { value: null as THREE.Texture },
    detailOrigin: { value: this.detail.origin },
    detailScale: { value: 1 },
    detailSize: { value: new THREE.Vector2(1, 1) },
    detailShown: { value: 0 },
    worldWidth: { value: 1 },
    edgeMercator: { value: 0 },
    rowStep: { value: 1 },
    backdropColor: { value: new THREE.Color(GlobeView.BACKDROP_COLOR) }
  };
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly ground = new THREE.Vector3();
  private readonly sideways = new THREE.Vector3();

  private worldViews: WorldView[] = [this.overview.view];
  private worldView: WorldView = this.overview.view;
  private screenWidth = 0;
  private screenHeight = 0;
  private lastFrame = performance.now();

  constructor(gridWidth: number, gridHeight: number) {
    this.projection = new GlobeProjection(gridWidth, gridHeight);
    this.bandUniforms.worldWidth.value = this.projection.worldWidth;
    this.bandUniforms.edgeMercator.value = this.projection.edgeMercator;
    this.bandUniforms.rowStep.value = this.projection.rowStep;

    // Smoothing the planet's edge is worth its cost only on screens with big pixels.
    this.renderer = new THREE.WebGLRenderer({ antialias: window.devicePixelRatio < GlobeView.SHARP_SCREEN });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const canvas = this.renderer.domElement;
    canvas.id = "globe-canvas";
    // Behind the game canvas, which draws the UI over the globe and takes the mouse: both are
    // positioned, so the one first in the page is drawn first, over the page's background.
    Object.assign(canvas.style, { position: "fixed", left: "0", top: "0", pointerEvents: "none" });
    const gameCanvas = Game.getInstance().getCanvas();
    gameCanvas.parentElement.insertBefore(canvas, gameCanvas);

    this.camera = new THREE.PerspectiveCamera(GlobeView.FOV, 1, 0.001, 6000);
    this.scene.background = new THREE.Color(GlobeView.SPACE_COLOR);
    this.scene.add(this.camera);
    // A light riding on the camera, so whatever side of the planet you look at is lit.
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const headlight = new THREE.DirectionalLight(0xffffff, 1.9);
    headlight.position.set(0.4, 0.6, 1);
    this.camera.add(headlight, headlight.target);
    headlight.target.position.set(0, 0, -1);

    this.planet.position.set(SolarSystem.HOME_ORBIT, 0, 0);
    this.scene.add(this.planet);
    this.planetSphere = new THREE.Sphere(this.planet.position.clone(), 1);
    this.solarSystem = new SolarSystem(this.planet);
    this.scene.add(this.solarSystem.group);

    this.fitToScreen();
    this.bandGeometry = this.createBandGeometry();
    this.bandMaterial = this.createBandMaterial();
    this.planet.add(new THREE.Mesh(this.bandGeometry, this.bandMaterial));
    this.caps = GlobeCaps.build(this.projection);
    this.planet.add(this.caps.group);
  }

  private static smoothstep(from: number, to: number, value: number) {
    const t = Math.max(0, Math.min(1, (value - from) / (to - from)));
    return t * t * (3 - 2 * t);
  }

  /** The canvases the game draws the map into this frame - see Camera.getWorldViews(). */
  public getWorldViews(): WorldView[] {
    return this.worldViews;
  }

  public useWorldView(index: number) {
    this.worldView = this.worldViews[index];
  }

  /** The canvas the map is being drawn into - see Camera.getWorldView(). */
  public getWorldView(): WorldView {
    return this.worldView;
  }

  /**
   * Points the camera at a longitude and latitude from `altitude` planet radii away, tilted
   * `tilt` radians from straight down toward the north. Far out, the view swings toward the sun.
   */
  public placeCamera(longitude: number, latitude: number, altitude: number, tilt: number) {
    const surface = new THREE.Vector3(...GlobeProjection.unitVector(longitude, latitude));
    const north = new THREE.Vector3(0, 1, 0).addScaledVector(surface, -surface.y).normalize();
    const anchor = surface.clone().add(this.planet.position);
    const offset = surface
      .clone()
      .multiplyScalar(Math.cos(tilt))
      .addScaledVector(north, -Math.sin(tilt))
      .multiplyScalar(altitude);
    this.camera.position.copy(anchor).add(offset);

    // Zoomed far out, the view slides over to center on the sun, framing the whole system, and turns
    // from the planet's north being up to the system's.
    const toSun = GlobeView.smoothstep(Math.log(6), Math.log(90), Math.log(altitude));
    this.camera.up
      .copy(north)
      .lerp(new THREE.Vector3(0, 1, 0), toSun)
      .normalize();
    this.camera.lookAt(anchor.lerp(this.solarSystem.sun.position, toSun));

    this.camera.near = Math.max(0.0005, altitude * Math.cos(tilt) * 0.05);
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
  }

  /** Readies a frame once the camera is placed: works out what's in view and clears the canvases for it. */
  public beginFrame() {
    const now = performance.now();
    this.solarSystem.update(Math.min(0.1, (now - this.lastFrame) / 1000));
    this.lastFrame = now;

    this.fitToScreen();
    this.updateLayers();
  }

  /** Draws the globe, with the map the game drew into its canvases since beginFrame(). */
  public render() {
    this.overview.upload();
    if (this.worldViews.length > 1) this.detail.upload();
    this.renderer.render(this.scene, this.camera);
  }

  /** The world point under a point on screen (in CSS pixels), or undefined off the globe. */
  public pick(screenX: number, screenY: number): [number, number] | undefined {
    const ground = this.groundAt((screenX / this.screenWidth) * 2 - 1, 1 - (screenY / this.screenHeight) * 2, false);
    return ground ? this.projection.toWorld(ground[0], ground[1]) : undefined;
  }

  public setVisible(visible: boolean) {
    this.renderer.domElement.style.display = visible ? "" : "none";
  }

  public dispose() {
    this.caps.dispose();
    this.bandGeometry.dispose();
    this.bandMaterial.dispose();
    this.overview.dispose();
    this.detail.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }

  // Follows the window's size, and sizes the canvases to cover the screen at its resolution.
  private fitToScreen() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (width === this.screenWidth && height === this.screenHeight) return;

    this.screenWidth = width;
    this.screenHeight = height;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    const largest = Math.min(GlobeView.MAX_TEXTURE_SIZE, this.renderer.capabilities.maxTextureSize);
    const canvasWidth = Math.min(largest, Math.ceil(width * this.renderer.getPixelRatio()));
    const canvasHeight = Math.min(largest, Math.ceil(height * this.renderer.getPixelRatio()));
    this.overview.setSize(canvasWidth, canvasHeight);
    this.detail.setSize(canvasWidth, canvasHeight);
    this.bandUniforms.overviewMap.value = this.overview.texture;
    this.bandUniforms.overviewSize.value.set(canvasWidth, canvasHeight);
    this.bandUniforms.detailMap.value = this.detail.texture;
    this.bandUniforms.detailSize.value.set(canvasWidth, canvasHeight);
  }

  // The sphere between the map's top row's highest point and its bottom row's lowest. Its shape
  // only - the shader works out what of the map each pixel shows from its position.
  private createBandGeometry() {
    const top = this.projection.latitudeAt(0);
    const bottom = this.projection.latitudeAt(this.projection.worldHeight);
    return new THREE.SphereGeometry(
      1,
      this.projection.gridWidth * 4,
      this.projection.gridHeight * 2,
      0,
      2 * Math.PI,
      Math.PI / 2 - top,
      top - bottom
    );
  }

  // Lit like the caps (and the prototype's planets), its color from the map's canvases. Pushed back
  // a little, so the caps win where they cover the gaps between the map's pointed top and bottom tiles.
  private createBandMaterial() {
    const material = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.bandUniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vGlobePoint;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvGlobePoint = position;");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", `#include <common>\n${GlobeView.BAND_FRAGMENT_HEADER}`)
        .replace("#include <map_fragment>", GlobeView.BAND_MAP_FRAGMENT);
    };
    return material;
  }

  // Picks the part of the map each canvas covers this frame, and the scale it's drawn at.
  private updateLayers() {
    const overviewBounds = this.measureView(0) ?? this.wholeMap();
    const overviewScale = this.scaleFor(this.overview, overviewBounds);
    this.place(this.overview, overviewBounds, overviewScale);

    const detailBounds = this.measureView(GlobeView.DETAIL_FROM);
    const detailScale = detailBounds ? this.scaleFor(this.detail, detailBounds) : 0;
    const detailShown = detailScale > overviewScale * GlobeView.DETAIL_WORTHWHILE;
    if (detailShown) this.place(this.detail, detailBounds, detailScale);

    this.worldViews = detailShown ? [this.overview.view, this.detail.view] : [this.overview.view];
    this.worldView = this.overview.view;
    this.bandUniforms.overviewScale.value = this.overview.scale;
    this.bandUniforms.detailScale.value = this.detail.scale;
    this.bandUniforms.detailShown.value = detailShown ? 1 : 0;
  }

  // Past the map's top and bottom rows lie only the caps, which need no canvas.
  private scaleFor(layer: GlobeMapLayer, bounds: ViewBounds) {
    const margin = GlobeView.REGION_MARGIN;
    const top = Math.max(bounds.top, 0);
    const bottom = Math.min(bounds.bottom, this.projection.worldHeight);
    return layer.scaleFor(
      bounds.right - bounds.left + 2 * margin,
      Math.max(0, bottom - top) + 2 * margin,
      bounds.screenPixelsPerWorldPixel
    );
  }

  // Centers a canvas on what's in view - kept over the map where it has room to spare.
  private place(layer: GlobeMapLayer, bounds: ViewBounds, scale: number) {
    const margin = GlobeView.REGION_MARGIN;
    const span = layer.getHeight() / scale;
    const highest = span / 2 - margin;
    const lowest = this.projection.worldHeight + margin - span / 2;
    const middleY = (bounds.top + bounds.bottom) / 2;
    layer.cover(
      (bounds.left + bounds.right) / 2,
      highest > lowest ? this.projection.worldHeight / 2 : Math.min(Math.max(middleY, highest), lowest),
      scale
    );
  }

  // What of the map the screen shows from `fromTop` down (0 the whole screen), found by casting rays
  // along that part's edges; where they pass the globe, its horizon in their direction counts.
  // Undefined when the part takes in a pole, and so every longitude.
  private measureView(fromTop: number): ViewBounds | undefined {
    const projection = this.projection;
    const middle = this.groundAt(0, 1 - (fromTop + 1), true);
    if (!middle) return undefined;
    const middleX = projection.toWorld(middle[0], middle[1])[0];

    const bounds: ViewBounds = {
      left: Infinity,
      right: -Infinity,
      top: Infinity,
      bottom: -Infinity,
      screenPixelsPerWorldPixel: 0
    };
    const samples = GlobeView.EDGE_SAMPLES * 4;
    const bufferWidth = this.screenWidth * this.renderer.getPixelRatio();
    const bufferHeight = this.screenHeight * this.renderer.getPixelRatio();
    let previous: [number, number, number, number, number] | undefined;
    let winding = 0;

    for (let i = 0; i <= samples; i++) {
      // Around the edge: the top left to right, down the right, the bottom back, up the left.
      const side = Math.floor((i % samples) / GlobeView.EDGE_SAMPLES);
      const along = (i % GlobeView.EDGE_SAMPLES) / GlobeView.EDGE_SAMPLES;
      const u = [along, 1, 1 - along, 0][side];
      const v = fromTop + (1 - fromTop) * [0, along, 1, 1 - along][side];
      const ground = this.groundAt(u * 2 - 1, 1 - v * 2, true);
      if (!ground) continue;

      const [x, y] = projection.toWorld(ground[0], ground[1]);
      const worldX = x - projection.worldWidth * Math.round((x - middleX) / projection.worldWidth);
      bounds.left = Math.min(bounds.left, worldX);
      bounds.right = Math.max(bounds.right, worldX);
      bounds.top = Math.min(bounds.top, y);
      bounds.bottom = Math.max(bounds.bottom, y);

      if (previous) {
        const [previousU, previousV, previousX, previousY, previousLongitude] = previous;
        winding += Math.atan2(Math.sin(ground[0] - previousLongitude), Math.cos(ground[0] - previousLongitude));
        const screenDistance = Math.hypot((u - previousU) * bufferWidth, (v - previousV) * bufferHeight);
        const worldDistance = Math.hypot(worldX - previousX, y - previousY);
        if (worldDistance > 0) {
          bounds.screenPixelsPerWorldPixel = Math.max(bounds.screenPixelsPerWorldPixel, screenDistance / worldDistance);
        }
      }
      previous = [u, v, worldX, y, ground[0]];
    }

    // Going once around the edge went once around a pole.
    if (Math.abs(winding) > Math.PI || bounds.right - bounds.left > projection.worldWidth * 0.9) return undefined;
    return bounds;
  }

  // The whole map, with its seam on the far side of the globe from the camera.
  private wholeMap(): ViewBounds {
    const projection = this.projection;
    const toCamera = this.camera.position.clone().sub(this.planet.position).normalize();
    const [middleX] = projection.toWorld(Math.atan2(toCamera.x, toCamera.z), Math.asin(toCamera.y));
    return {
      left: middleX - projection.worldWidth / 2,
      right: middleX + projection.worldWidth / 2,
      top: 0,
      bottom: projection.worldHeight,
      screenPixelsPerWorldPixel: Infinity
    };
  }

  /**
   * The longitude and latitude where the camera's ray through a point on screen (-1 to 1 each way, y
   * up) first meets the globe. A ray that passes it misses, or with `orHorizon` takes the point on the
   * horizon in its direction: where the line from the camera in the plane through the ray and the
   * planet's center just touches the planet.
   */
  private groundAt(screenX: number, screenY: number, orHorizon: boolean): [number, number] | undefined {
    this.pointer.set(screenX, screenY);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const ray = this.raycaster.ray;
    const center = this.planetSphere.center;
    const ground = this.ground;

    if (ray.intersectSphere(this.planetSphere, ground)) {
      ground.sub(center);
    } else {
      if (!orHorizon) return undefined;

      const toCenter = ground.copy(center).sub(ray.origin);
      const distance = toCenter.length();
      toCenter.divideScalar(distance);
      const sideways = this.sideways.copy(ray.direction).addScaledVector(toCenter, -ray.direction.dot(toCenter));
      if (sideways.lengthSq() < 1e-12) return undefined;
      sideways.normalize();

      // The planet's radius is 1, so the line touches it at asin(1 / distance) off the center.
      const sin = 1 / distance;
      const reach = Math.sqrt(distance * distance - 1);
      toCenter.multiplyScalar(Math.sqrt(1 - sin * sin) * reach).addScaledVector(sideways, sin * reach);
      ground.add(ray.origin).sub(center);
    }

    ground.normalize();
    return [Math.atan2(ground.x, ground.z), Math.asin(Math.max(-1, Math.min(1, ground.y)))];
  }
}
