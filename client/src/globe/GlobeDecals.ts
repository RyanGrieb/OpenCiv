import * as THREE from "three";
import { Actor } from "../scene/Actor";
import { WorldView } from "../scene/Camera";
import { Marking } from "../scene/Marking";
import { Fingerprint } from "./Fingerprint";
import { GlobeProjection } from "./GlobeProjection";
import { OverStanding } from "./OverStanding";

// One actor's picture lying on the globe, and what it was last drawn from.
interface Decal {
  mesh: THREE.Mesh;
  context: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  print: number | undefined;
}

/**
 * Actors that lie on the ground over what stands up off it (see Marking), as the flat map draws
 * them over its trees, mountains and units, rather than painted into the ground under those (see
 * GlobeGround). Each is drawn by the game's own drawing code onto a canvas of its own, again only when
 * it changes, and laid on the globe as a picture bending with the ground. Lit like the ground, and
 * drawn over what stands on it (see OverStanding).
 */
export class GlobeDecals {
  // How far out from the planet's middle they lie, in its radii: on the ground, but not under it.
  private static readonly LIFT = 1.0001;
  // Canvas pixels to a world pixel.
  private static readonly DETAIL = 4;
  // Rows and columns of each picture's grid, so that it bends with the ground.
  private static readonly STEPS = 4;

  public readonly group = new THREE.Group();
  private readonly projection: GlobeProjection;
  private readonly decals = new Map<Actor, Decal>();

  constructor(projection: GlobeProjection) {
    this.projection = projection;
  }

  /**
   * Brings the pictures up to date with `actors`, drawing each through `useView` so the game's drawing
   * code finds its canvas as the one the map is being drawn into.
   */
  public update(actors: Actor[], useView: (view: WorldView) => void) {
    const current = new Set(actors);
    for (const [actor, decal] of this.decals) {
      if (current.has(actor)) continue;

      this.disposeDecal(decal);
      this.decals.delete(actor);
    }
    for (const actor of actors) {
      const decal = this.decals.get(actor) ?? this.createDecal(actor);
      const print = new Fingerprint().addObject(actor).value();
      if (print === decal.print) continue;

      // One whose image is still loading is drawn again next frame, until it's in.
      const loading = (actor.getImage() as HTMLImageElement | undefined)?.complete === false;
      decal.print = loading ? undefined : print;
      this.redraw(actor, decal, useView);
    }
  }

  public dispose() {
    this.decals.forEach((decal) => this.disposeDecal(decal));
    this.decals.clear();
  }

  private createDecal(actor: Actor): Decal {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    const material = new THREE.MeshLambertMaterial({ map: texture });
    OverStanding.setUp(material);
    material.onBeforeCompile = (shader) => OverStanding.patch(shader);
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
    mesh.frustumCulled = false;
    mesh.renderOrder = Marking.isUnderUnits(actor)
      ? OverStanding.MARKING_UNDER_UNITS_RENDER_ORDER
      : OverStanding.RENDER_ORDER;
    this.group.add(mesh);
    const decal: Decal = { mesh, context, texture, print: undefined };
    this.decals.set(actor, decal);
    return decal;
  }

  // Draws the actor onto its canvas, and lays the canvas over the ground it covers - none, off the map.
  private redraw(actor: Actor, decal: Decal, useView: (view: WorldView) => void) {
    const [x, y, width, height] = [actor.getX(), actor.getY(), actor.getWidth(), actor.getHeight()];
    decal.mesh.visible = width > 0 && height > 0 && y + height > 0 && y < this.projection.worldHeight;
    if (!decal.mesh.visible) return;

    const detail = GlobeDecals.DETAIL;
    const canvas = decal.context.canvas;
    if (canvas.width !== Math.ceil(width * detail) || canvas.height !== Math.ceil(height * detail)) {
      canvas.width = Math.ceil(width * detail);
      canvas.height = Math.ceil(height * detail);
      decal.texture.dispose();
    }
    decal.context.clearRect(0, 0, canvas.width, canvas.height);
    decal.context.imageSmoothingEnabled = false;
    useView({ context: decal.context, x: -x * detail, y: -y * detail, zoom: detail, pixelRatio: 1 });
    actor.draw(decal.context);
    decal.texture.needsUpdate = true;

    decal.mesh.geometry.dispose();
    decal.mesh.geometry = this.gridOver(x, y, width, height);
  }

  // A grid of triangles over a world rectangle, lying on the globe, its corners' texture coordinates
  // running over the whole canvas - wound counter-clockwise seen from outside the planet.
  private gridOver(x: number, y: number, width: number, height: number) {
    const steps = GlobeDecals.STEPS;
    const positions: number[] = [];
    const uvs: number[] = [];
    for (let row = 0; row <= steps; row++) {
      for (let column = 0; column <= steps; column++) {
        const [longitude, latitude] = this.projection.toSphere(
          x + (width * column) / steps,
          y + (height * row) / steps
        );
        positions.push(...GlobeProjection.unitVector(longitude, latitude).map((value) => value * GlobeDecals.LIFT));
        uvs.push(column / steps, 1 - row / steps);
      }
    }
    const indices: number[] = [];
    for (let row = 0; row < steps; row++) {
      for (let column = 0; column < steps; column++) {
        const at = row * (steps + 1) + column;
        const below = at + steps + 1;
        indices.push(at, below, at + 1, at + 1, below, below + 1);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    // On a sphere around the planet's middle, each point's way out from it is its own direction.
    geometry.setAttribute("normal", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    return geometry;
  }

  private disposeDecal(decal: Decal) {
    this.group.remove(decal.mesh);
    decal.mesh.geometry.dispose();
    (decal.mesh.material as THREE.Material).dispose();
    decal.texture.dispose();
  }
}
