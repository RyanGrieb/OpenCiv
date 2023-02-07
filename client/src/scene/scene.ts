import { Actor } from "./actor";
import { Game } from "../game";

export abstract class Scene {
  // Use a Map<> ?
  private actors: Actor[] = [];

  constructor() {}

  public addActor(actor: Actor) {
    this.actors.push(actor);
    Game.addActor(actor);
  }
  public gameLoop() {
    this.actors.forEach((actor: Actor) => {
      actor.draw();
    });
  }

  public onInitialize() {}
  public onDestroyed() {}
}
