import * as THREE from "three";
import { Line } from "../scene/Line";
import { Fingerprint } from "./Fingerprint";
import { GlobeProjection } from "./GlobeProjection";
import { OverStanding } from "./OverStanding";

/**
 * The map's lines - city borders, tile outlines, movement paths - drawn on the globe as thin strips
 * lying on the ground, rather than onto the ground's canvases with the rest of what lies on it (see
 * GlobeGround). Those have a pixel to each world pixel, so a line a world pixel or two wide took up a
 * pixel or two of them and came out soft and blocky close up, where the flat map draws it sharp at any
 * zoom. As strips, lines are drawn at the screen's own resolution, as wide on the ground as the flat
 * map draws them, their edges smoothed over a pixel and their ends rounded off. Lit like the ground,
 * and drawn over what stands up off it, as the flat map draws them over its trees (see OverStanding).
 */
export class GlobeLines {
  // How far out from the planet's middle they lie, in its radii: on the ground, but not under it.
  private static readonly LIFT = 1.0001;
  // The longest stretch of a line drawn straight, in world pixels; longer ones bend with the ground.
  private static readonly STEP = 8;
  // The sides of the disc rounding off each end of a line.
  private static readonly CAP_SIDES = 8;

  public readonly mesh: THREE.Mesh;
  private readonly projection: GlobeProjection;
  private readonly colorContext = document.createElement("canvas").getContext("2d");
  private readonly colors = new Map<string, number[]>();
  private drawn: number | undefined;

  /** `renderOrder` places the strips among what else is drawn over the ground - see OverStanding. */
  constructor(projection: GlobeProjection, renderOrder: number) {
    this.projection = projection;
    const material = new THREE.MeshLambertMaterial({ vertexColors: true });
    OverStanding.setUp(material);
    // Each strip's pixels fade out over the last pixel to its edges (where `across` reaches 1 either
    // side), half covered right at them, as a canvas smooths a line's edges; one narrower than a
    // pixel fades as much as it's narrower.
    material.onBeforeCompile = (shader) => {
      OverStanding.patch(shader);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nattribute float across;\nvarying float vAcross;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvAcross = across;");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying float vAcross;")
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          float perPixel = max(fwidth(vAcross), 1e-5);
          diffuseColor.a *= clamp(0.5 + (1.0 - abs(vAcross)) / perPixel, 0.0, 1.0) * min(1.0, 2.0 / perPixel);`
        );
    };
    this.mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = renderOrder;
  }

  /** Brings the strips up to date with the map's lines, rebuilding them only when those changed. */
  public update(lines: Line[]) {
    // Higher ones over lower ones, as the flat map draws them.
    const ordered = [...lines].sort((a, b) => a.getZIndex() - b.getZIndex());
    const fingerprint = new Fingerprint();
    ordered.forEach((line) => fingerprint.addObject(line));
    if (fingerprint.value() === this.drawn) return;

    this.drawn = fingerprint.value();
    const strips = { positions: [] as number[], colors: [] as number[], across: [] as number[] };
    for (const line of ordered) {
      this.addLine(line, strips);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(strips.positions, 3));
    // On a sphere around the planet's middle, each point's way out from it is its own direction.
    geometry.setAttribute("normal", new THREE.Float32BufferAttribute(strips.positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(strips.colors, 4));
    geometry.setAttribute("across", new THREE.Float32BufferAttribute(strips.across, 1));
    this.mesh.geometry.dispose();
    this.mesh.geometry = geometry;
  }

  public dispose() {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }

  // A line as triangles: a strip along it, in short straight stretches, and a disc at either end -
  // each wound counter-clockwise on the map seen with north up, as from outside the planet, so they
  // face out and are lit on their outer side.
  private addLine(line: Line, strips: { positions: number[]; colors: number[]; across: number[] }) {
    const [x1, y1, x2, y2] = [line.getX1(), line.getY1(), line.getX2(), line.getY2()];
    const half = line.getGirth() / 2;
    const [red, green, blue, alpha] = this.colorOf(line.getColor());
    const color = [red, green, blue, alpha * line.getTransparency()];
    // A corner at a world point, `across` its width from its middle (-1 to 1).
    const corner = (x: number, y: number, across: number) => {
      const [longitude, latitude] = this.projection.toSphere(x, y);
      strips.positions.push(...GlobeProjection.unitVector(longitude, latitude).map((value) => value * GlobeLines.LIFT));
      strips.colors.push(...color);
      strips.across.push(across);
    };

    const length = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.ceil(length / GlobeLines.STEP);
    const [sideX, sideY] = length > 0 ? [((y1 - y2) / length) * half, ((x2 - x1) / length) * half] : [0, 0];
    for (let step = 0; step < steps; step++) {
      const [fromX, fromY] = [x1 + ((x2 - x1) * step) / steps, y1 + ((y2 - y1) * step) / steps];
      const [toX, toY] = [x1 + ((x2 - x1) * (step + 1)) / steps, y1 + ((y2 - y1) * (step + 1)) / steps];
      corner(fromX + sideX, fromY + sideY, 1);
      corner(toX + sideX, toY + sideY, 1);
      corner(fromX - sideX, fromY - sideY, -1);
      corner(toX + sideX, toY + sideY, 1);
      corner(toX - sideX, toY - sideY, -1);
      corner(fromX - sideX, fromY - sideY, -1);
    }

    for (const [x, y] of [
      [x1, y1],
      [x2, y2]
    ]) {
      for (let side = 0; side < GlobeLines.CAP_SIDES; side++) {
        const [from, to] = [side, side + 1].map((each) => (each / GlobeLines.CAP_SIDES) * 2 * Math.PI);
        corner(x, y, 0);
        corner(x + Math.cos(to) * half, y + Math.sin(to) * half, 1);
        corner(x + Math.cos(from) * half, y + Math.sin(from) * half, 1);
      }
    }
  }

  // A CSS color as the GPU takes it - linear red, green and blue - and its opacity, read back from a
  // canvas, which spells out any color it takes as #rrggbb, or as rgba() when partly see-through.
  private colorOf(css: string): number[] {
    const known = this.colors.get(css);
    if (known) return known;

    this.colorContext.fillStyle = "#000000";
    this.colorContext.fillStyle = css;
    const spelled = String(this.colorContext.fillStyle);
    const [red, green, blue, alpha = 1] = spelled.startsWith("#")
      ? [1, 3, 5].map((at) => parseInt(spelled.slice(at, at + 2), 16))
      : (spelled.match(/[\d.]+/g) ?? []).map(Number);
    const linear = new THREE.Color().setRGB(red / 255, green / 255, blue / 255, THREE.SRGBColorSpace);
    const color = [linear.r, linear.g, linear.b, alpha];
    this.colors.set(css, color);
    return color;
  }
}
