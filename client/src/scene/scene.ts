import { Actor } from "./actor";
import { Game } from "../game";
import { NetworkEvents } from "../network/client";

export abstract class Scene {
  private static ExitReceipt = new (class {})();

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

  public onDestroyed(newScene: Scene): typeof Scene.ExitReceipt {
    this.actors.forEach((actor) => {
      actor.call("mouse_exit");
      actor.onDestroyed();
    });
    this.actors = [];
    NetworkEvents.clear();

    return Scene.ExitReceipt;
  }
}
