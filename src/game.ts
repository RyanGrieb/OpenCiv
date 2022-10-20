import { Actor } from "./scene/actor";
import { Scene } from "./scene/scene";
import {Textures} from "./assets"

export interface TextOptions {
  text: string;
  x?: number;
  y?: number;
  actor?: Actor;
  color?: string;
}

export interface GameOptions {
  /**
   * List of NodeRequire[] objects
   */
  assetList: NodeRequire[];

  /**
   * Color of the canvas background
   */
  canvasColor?: string;
}

export class Game {
  private static canvas: HTMLCanvasElement;
  private static canvasContext: CanvasRenderingContext2D;
  private static scenes: Map<string, Scene>;
  private static currentScene: Scene;
  private static images = [];
  private static countedFrames: number = 0;
  private static lastTimeUpdate = Date.now();
  private static fps: number = 0;
  private static actors: Actor[] = [];

  public static init(options: GameOptions, callback: () => void) {
    this.scenes = new Map<string, Scene>();
    //Initialize canvas
    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.canvasContext = this.canvas.getContext("2d");
    this.canvasContext.fillStyle = options.canvasColor ?? "white";
    this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvasContext.font = "12px Times new Roman";

    //Initialize canvas listeners
    this.canvas.addEventListener("mousemove", (event) => {
      this.actors.forEach((actor) => {
        actor.call("mouse_move", { x: event.clientX, y: event.clientY });
      });
    });

    let promise = this.loadAssetPromise(options.assetList);

    promise.then((res) => {
      console.log("All assets loaded...");

      //Update HTML & show canvas
      document.getElementById("loading_element").setAttribute("hidden", "true");
      document.getElementById("canvas").removeAttribute("hidden");
      window.requestAnimationFrame(() => {
        this.gameLoop();
      });

      // Call the callback loop, now we can progress with adding actors,scenes,ect.
      callback();
    });
  }

  public static gameLoop() {
    this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (Date.now() - this.lastTimeUpdate >= 1000) {
      this.fps = this.countedFrames;
      this.lastTimeUpdate = Date.now();
      this.countedFrames = 0;
    }

    // Call the gameloop
    this.currentScene.gameLoop();

    this.drawText({ text: "FPS: " + this.fps, x: 0, y: 10, color: "black" });

    this.countedFrames++;
    window.requestAnimationFrame(() => {
      this.gameLoop();
    });
  }

  public static loadAssetPromise(assetList): Promise<unknown> {
    let imagesLoaded: number = 0;

    const resultPromise = new Promise((resolve, reject) => {
      for (let index in assetList) {
        let image = new Image();
        image.onload = () => {
          imagesLoaded++;
          console.log("Loaded: " + assetList[index]);
          if (imagesLoaded == assetList.length) {
            // We loaded all images, resolve the promise
            resolve(0);
          }
        };
        image.src = assetList[index];
        this.images.push(image);
      }
    });

    return resultPromise;
  }

  public static addScene(sceneName: string, scene: Scene) {
    this.scenes.set(sceneName, scene);
  }

  public static setScene(sceneName: string) {
    if (this.currentScene != null) {
      this.currentScene.onDestroyed();
    }
    this.currentScene = this.scenes.get(sceneName);
    this.currentScene.onInitialize();
  }

  public static addActor(actor: Actor) {
    console.log("Add actor");
    this.actors.push(actor);
    this.drawImageFromActor(actor);
    actor.onCreated();
  }

  public static drawImageFromActor(actor: Actor) {
    this.canvasContext.drawImage(
      actor.getImage(),
      actor.getX(),
      actor.getY(),
      actor.getWidth(),
      actor.getHeight()
    );
  }

  public static drawText(textOptions: TextOptions) {
    //FIXME: Use cache for meausring text..
    const metrics = this.canvasContext.measureText(textOptions.text);
    let textHeight =
      metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

    const xPos = textOptions.x ?? textOptions.actor.getX();
    const yPos =
      textOptions.y ??
      textOptions.actor.getY() +
        textOptions.actor.getHeight() / 2 +
        textHeight / 2;
    const oldColor = this.canvasContext.fillStyle;

    this.canvasContext.fillStyle = textOptions.color;
    this.canvasContext.fillText(textOptions.text, xPos, yPos);
    this.canvasContext.fillStyle = oldColor;
  }

  private static getImages(): HTMLImageElement[] {
    return this.images;
  }

  public static getImage(textureType: Textures){
    return this.images[textureType];
  }

  public static getHeight(): number {
    return this.canvas.height;
  }

  public static getWidth(): number {
    return this.canvas.width;
  }

  public static getCanvasContext() {
    return this.canvasContext;
  }
}
