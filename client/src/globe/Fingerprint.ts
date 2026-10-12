import { Actor } from "../scene/Actor";
import { ActorGroup } from "../scene/ActorGroup";
import { Line } from "../scene/Line";
import { SceneObject } from "../scene/SceneObject";

/**
 * A running hash of what a canvas would draw, so the globe draws one again (and hands it to the GPU)
 * only when that changes. Built from each scene object's own fields - where it is, its size, image
 * and color, a line's ends - plus its getDrawState() for anything else.
 */
export class Fingerprint {
  private static readonly ids = new WeakMap<object, number>();
  private static nextId = 1;

  private hash = 2166136261;

  /** A number for an object, the same for as long as it lives. */
  public static idOf(object: object | undefined): number {
    if (!object) return 0;

    let id = Fingerprint.ids.get(object);
    if (id === undefined) {
      id = Fingerprint.nextId++;
      Fingerprint.ids.set(object, id);
    }
    return id;
  }

  public add(value: number) {
    // To a 1/1024th, so positions that differ by less look the same.
    this.hash = Math.imul(this.hash ^ (Math.round(value * 1024) | 0), 16777619);
    return this;
  }

  public addText(text: string | undefined) {
    if (text === undefined) return this.add(-1);

    for (let i = 0; i < text.length; i++) this.add(text.charCodeAt(i));
    return this.add(text.length);
  }

  /** A scene object as it would draw, with positions taken from (originX, originY). */
  public addObject(object: SceneObject, originX = 0, originY = 0) {
    this.add(Fingerprint.idOf(object));
    this.add(object.getZIndex() ?? 0);
    const state = object.getDrawState?.();
    if (typeof state === "number") this.add(state);
    else this.addText(state);

    if (object instanceof Line) {
      this.add(object.getX1() - originX).add(object.getY1() - originY);
      this.add(object.getX2() - originX).add(object.getY2() - originY);
      this.add(object.getGirth()).add(object.getTransparency());
      this.addText(object.getColor());
    }
    if (object instanceof Actor) this.addActor(object, originX, originY);
    if (object instanceof ActorGroup) {
      for (const actor of object.getActors()) this.addActor(actor, originX, originY);
    }
    return this;
  }

  public value() {
    return this.hash >>> 0;
  }

  private addActor(actor: Actor, originX: number, originY: number) {
    const image = actor.getImage();
    this.add(actor.getX() - originX).add(actor.getY() - originY);
    this.add(actor.getWidth()).add(actor.getHeight());
    this.add(actor.getTransparency()).add(actor.getRotation());
    this.add(Fingerprint.idOf(image)).add(image && !(image as HTMLImageElement).complete ? 0 : 1);
    this.addText(String(actor.getSpriteRegion() ?? ""));
    this.addText(actor.getColor());
  }
}
