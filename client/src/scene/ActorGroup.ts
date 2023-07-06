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
  private actors: Actor[];

  constructor(options: ActorGroupOptions) {
    super({
      x: options.x,
      y: options.y,
      width: options.width,
      height: options.height,
      cameraApplies: options.cameraApplies,
      z: options.z,
    });

    this.actors = [];
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

    this.actors.splice(actorIndex, 1);
  }
}
