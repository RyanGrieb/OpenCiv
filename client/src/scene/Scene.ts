import { Actor } from "./Actor";
import { Game } from "../Game";
import { NetworkEvents } from "../network/Client";
import { Camera } from "./Camera";
import { Line } from "./Line";
import { SceneObject } from "./SceneObject";
import { ActorGroup } from "./ActorGroup";

export abstract class Scene {
  protected static ExitReceipt = new (class {})();

  protected storedEvents: Map<string, Function[]>;
  protected firstLoad: boolean;
  private camera: Camera;
  private oldCamera: Camera;
  private sceneObjects: SceneObject[];
  private name: string;

  constructor() {
    this.storedEvents = new Map<string, Function[]>();
    this.sceneObjects = [];
    this.firstLoad = true;
  }

  public setName(name: string) {
    this.name = name;
  }

  public getName() {
    return this.name;
  }

  public addLine(line: Line) {
    this.sceneObjects.push(line);
    this.sortSceneObjects();
    Game.addLine(line);
  }

  public removeLine(line: Line) {
    this.sceneObjects = this.sceneObjects.filter((element) => element !== line);
    this.sortSceneObjects();
    Game.removeLine(line);
  }

  public addActor(actor: Actor) {
    this.sceneObjects.push(actor);
    this.sortSceneObjects();
    Game.addActor(actor);
  }

  public removeActor(actor: Actor) {
    if (!actor) return;

    this.sceneObjects = this.sceneObjects.filter(
      (element) => element !== actor
    );
    this.sortSceneObjects();
    Game.removeActor(actor);
  }

  public gameLoop() {
    if (this.camera) {
      this.camera.updateOffset();
    }

    this.sceneObjects.forEach((object: SceneObject) => {
      object.draw(Game.getCanvasContext());
    });
  }

  public redraw() {
    this.onDestroyed(this);
    this.onInitialize();
  }

  public onInitialize() {}

  public onDestroyed(newScene: Scene): typeof Scene.ExitReceipt {
    this.sceneObjects.forEach((object) => {
      if (object instanceof Actor || object instanceof ActorGroup) {
        const actor = object as Actor;
        actor.call("mouse_exit");
        this.removeActor(object);
      }
    });

    if (this.camera) {
      this.oldCamera = this.camera;
    }

    this.camera = undefined;
    this.sceneObjects = [];
    this.storedEvents.clear();
    NetworkEvents.clear();

    this.firstLoad = false;
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

  public hasActor(actor: Actor) {
    const actorIndex = this.sceneObjects.indexOf(actor);
    if (actorIndex < 0) return false;

    return true;
  }

  public setCamera(camera: Camera) {
    this.camera = camera;
  }

  public getCamera() {
    return this.camera;
  }

  public restoreCamera() {
    this.camera = Camera.fromCamera(this.oldCamera);
  }

  public sortSceneObjects() {
    this.sceneObjects.sort((obj1, obj2) => {
      return obj1.getZIndex() - obj2.getZIndex();
    });
  }
}
