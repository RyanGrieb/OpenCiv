import { SceneObject } from "./SceneObject";

/**
 * The things in the world that lie on the ground to mark it for the player - the hovered tile, the
 * tiles a city works while its window is open - which the flat map draws over its trees and the like.
 * On the globe, where trees, mountains and units stand up off the ground, these are drawn over them
 * too, rather than painted into the ground under them (see GlobeDecals). On the flat map this changes
 * nothing.
 */
export class Marking {
  private static readonly marked = new WeakSet<SceneObject>();

  public static mark(object: SceneObject) {
    Marking.marked.add(object);
  }

  public static is(object: SceneObject): boolean {
    return Marking.marked.has(object);
  }
}
