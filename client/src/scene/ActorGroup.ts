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
