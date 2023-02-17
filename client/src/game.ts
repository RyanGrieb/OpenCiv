import { Actor } from "./scene/actor";
import { Scene } from "./scene/scene";
import { GameImage } from "./assets";
import { Rectangle } from "./ui/rectangle";

export interface TextOptions {
  text: string;
  x?: number;
  y?: number;
  actor?: Actor;
  color?: string;
  font?: string;
  shadowColor?: string;
  lineWidth?: number;
  shadowBlur?: number;
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
  private static measureQueue: string[];

  public static init(options: GameOptions, callback: () => void) {
    this.scenes = new Map<string, Scene>();
    //Initialize canvas
    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.canvasContext = this.canvas.getContext("2d");
    this.canvasContext.fillStyle = options.canvasColor ?? "white";
    this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvasContext.font = "12px Times new Roman";
    this.measureQueue = [];

    //Initialize canvas listeners
    this.canvas.addEventListener("mousemove", (event) => {
      this.actors.forEach((actor) => {
        actor.call("mouse_move", { x: event.clientX, y: event.clientY });
      });
    });

    this.canvas.addEventListener("mouseup", (event) => {
      this.actors.forEach((actor) => {
        actor.call("mouse_up", { x: event.clientX, y: event.clientY });
      });
    });

    document.body.addEventListener("keydown", (event) => {
      this.actors.forEach((actor) => {
        actor.call("keydown", { key: event.key });
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

    // Call the gameloop for the current scene
    this.currentScene.gameLoop();

    this.drawText({ text: "FPS: " + this.fps, x: 0, y: 10, color: "black", font: "12px sans" });

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
    this.actors = [];

    const newScene = this.scenes.get(sceneName);

    if (this.currentScene != null) {
      this.currentScene.onDestroyed();
    }

    this.currentScene = newScene;
    this.currentScene.onInitialize();
  }

  public static addActor(actor: Actor) {
    console.log("Add actor");
    this.actors.push(actor);
    actor.onCreated();
  }

  public static drawImageFromActor(actor: Actor) {
    if (!actor.getImage()) {
      console.log("Warning: Attempted to draw empty actor: " + actor.getWidth());
      return;
    }

    if (actor.getSpriteRegion()) {
      const spriteX = parseInt(actor.getSpriteRegion().split(",")[0]) * 32;
      const spriteY = parseInt(actor.getSpriteRegion().split(",")[1]) * 32;
      this.canvasContext.drawImage(
        actor.getImage(),
        //TODO: Calculate sprite position
        spriteX,
        spriteY,
        32,
        32,
        actor.getX(),
        actor.getY(),
        actor.getWidth(),
        actor.getHeight()
      );
    } else {
      this.canvasContext.drawImage(
        actor.getImage(),
        actor.getX(),
        actor.getY(),
        actor.getWidth(),
        actor.getHeight()
      );
    }
  }

  public static async waitUntilMeasureQueueIsEmpty(): Promise<void> {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (this.measureQueue.length < 1) {
          clearInterval(interval);
          resolve();
        }
      }, 10);
    });
  }

  public static async measureText(text: string, font: string): Promise<[number, number]> {
    await this.waitUntilMeasureQueueIsEmpty(); // Wait for other measurements to complete, then continue..
    this.measureQueue.push(text);
    this.canvasContext.save();
    this.canvasContext.font = font ?? "24px serif";

    await document.fonts.ready; // Wait for the async function to complete, then measure text.s

    const metrics = this.canvasContext.measureText(text);
    let height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    this.canvasContext.restore();
    //FIXME: This fails when we have a queue of the same text, support text & font simultaneously
    this.measureQueue = this.measureQueue.filter((element) => element !== text);

    return [metrics.width, height];
  }

  public static drawText(textOptions: TextOptions) {
    //FIXME: Use cache for meausring text..

    this.canvasContext.save();
    this.canvasContext.fillStyle = textOptions.color;
    this.canvasContext.font = textOptions.font ?? "24px sans-serif";
    this.canvasContext.shadowColor = textOptions.shadowColor ?? "white";
    //this.canvasContext.shadowBlur = textOptions.shadowBlur ?? 0; // FIXME: Find alternative that provides better performance
    this.canvasContext.lineWidth = textOptions.lineWidth ?? 0; // 4
    const xPos = textOptions.x;
    const yPos = textOptions.y;
    if (textOptions.lineWidth > 0) {
      this.canvasContext.strokeText(textOptions.text, xPos, yPos);
    }

    this.canvasContext.fillText(textOptions.text, xPos, yPos);

    this.canvasContext.restore();
  }

  public static drawRect({
    x,
    y,
    width,
    height,
    color,
  }: {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
  }) {
    this.canvasContext.fillStyle = color;
    this.canvasContext.fillRect(x, y, width, height);
  }

  public static getImage(gameImage: GameImage) {
    return this.images[gameImage];
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

  public static getCanvas() {
    return this.canvas;
  }
}
