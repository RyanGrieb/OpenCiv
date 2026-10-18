import * as THREE from "three";
import { Game } from "../Game";
import { Actor } from "../scene/Actor";
import { WorldView } from "../scene/Camera";
import { Line } from "../scene/Line";
import { Marking } from "../scene/Marking";
import { SceneObject } from "../scene/SceneObject";
import { FrameSignature } from "./FrameSignature";
import { GlobeCaps } from "./GlobeCaps";
import { GlobeGround } from "./GlobeGround";
import { GlobeLines } from "./GlobeLines";
import { GlobeDecals } from "./GlobeDecals";
import { GlobeProjection } from "./GlobeProjection";
import { GlobeSprites } from "./GlobeSprites";
import { PixelArtSampling } from "./PixelArtSampling";
import { PlanetMesh } from "./PlanetMesh";
import { SolarSystem } from "./SolarSystem";

/**
 * The game's map wrapped around a globe, inside the solar system, drawn with three.js on a canvas
 * behind the game's (whose UI stays on top). The map isn't rebuilt in 3D: the game draws it with
 * its usual drawing code, just not onto the screen. What lies on the ground - terrain, fog, territory
 * and the like - goes into a texture of the whole world, a texel to each world pixel (see GlobeGround),
 * which the band between the polar caps samples through GlobeProjection, but for its lines - borders,
 * outlines, paths - which lie on it as strips, sharp however close (see GlobeLines); what stands up
 * off it - trees, mountains' peaks, cities, units, labels - stands up off the globe as billboards (see
 * GlobeSprites). Each is drawn again only where what's on it changes, so a frame of the globe
 * mostly costs the GPU drawing the planet, not the game drawing the map.
 */
export class GlobeView {
  public static readonly FOV = 45;
  // The biggest texture the sprites' atlases grow to (the ground's takes what the GPU allows).
  private static readonly MAX_TEXTURE_SIZE = 4096;
  private static readonly MAX_ANISOTROPY = 4;
  // Device pixels per CSS pixel from which the screen is sharp enough to draw the globe unsmoothed.
  private static readonly SHARP_SCREEN = 1.5;
  // The headlight's direction, toward it from what it lights, in the camera's space (three.js lights
  // a DirectionalLight's surfaces toward its position from its target).
  private static readonly HEADLIGHT = new THREE.Vector3(0.4, 0.6, 2).normalize();
  // Shows where the map's texture is empty: past its top and bottom rows' points, under the caps.
  private static readonly BACKDROP_COLOR = 0xdde4e8;
  private static readonly SPACE_COLOR = 0x03040a;

  // Fragment shader additions for the band: the ground's uniforms, the band point's position, and
  // the pixel-art sampler.
  private static readonly BAND_FRAGMENT_HEADER = `
    uniform sampler2D groundMap;
    uniform vec2 groundSize;
    uniform float groundScale;
    uniform float worldWidth;
    uniform float edgeMercator;
    uniform float rowStep;
    uniform vec3 backdropColor;
    varying vec3 vGlobePoint;
    ${PixelArtSampling.GLSL}

    // How far a point on the ground's texture moves to the next pixel on screen - taken the short
    // way round, as the texture wraps around the globe and x jumps back to 0 where it meets itself.
    vec2 groundStep(vec2 step) {
      step.x -= groundSize.x * floor(step.x / groundSize.x + 0.5);
      return step;
    }
  `;
  // GlobeProjection.toWorld() per pixel, then that world point on the ground's texture (with
  // premultiplied alpha). Inside the map nothing is see-through (clouds cover the unexplored part);
  // the edges of its top and bottom rows' tiles are partly covered, and anything at least half
  // covered counts as covered, so they keep a crisp edge.
  private static readonly BAND_MAP_FRAGMENT = `
    vec3 globePoint = normalize(vGlobePoint);
    float longitude = atan(globePoint.x, globePoint.z);
    float latitude = asin(clamp(globePoint.y, -1.0, 1.0));
    float mercator = log(tan(0.25 * PI + 0.5 * latitude));
    vec2 world = vec2(
      longitude / (2.0 * PI) * worldWidth + 16.0,
      16.0 + (edgeMercator - mercator) / rowStep * 25.0
    );
    vec2 groundTexel = vec2(world.x / worldWidth * groundSize.x, world.y * groundScale);
    vec2 stepX = groundStep(dFdx(groundTexel));
    vec2 stepY = groundStep(dFdy(groundTexel));
    vec4 ground = samplePixelArt(groundMap, groundSize, groundTexel, stepX, stepY);
    vec3 mapColor = ground.rgb / max(ground.a, 1e-4);
    diffuseColor.rgb *= mix(backdropColor, mapColor, clamp(ground.a * 2.0, 0.0, 1.0));
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
  private readonly ground: GlobeGround;
  private readonly lines: GlobeLines;
  private readonly decals: GlobeDecals;
  private readonly sprites: GlobeSprites;
  private readonly bandUniforms = {
    groundMap: { value: null as THREE.Texture },
    groundSize: { value: new THREE.Vector2(1, 1) },
    groundScale: { value: 1 },
    worldWidth: { value: 1 },
    edgeMercator: { value: 0 },
    rowStep: { value: 1 },
    backdropColor: { value: new THREE.Color(GlobeView.BACKDROP_COLOR) }
  };
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly lightDirection = new THREE.Vector3();
  private readonly signature: FrameSignature;

  private worldView: WorldView;
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
    // The sprites' clock only moves their fades on, which GlobeSprites.isFading() tells of.
    this.signature = new FrameSignature(["now"], this.planetSphere);
    this.solarSystem = new SolarSystem(this.planet);
    this.scene.add(this.solarSystem.group);
    this.scene.updateMatrixWorld();

    const maxTextureSize = Math.min(GlobeView.MAX_TEXTURE_SIZE, this.renderer.capabilities.maxTextureSize);
    const anisotropy = Math.min(GlobeView.MAX_ANISOTROPY, this.renderer.capabilities.getMaxAnisotropy());
    this.ground = new GlobeGround(this.projection, this.renderer, anisotropy);
    this.worldView = this.ground.view;
    this.bandUniforms.groundMap.value = this.ground.texture;
    this.bandUniforms.groundSize.value.set(...this.ground.getSize());
    this.bandUniforms.groundScale.value = this.ground.getScale();
    // The GPU forgets the ground's texture along with its context, so it's drawn again once that's back.
    canvas.addEventListener("webglcontextrestored", () => {
      this.ground.redrawAll();
      this.signature.forget();
    });
    this.lines = new GlobeLines(this.projection);
    this.planet.add(this.lines.mesh);
    this.decals = new GlobeDecals(this.projection);
    this.planet.add(this.decals.group);
    this.sprites = new GlobeSprites(this.projection, this.planet, maxTextureSize);

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

  /** Readies a frame once the camera is placed: moves the planets on, and the light with the camera. */
  public beginFrame() {
    const now = performance.now();
    this.solarSystem.update(Math.min(0.1, (now - this.lastFrame) / 1000));
    this.lastFrame = now;

    this.fitToScreen();
    this.scene.updateMatrixWorld();
    this.sprites.setLightDirection(
      this.lightDirection.copy(GlobeView.HEADLIGHT).applyQuaternion(this.camera.quaternion)
    );
  }

  /**
   * Brings the globe's picture of the map up to date with the scene's camera-space objects, those
   * that changed since the last frame. `zoom` is how many CSS pixels a world pixel covers in view.
   */
  public drawWorld(objects: SceneObject[], zoom: number) {
    const useView = (view: WorldView) => (this.worldView = view);
    // What marks the ground for the player lies over what stands on it, as on the flat map, so it isn't
    // painted into the ground.
    this.ground.update(
      objects.filter((object) => !Marking.is(object)),
      useView
    );
    this.decals.update(
      objects.filter((object): object is Actor => object instanceof Actor && Marking.is(object)),
      useView
    );
    this.lines.update(objects.filter((object): object is Line => object instanceof Line));
    this.sprites.update(objects, zoom * this.renderer.getPixelRatio(), this.camera, useView);
    this.worldView = this.ground.view;
  }

  /**
   * Draws the frame - unless it would come out just as the last one did, as when nothing moves, which
   * leaves the canvas showing that one and the GPU free.
   */
  public render() {
    const extra = [this.ground.getPatchesCopied(), this.renderer.getPixelRatio(), this.screenWidth, this.screenHeight];
    const changed = this.signature.changed(this.scene, this.camera, extra);
    if (!changed && !this.sprites.isFading()) return;

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * The world point under a point on screen (in CSS pixels), or undefined off the globe. Over a unit
   * standing up off the ground, it's the unit's tile.
   */
  public pick(screenX: number, screenY: number): [number, number] | undefined {
    const unit = this.sprites.pick(screenX, screenY, this.camera);
    if (unit) return unit;

    const ground = this.groundAt((screenX / this.screenWidth) * 2 - 1, 1 - (screenY / this.screenHeight) * 2);
    return ground ? this.projection.toWorld(ground[0], ground[1]) : undefined;
  }

  /**
   * For something standing up off the globe (see Standing), the world point the flat map would have
   * under a point on screen, where it's drawn standing up; undefined if it isn't drawn.
   */
  public screenToWorldFor(object: SceneObject, screenX: number, screenY: number): [number, number] | undefined {
    return this.sprites.screenToWorldFor(object, screenX, screenY, this.camera);
  }

  /** Where on screen a standing object shows a point of its rectangle - see GlobeSprites.screenPointOf(). */
  public screenPointOf(object: SceneObject, across: number, down: number): number[] | undefined {
    return this.sprites.screenPointOf(object, across, down, this.camera);
  }

  public setVisible(visible: boolean) {
    const display = visible ? "" : "none";
    if (this.renderer.domElement.style.display === display) return;

    this.renderer.domElement.style.display = display;
    // What was drawn stays on the canvas while it's hidden, but draw it again anyway once it's shown.
    if (visible) this.signature.forget();
  }

  public dispose() {
    this.caps.dispose();
    this.bandGeometry.dispose();
    this.bandMaterial.dispose();
    this.ground.dispose();
    this.lines.dispose();
    this.decals.dispose();
    this.sprites.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }

  // Follows the window's size.
  private fitToScreen() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (width === this.screenWidth && height === this.screenHeight) return;

    this.screenWidth = width;
    this.screenHeight = height;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.sprites.setScreenSize(width, height);
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

  // Lit like the caps (and the prototype's planets), its color from the ground's texture. Pushed back
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

  // The longitude and latitude where the camera's ray through a point on screen (-1 to 1 each way,
  // y up) first meets the globe, or undefined if it passes it.
  private groundAt(screenX: number, screenY: number): [number, number] | undefined {
    this.pointer.set(screenX, screenY);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const ground = this.raycaster.ray.intersectSphere(this.planetSphere, new THREE.Vector3());
    if (!ground) return undefined;

    ground.sub(this.planetSphere.center).normalize();
    return [Math.atan2(ground.x, ground.z), Math.asin(Math.max(-1, Math.min(1, ground.y)))];
  }
}
