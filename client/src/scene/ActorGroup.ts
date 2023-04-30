import { Game } from "../Game";
import { Actor } from "./Actor";

export interface ActorGroupOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  actors?: Actor[];
}

export class ActorGroup extends Actor {
  private actors: Actor[];

  constructor(options: ActorGroupOptions) {
    super({
      x: options.x,
      y: options.y,
      width: options.width,
      height: options.height,
    });

    this.actors = [];
  }

  public draw(canvasContext: CanvasRenderingContext2D) {
    for (const actor of this.actors) {
      Game.drawImageFromActor(actor, canvasContext);
    }
  }

  public addActor(actor: Actor) {
    this.actors.push(actor);
  }

  public removeActor(actor: Actor) {
    const actorIndex = this.actors.indexOf(actor);
    if (actorIndex < 0) return;

    console.log("hi");
    this.actors.splice(actorIndex, 1);
  }
}
