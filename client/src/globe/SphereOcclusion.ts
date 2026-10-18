import * as THREE from "three";

/** Whether a sphere hides another from an eye, as the planet hides what's round its back. */
export class SphereOcclusion {
  private static readonly toBounds = new THREE.Vector3();
  private static readonly toOccluder = new THREE.Vector3();

  /**
   * Whether all of `bounds` lies behind `occluder` seen from `eye`: further off than the occluder's
   * middle, and inside the cone of what it hides. Leaves out nothing that might show.
   */
  public static hides(occluder: THREE.Sphere, eye: THREE.Vector3, bounds: THREE.Sphere): boolean {
    const toBounds = SphereOcclusion.toBounds.subVectors(bounds.center, eye);
    const toOccluder = SphereOcclusion.toOccluder.subVectors(occluder.center, eye);
    const [boundsDistance, occluderDistance] = [toBounds.length(), toOccluder.length()];
    if (occluderDistance <= occluder.radius || boundsDistance - bounds.radius <= occluderDistance) return false;

    const apart = toBounds.angleTo(toOccluder);
    const boundsReach = Math.asin(Math.min(1, bounds.radius / boundsDistance));
    const occluderReach = Math.asin(occluder.radius / occluderDistance);
    return apart + boundsReach < occluderReach;
  }
}
