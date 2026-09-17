import { Actor } from "./Actor";

export interface ActorGroupOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  actors?: Actor[];
  cameraApplies?: boolean;
  z?: number;
}

export class ActorGroup extends Actor {
  protected actors: Actor[];

  constructor(options: ActorGroupOptions) {
    super({
      x: options.x,
      y: options.y,
      width: options.width,
      height: options.height,
      cameraApplies: options.cameraApplies,
      z: options.z
    });

    this.actors = [];

    this.on("mousemove", (options) => {
      for (const actor of this.getActors()) {
        actor.call("mousemove", options);

        if (actor.insideActor(options.x, options.y)) {
          if (!actor.isMouseInside()) {
            actor.call("mouse_enter");
            actor.setMouseInside(true);
          }
        } else {
          if (actor.isMouseInside()) {
            actor.call("mouse_exit");
          }
          actor.setMouseInside(false);
        }
      }
    });

    this.on("mouseup", (options) => {
      if (options.button !== 0) {
        return;
      }

      for (const actor of this.getActors()) {
        if (actor.insideActor(options.x, options.y)) {
          //FIXME: Distinguish mouse_up & mouse_click_up better?
          actor.call("clicked");
        }
      }
    });

    // Game.ts only ever dispatches these three directly to its own top-level actor
    // list, so a group nested inside another group (e.g. a ListBox added to some
    // window's ActorGroup rather than straight to the Scene) would otherwise never
    // see them - unlike mousemove/mouseup above, there's no position-based bookkeeping
    // to do here, so these just rebroadcast the raw event to every descendant and let
    // each actor's own handler decide what to do with it.
    this.on("mousedown", (options) => {
      for (const actor of this.getActors()) {
        actor.call("mousedown", options);
      }
    });

    this.on("mouseleave", (options) => {
      for (const actor of this.getActors()) {
        actor.call("mouseleave", options);
      }
    });

    this.on("wheel", (options) => {
      for (const actor of this.getActors()) {
        actor.call("wheel", options);
      }
    });
  }

  /**
   *
   * @returns All actors in this group and all subgroups
   */
  public getActors() {
    const actors = [...this.actors];
    for (const actor of this.actors) {
      if (actor instanceof ActorGroup) {
        actors.push(...actor.getActors());
      }
    }

    return actors;
  }

  public draw(canvasContext: CanvasRenderingContext2D) {
    for (const actor of this.actors) {
      actor.draw(canvasContext);
    }
  }

  public addActor(actor: Actor) {
    actor.setCameraApplies(this.cameraApplies);
    actor.setZValue(this.z);
    this.actors.push(actor);
  }

  public removeActor(actor: Actor) {
    const actorIndex = this.actors.indexOf(actor);
    if (actorIndex < 0) return;

    const deletedActor = this.actors.splice(actorIndex, 1)[0];
    deletedActor.onDestroyed();
  }

  public onDestroyed(): void {
    super.onDestroyed();

    for (const actor of this.actors) {
      actor.onDestroyed();
    }
  }
}
