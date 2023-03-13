import { Actor } from "./Actor";
import { Game } from "../Game";
import { NetworkEvents } from "../network/Client";
import { Camera } from "./Camera";

export abstract class Scene {
  private static ExitReceipt = new (class {})();

  protected storedEvents: Map<string, Function[]>;
  private actors: Actor[] = [];
  private camera: Camera;

  constructor() {
    this.storedEvents = new Map<string, Function[]>();
  }

  public addActor(actor: Actor) {
    this.actors.push(actor);
    Game.addActor(actor);
  }

  public removeActor(actor: Actor) {
    this.actors = this.actors.filter((element) => element !== actor);
    Game.removeActor(actor);
  }

  public gameLoop() {
    if (this.camera) {
      this.camera.updateOffset();
    }

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
    this.storedEvents.clear();
    NetworkEvents.clear();

    return Scene.ExitReceipt;
  }

  public call(eventName: string, options?) {
    if (this.storedEvents.has(eventName)) {
      //Call the stored callback function
      const functions = this.storedEvents.get(eventName);
      for (let currentFunction of functions) {
        currentFunction(options);
      }
    }
  }

  public on(eventName: string, callback: (options) => void) {
    //Get the list of stored callback functions or an empty list
    let functions: Function[] = this.storedEvents.get(eventName) ?? [];
    // Append the to functions
    functions.push(callback);
    this.storedEvents.set(eventName, functions);
  }

  public setCamera(camera: Camera) {
    this.camera = camera;
  }

  public getCamera() {
    return this.camera;
  }
}
