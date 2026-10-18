import * as THREE from "three";
import { Fingerprint } from "./Fingerprint";

/**
 * Everything a three.js scene would draw from a camera, as a list of numbers - the camera, and each
 * thing drawn in its view: where it is, its geometry's and material's versions, its textures' and
 * uniforms' values - so a frame that would come out the same as the last one drawn can be left out,
 * the canvas keeping the last one. What lies out of view - off screen, or behind the planet - counts
 * only once it comes into it, so the solar system's planets going round out of sight don't have the
 * globe drawn over again every frame.
 * Exact: a camera easing in by less than a texel still counts.
 */
export class FrameSignature {
  private readonly frustum = new THREE.Frustum();
  private readonly viewProjection = new THREE.Matrix4();
  private readonly bounds = new THREE.Sphere();
  private readonly toBounds = new THREE.Vector3();
  private readonly toOccluder = new THREE.Vector3();
  private occluder: THREE.Sphere | undefined;
  private readonly ignoredUniforms: Set<string>;
  private values: number[] = [];
  private previous: number[] = [];

  /**
   * `ignoredUniforms` are those that change every frame but are known to change nothing drawn then;
   * nothing wholly behind `occluder` (the planet) as the camera sees it is drawn.
   */
  constructor(ignoredUniforms: string[], occluder?: THREE.Sphere) {
    this.ignoredUniforms = new Set(ignoredUniforms);
    this.occluder = occluder;
  }

  /**
   * Whether drawing `scene` from `camera` now would differ from the last time this said it would,
   * `extra` being anything drawn that the scene's objects don't show - like what was copied into a texture.
   */
  public changed(scene: THREE.Scene, camera: THREE.Camera, extra: number[]): boolean {
    const values = this.values;
    values.length = 0;
    values.push(...extra, ...camera.matrixWorld.elements, ...camera.projectionMatrix.elements);
    this.viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.viewProjection);
    scene.traverseVisible((object) => this.addObject(object, camera));

    const changed = !FrameSignature.same(values, this.previous);
    this.values = this.previous;
    this.previous = values;
    return changed;
  }

  /** Has the next call say the frame changed, as when the canvas lost what was drawn on it. */
  public forget() {
    this.previous.length = 0;
  }

  private static same(a: number[], b: number[]) {
    if (a.length !== b.length) return false;
    for (let index = 0; index < a.length; index++) {
      if (a[index] !== b[index]) return false;
    }
    return true;
  }

  private addObject(object: THREE.Object3D, camera: THREE.Camera) {
    const drawn = object as THREE.Mesh;
    if (!drawn.geometry || !drawn.material) return;
    if (object.frustumCulled && !this.inView(drawn, camera)) return;

    const values = this.values;
    values.push(object.id, object.renderOrder, ...object.matrixWorld.elements);
    const geometry = drawn.geometry as THREE.BufferGeometry & { instanceCount?: number };
    values.push(geometry.id, geometry.index?.version ?? -1, geometry.instanceCount ?? -1);
    values.push(geometry.drawRange.start, geometry.drawRange.count);
    for (const name in geometry.attributes) {
      values.push((geometry.attributes[name] as THREE.BufferAttribute).version ?? -1);
    }
    for (const material of Array.isArray(drawn.material) ? drawn.material : [drawn.material]) {
      this.addMaterial(material);
    }
  }

  // Whether something three.js would cull out of view is on screen and not wholly behind the occluder.
  private inView(object: THREE.Mesh, camera: THREE.Camera) {
    if (object instanceof THREE.Sprite) return this.frustum.intersectsSprite(object);
    if (!this.frustum.intersectsObject(object)) return false;
    if (!this.occluder || !object.geometry.boundingSphere) return true;

    // Hidden when further off than the occluder and inside the cone it hides from the camera.
    const bounds = this.bounds.copy(object.geometry.boundingSphere).applyMatrix4(object.matrixWorld);
    const toBounds = this.toBounds.subVectors(bounds.center, camera.position);
    const toOccluder = this.toOccluder.subVectors(this.occluder.center, camera.position);
    const [boundsDistance, occluderDistance] = [toBounds.length(), toOccluder.length()];
    if (occluderDistance <= this.occluder.radius || boundsDistance - bounds.radius <= occluderDistance) return true;

    const apart = toBounds.angleTo(toOccluder);
    const boundsReach = Math.asin(Math.min(1, bounds.radius / boundsDistance));
    const occluderReach = Math.asin(this.occluder.radius / occluderDistance);
    return apart + boundsReach >= occluderReach;
  }

  private addMaterial(material: THREE.Material) {
    const values = this.values;
    values.push(Fingerprint.idOf(material), material.version, material.opacity, material.visible ? 1 : 0);
    const map = (material as THREE.MeshBasicMaterial).map;
    if (map) values.push(map.id, map.version);
    const uniforms = (material as THREE.ShaderMaterial).uniforms;
    if (!uniforms) return;

    for (const name in uniforms) {
      if (!this.ignoredUniforms.has(name)) this.addValue(uniforms[name].value);
    }
  }

  private addValue(value: unknown) {
    const values = this.values;
    if (typeof value === "number") values.push(value);
    else if (typeof value === "boolean") values.push(value ? 1 : 0);
    else if (value === null || value === undefined) values.push(-1);
    else if (value instanceof THREE.Texture) values.push(value.id, value.version);
    else if (value instanceof THREE.Vector2) values.push(value.x, value.y);
    else if (value instanceof THREE.Vector3) values.push(value.x, value.y, value.z);
    else if (value instanceof THREE.Vector4) values.push(value.x, value.y, value.z, value.w);
    else if (value instanceof THREE.Color) values.push(value.r, value.g, value.b);
    else if (value instanceof THREE.Matrix4 || value instanceof THREE.Matrix3) values.push(...value.elements);
    else values.push(NaN); // Anything else isn't known to hold still, so it counts as changed.
  }
}
