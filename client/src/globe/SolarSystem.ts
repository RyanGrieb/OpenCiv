import * as THREE from "three";
import { HexSphere } from "./HexSphere";
import { PlanetMesh } from "./PlanetMesh";
import { PlanetKind, PlanetTerrain } from "./PlanetTerrain";

interface OrbitingBody {
  object: THREE.Object3D;
  orbitRadius: number;
  // Radians per second.
  speed: number;
  angle: number;
  // What it circles: the sun when undefined.
  around?: THREE.Object3D;
}

/**
 * Everything around the playable planet: the sun, a few smaller hex planets (desert, ice, a moon),
 * a ringed gas giant, their orbits and a starfield. Purely decoration for the prototype.
 */
export class SolarSystem {
  public static readonly HOME_ORBIT = 40;

  public readonly group = new THREE.Group();
  public readonly sun: THREE.Mesh;
  private readonly bodies: OrbitingBody[] = [];

  constructor(home: THREE.Object3D) {
    this.sun = new THREE.Mesh(new THREE.SphereGeometry(6, 48, 24), new THREE.MeshBasicMaterial({ color: 0xffd36b }));
    this.group.add(this.sun);
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: SolarSystem.createGlowTexture(),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true
      })
    );
    glow.scale.set(34, 34, 1);
    this.sun.add(glow);

    this.group.add(SolarSystem.createStars(4000));
    this.addOrbitLine(SolarSystem.HOME_ORBIT);

    this.addHexPlanet("desert", 12, 0.6, 22, 0.05, 1.2);
    this.addHexPlanet("ice", 16, 0.8, 62, 0.025, 4.1);
    this.addGasGiant(88, 0.015, 2.6);
    const moon = this.addHexPlanet("moon", 8, 0.27, 4.5, 0.15, 0.6, home, 0xb8b4ae);
    moon.renderOrder = 1;
  }

  private static createStars(count: number) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const z = Math.random() * 2 - 1;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(1 - z * z) * 2500;
      positions.set([Math.cos(angle) * r, z * 2500, Math.sin(angle) * r], i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false }));
  }

  private static createGlowTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext("2d");
    const gradient = context.createRadialGradient(64, 64, 10, 64, 64, 64);
    gradient.addColorStop(0, "rgba(255, 220, 140, 0.9)");
    gradient.addColorStop(0.35, "rgba(255, 170, 60, 0.35)");
    gradient.addColorStop(1, "rgba(255, 140, 40, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  }

  // A small pixel-art band texture for the gas giant.
  private static createBandsCanvas() {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 32;
    const context = canvas.getContext("2d");
    const colors = ["#c9a26b", "#e3c99a", "#a8754a", "#d9b98a", "#b98a5c", "#efdcb8"];
    for (let y = 0; y < 32; y++) {
      const band = Math.floor((y + Math.sin(y * 0.7) * 1.5) / 3) % colors.length;
      context.fillStyle = colors[(band + colors.length) % colors.length];
      context.fillRect(0, y, 64, 1);
    }
    // A storm.
    context.fillStyle = "#b5523a";
    context.fillRect(40, 19, 7, 3);
    context.fillRect(41, 18, 5, 5);
    return canvas;
  }

  public update(deltaSeconds: number) {
    for (const body of this.bodies) {
      body.angle += body.speed * deltaSeconds;
      const centerX = body.around ? body.around.position.x : 0;
      const centerZ = body.around ? body.around.position.z : 0;
      body.object.position.set(
        centerX + Math.cos(body.angle) * body.orbitRadius,
        0,
        centerZ + Math.sin(body.angle) * body.orbitRadius
      );
      body.object.rotation.y += deltaSeconds * 0.1;
    }
  }

  private addHexPlanet(
    kind: PlanetKind,
    subdivisions: number,
    radius: number,
    orbitRadius: number,
    speed: number,
    angle: number,
    around?: THREE.Object3D,
    tint?: THREE.ColorRepresentation
  ) {
    const sphere = new HexSphere(subdivisions);
    const mesh = new PlanetMesh(sphere, PlanetTerrain.generate(sphere, kind, subdivisions * 7919), radius, tint);
    this.group.add(mesh.group);
    this.bodies.push({ object: mesh.group, orbitRadius, speed, angle, around });
    if (!around) this.addOrbitLine(orbitRadius);
    return mesh.group;
  }

  private addGasGiant(orbitRadius: number, speed: number, angle: number) {
    const texture = new THREE.CanvasTexture(SolarSystem.createBandsCanvas());
    texture.magFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    const giant = new THREE.Mesh(new THREE.SphereGeometry(3, 48, 24), new THREE.MeshLambertMaterial({ map: texture }));
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(4, 6.2, 96),
      new THREE.MeshBasicMaterial({ color: 0xc9b38a, side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
    );
    ring.rotation.x = -Math.PI / 2 + 0.35;
    giant.add(ring);
    this.group.add(giant);
    this.bodies.push({ object: giant, orbitRadius, speed, angle });
    this.addOrbitLine(orbitRadius);
  }

  private addOrbitLine(radius: number) {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < 256; i++) {
      const angle = (i / 256) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    const line = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: 0x6f8fb8, transparent: true, opacity: 0.35 })
    );
    this.group.add(line);
  }
}
