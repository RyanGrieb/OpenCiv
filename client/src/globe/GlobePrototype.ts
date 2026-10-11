import * as THREE from "three";
import { SpriteRegion } from "../Assets";
import { HexSphere } from "./HexSphere";
import { PlanetMesh } from "./PlanetMesh";
import { PlanetTerrain, PlanetTile } from "./PlanetTerrain";
import { SolarSystem } from "./SolarSystem";

interface PlanetSize {
  label: string;
  subdivisions: number;
}

interface BuildTimes {
  geometry: number;
  terrain: number;
  mesh: number;
}

/**
 * The hex planet prototype: a playable-sized hex sphere textured with the game's terrain sprites,
 * inside a small solar system, drawn with three.js on its own canvas over the game's. Client-only
 * - the map is random and nothing talks to the server. Built to judge how a spherical map looks,
 * feels to move around, and performs.
 */
export class GlobePrototype {
  // 4,002 and 10,242 tiles match the game's Standard (80x52) and largest (128x80) maps.
  private static readonly SIZES: PlanetSize[] = [
    { label: "4k tiles (Standard map)", subdivisions: 20 },
    { label: "10k (largest map)", subdivisions: 32 },
    { label: "41k", subdivisions: 64 },
    { label: "100k", subdivisions: 100 },
    { label: "256k", subdivisions: 160 }
  ];
  private static readonly FOV = 45;
  private static readonly MAX_ALTITUDE = 260;
  // Below this many times its closest zoom, the camera tilts toward the horizon, like Civ's camera.
  private static readonly TILT_UNTIL = 4;
  private static readonly MAX_TILT = 0.6;

  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly home = new THREE.Group();
  private readonly solarSystem: SolarSystem;
  private readonly hoverOutline: THREE.LineLoop;
  private readonly pentagonOutlines = new THREE.Group();
  private readonly raycaster = new THREE.Raycaster();
  private readonly hud: HTMLDivElement;
  private readonly stats: HTMLDivElement;
  private readonly hoverText: HTMLDivElement;

  private sphere: HexSphere;
  private tiles: PlanetTile[] = [];
  private planetMesh: PlanetMesh;
  private buildTimes: BuildTimes;

  // The camera looks at the surface point at this longitude/latitude, from `altitude` above it.
  private longitude = 0.4;
  private latitude = 0.35;
  private altitude = 2.2;
  private autoSpin = false;
  private dragging = false;
  private lastPointer: [number, number] = [0, 0];
  private pointer = new THREE.Vector2(-10, -10);
  private hoveredTile = -1;
  private nextPentagon = 0;

  private frames = 0;
  private renderMs = 0;
  private statsSince = performance.now();
  private lastFrame = performance.now();
  private fps = 0;
  private averageRenderMs = 0;

  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    const canvas = this.renderer.domElement;
    canvas.id = "globe-canvas";
    Object.assign(canvas.style, { position: "fixed", left: "0", top: "0", zIndex: "50" });
    document.body.appendChild(canvas);

    this.camera = new THREE.PerspectiveCamera(GlobePrototype.FOV, window.innerWidth / window.innerHeight, 0.001, 6000);
    this.scene.background = new THREE.Color(0x03040a);
    this.scene.add(this.camera);
    // A light riding on the camera, so whatever side of a planet you look at is lit.
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const headlight = new THREE.DirectionalLight(0xffffff, 1.9);
    headlight.position.set(0.4, 0.6, 1);
    this.camera.add(headlight, headlight.target);
    headlight.target.position.set(0, 0, -1);

    this.home.position.set(SolarSystem.HOME_ORBIT, 0, 0);
    this.scene.add(this.home);
    this.solarSystem = new SolarSystem(this.home);
    this.scene.add(this.solarSystem.group);

    this.hoverOutline = new THREE.LineLoop(
      new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(6 * 3), 3)),
      new THREE.LineBasicMaterial({ color: 0xffffff })
    );
    this.hoverOutline.renderOrder = 10;
    this.hoverOutline.visible = false;
    this.home.add(this.hoverOutline);
    this.pentagonOutlines.visible = false;
    this.home.add(this.pentagonOutlines);

    [this.hud, this.stats, this.hoverText] = this.createHud();
    this.buildPlanet(0);
    this.listen(canvas);
    this.loop();
  }

  /** Opens the prototype over the game's canvas. */
  public static open(): GlobePrototype {
    return new GlobePrototype();
  }

  private static createButton(label: string, onClick: () => void) {
    // A div, not a <button>: the game's stylesheet forces its own look onto every button.
    const button = document.createElement("div");
    button.textContent = label;
    button.setAttribute("role", "button");
    Object.assign(button.style, {
      display: "inline-block",
      margin: "2px 4px 2px 0",
      padding: "4px 8px",
      background: "#2a2f3a",
      color: "#e8ecf4",
      border: "1px solid #4a5263",
      borderRadius: "4px",
      font: "12px monospace",
      cursor: "pointer",
      userSelect: "none"
    });
    button.addEventListener("click", onClick);
    return button;
  }

  private static unitVector(longitude: number, latitude: number) {
    return new THREE.Vector3(
      Math.cos(latitude) * Math.sin(longitude),
      Math.sin(latitude),
      Math.cos(latitude) * Math.cos(longitude)
    );
  }

  private static smoothstep(from: number, to: number, value: number) {
    const t = Math.max(0, Math.min(1, (value - from) / (to - from)));
    return t * t * (3 - 2 * t);
  }

  private buildPlanet(sizeIndex: number) {
    if (this.planetMesh) {
      this.home.remove(this.planetMesh.group);
      this.planetMesh.dispose();
    }

    const subdivisions = GlobePrototype.SIZES[sizeIndex].subdivisions;
    let start = performance.now();
    this.sphere = new HexSphere(subdivisions);
    const geometry = performance.now() - start;
    start = performance.now();
    this.tiles = PlanetTerrain.generate(this.sphere, "earth", 1234);
    const terrain = performance.now() - start;
    start = performance.now();
    this.planetMesh = new PlanetMesh(this.sphere, this.tiles, 1);
    this.home.add(this.planetMesh.group);
    const mesh = performance.now() - start;
    this.buildTimes = { geometry, terrain, mesh };

    this.hoveredTile = -1;
    this.hoverOutline.visible = false;
    this.buildPentagonOutlines();
    this.altitude = Math.max(this.altitude, this.minAltitude());
    for (const button of Array.from(this.hud.querySelectorAll<HTMLDivElement>("[data-size]"))) {
      button.style.background = Number(button.dataset.size) === sizeIndex ? "#3d6fb6" : "#2a2f3a";
    }
  }

  // Close enough to see about 10 tiles across, near the 2D map's closest zoom.
  private minAltitude() {
    return 14 * this.tileRadius();
  }

  // A tile's center-to-corner distance, in planet radii (a hexagon's area is 2.6 r^2).
  private tileRadius() {
    return Math.sqrt((4 * Math.PI) / this.sphere.tileCount / 2.6);
  }

  private loop() {
    const now = performance.now();
    const delta = Math.min(0.1, (now - this.lastFrame) / 1000);
    this.lastFrame = now;

    if (this.autoSpin) this.longitude += delta * 0.25 * Math.min(1, this.altitude);
    this.solarSystem.update(delta);
    this.updateCamera();
    this.updateHover();

    const renderStart = performance.now();
    this.renderer.render(this.scene, this.camera);
    this.renderMs += performance.now() - renderStart;
    this.frames++;
    if (now - this.statsSince >= 500) {
      this.fps = (this.frames * 1000) / (now - this.statsSince);
      this.averageRenderMs = this.renderMs / this.frames;
      this.frames = 0;
      this.renderMs = 0;
      this.statsSince = now;
      this.updateStats();
    }
    requestAnimationFrame(() => this.loop());
  }

  private updateCamera() {
    const surface = GlobePrototype.unitVector(this.longitude, this.latitude);
    const north = new THREE.Vector3(0, 1, 0).sub(surface.clone().multiplyScalar(surface.y)).normalize();
    const anchor = surface.clone().add(this.home.position);

    const tilt =
      GlobePrototype.MAX_TILT *
      (1 -
        GlobePrototype.smoothstep(this.minAltitude(), this.minAltitude() * GlobePrototype.TILT_UNTIL, this.altitude));
    const offset = surface
      .clone()
      .multiplyScalar(Math.cos(tilt))
      .addScaledVector(north, -Math.sin(tilt))
      .multiplyScalar(this.altitude);
    this.camera.position.copy(anchor).add(offset);

    // Zoomed far out, the view slides over to center on the sun, framing the whole system.
    const toSun = GlobePrototype.smoothstep(Math.log(6), Math.log(90), Math.log(this.altitude));
    const lookAt = anchor.clone().lerp(this.solarSystem.sun.position, toSun);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(lookAt);

    this.camera.near = Math.max(0.0005, this.altitude * Math.cos(tilt) * 0.05);
    this.camera.far = 6000;
    this.camera.updateProjectionMatrix();
  }

  private updateHover() {
    if (this.dragging || this.pointer.x < -1) return;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.ray.intersectSphere(new THREE.Sphere(this.home.position, 1), new THREE.Vector3());
    if (!hit) {
      this.setHoveredTile(-1);
      return;
    }
    hit.sub(this.home.position).normalize();
    this.setHoveredTile(this.sphere.findTile(hit.x, hit.y, hit.z, Math.max(0, this.hoveredTile)));
  }

  private setHoveredTile(tile: number) {
    if (tile === this.hoveredTile) return;
    this.hoveredTile = tile;
    this.hoverOutline.visible = tile >= 0;
    if (tile < 0) {
      this.hoverText.textContent = "";
      return;
    }

    const count = this.writeOutline(
      tile,
      this.hoverOutline.geometry.getAttribute("position") as THREE.BufferAttribute,
      0
    );
    this.hoverOutline.geometry.setDrawRange(0, count);
    this.hoverOutline.geometry.getAttribute("position").needsUpdate = true;
    const info = this.tiles[tile];
    const sprites = [info.base, ...info.overlays].map((region) => SpriteRegion[region]).join(" + ");
    this.hoverText.textContent = `Tile ${tile}: ${info.label} (${count} neighbors${count === 5 ? ", a pentagon" : ""}) - ${sprites}`;
  }

  // Writes a tile's corners (just above the ground) into `attribute` from `offset`; returns how many.
  private writeOutline(tile: number, attribute: THREE.BufferAttribute, offset: number) {
    const start = this.sphere.cornerStart[tile];
    const count = this.sphere.cornerStart[tile + 1] - start;
    for (let i = 0; i < count; i++) {
      const corner = this.sphere.tileCorners[start + i];
      // Above the highest overlay, so the outline isn't buried, while the planet still hides its far side.
      const lift = 1.004;
      attribute.setXYZ(
        offset + i,
        this.sphere.corners[corner * 3] * lift,
        this.sphere.corners[corner * 3 + 1] * lift,
        this.sphere.corners[corner * 3 + 2] * lift
      );
    }
    return count;
  }

  private buildPentagonOutlines() {
    for (const child of [...this.pentagonOutlines.children]) {
      this.pentagonOutlines.remove(child);
      (child as THREE.LineLoop).geometry.dispose();
    }
    const material = new THREE.LineBasicMaterial({ color: 0xff3040 });
    for (let tile = 0; tile < 12; tile++) {
      const attribute = new THREE.BufferAttribute(new Float32Array(5 * 3), 3);
      this.writeOutline(tile, attribute, 0);
      const outline = new THREE.LineLoop(new THREE.BufferGeometry().setAttribute("position", attribute), material);
      outline.renderOrder = 10;
      this.pentagonOutlines.add(outline);
    }
  }

  // HexSphere creates the icosahedron's 12 corners - the pentagons - first.
  private flyToNextPentagon() {
    const tile = this.nextPentagon;
    this.nextPentagon = (this.nextPentagon + 1) % 12;
    const x = this.sphere.centers[tile * 3];
    const y = this.sphere.centers[tile * 3 + 1];
    const z = this.sphere.centers[tile * 3 + 2];
    this.latitude = Math.asin(y);
    this.longitude = Math.atan2(x, z);
    this.altitude = this.minAltitude() * 2;
    this.pentagonOutlines.visible = true;
  }

  private listen(canvas: HTMLCanvasElement) {
    canvas.addEventListener("pointerdown", (event) => {
      this.dragging = true;
      this.lastPointer = [event.clientX, event.clientY];
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointerup", (event) => {
      this.dragging = false;
      canvas.releasePointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointermove", (event) => {
      this.pointer.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
      if (!this.dragging) return;
      this.drag(event.clientX - this.lastPointer[0], event.clientY - this.lastPointer[1]);
      this.lastPointer = [event.clientX, event.clientY];
    });
    canvas.addEventListener("pointerleave", () => this.pointer.set(-10, -10));
    canvas.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();
        const factor = Math.exp(event.deltaY * 0.0012);
        this.altitude = Math.min(GlobePrototype.MAX_ALTITUDE, Math.max(this.minAltitude(), this.altitude * factor));
      },
      { passive: false }
    );
    window.addEventListener("resize", () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
    });
  }

  // Drags the ground under the mouse along with it: one screen pixel turns the planet by the
  // ground distance a pixel covers at this altitude.
  private drag(dx: number, dy: number) {
    const groundPerPixel =
      (2 * this.altitude * Math.tan(THREE.MathUtils.degToRad(GlobePrototype.FOV / 2))) / window.innerHeight;
    const radiansPerPixel = Math.min(groundPerPixel, 0.01);
    this.longitude -= (dx * radiansPerPixel) / Math.max(0.2, Math.cos(this.latitude));
    this.latitude = Math.max(-1.45, Math.min(1.45, this.latitude + dy * radiansPerPixel));
  }

  private createHud(): [HTMLDivElement, HTMLDivElement, HTMLDivElement] {
    const hud = document.createElement("div");
    Object.assign(hud.style, {
      position: "fixed",
      left: "12px",
      top: "12px",
      zIndex: "51",
      padding: "10px 12px",
      background: "rgba(10, 12, 20, 0.78)",
      color: "#e8ecf4",
      font: "13px monospace",
      borderRadius: "6px",
      maxWidth: "min(560px, calc(100vw - 48px))",
      lineHeight: "1.5"
    });
    hud.innerHTML = `<div style="font-weight:bold;font-size:15px">Hex planet prototype</div>
      <div style="opacity:0.75">Drag to spin, scroll to zoom out to the solar system.</div>`;

    const stats = document.createElement("div");
    stats.style.marginTop = "6px";
    hud.appendChild(stats);

    const sizes = document.createElement("div");
    sizes.style.margin = "6px 0";
    GlobePrototype.SIZES.forEach((size, index) => {
      const button = GlobePrototype.createButton(size.label, () => this.buildPlanet(index));
      button.dataset.size = String(index);
      sizes.appendChild(button);
    });
    hud.appendChild(sizes);

    const actions = document.createElement("div");
    actions.appendChild(
      GlobePrototype.createButton(
        "Show pentagons",
        () => (this.pentagonOutlines.visible = !this.pentagonOutlines.visible)
      )
    );
    actions.appendChild(GlobePrototype.createButton("Fly to a pentagon", () => this.flyToNextPentagon()));
    actions.appendChild(GlobePrototype.createButton("Auto-spin", () => (this.autoSpin = !this.autoSpin)));
    actions.appendChild(GlobePrototype.createButton("Main menu", () => (window.location.search = "")));
    hud.appendChild(actions);

    const hoverText = document.createElement("div");
    Object.assign(hoverText.style, { marginTop: "6px", minHeight: "1.5em", color: "#ffe9a8" });
    hud.appendChild(hoverText);

    document.body.appendChild(hud);
    return [hud, stats, hoverText];
  }

  private updateStats() {
    const info = this.renderer.info.render;
    const times = this.buildTimes;
    this.stats.innerHTML =
      `FPS ${this.fps.toFixed(0)} &middot; render call ${this.averageRenderMs.toFixed(2)} ms<br>` +
      `${this.sphere.tileCount.toLocaleString()} tiles (12 pentagons) &middot; ${info.triangles.toLocaleString()} triangles &middot; ${info.calls} draw calls<br>` +
      `Built in ${(times.geometry + times.terrain + times.mesh).toFixed(0)} ms: grid ${times.geometry.toFixed(0)}, terrain ${times.terrain.toFixed(0)}, meshes ${times.mesh.toFixed(0)}<br>` +
      `Altitude ${this.altitude.toFixed(3)} planet radii`;
    (window as unknown as { hexPlanetStats: object }).hexPlanetStats = {
      fps: this.fps,
      renderMs: this.averageRenderMs,
      tiles: this.sphere.tileCount,
      triangles: info.triangles,
      calls: info.calls,
      ...times
    };
  }
}
