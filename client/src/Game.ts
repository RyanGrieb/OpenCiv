import { Actor } from "./scene/Actor";
import { Scene } from "./scene/Scene";
import { GameImage } from "./Assets";
import { NetworkEvents } from "./network/Client";
import { Line } from "./scene/Line";

export interface TextOptions {
  text: string;
  height?: number;
  x?: number;
  y?: number;
  actor?: Actor;
  color?: string;
  font?: string;
  shadowColor?: string;
  lineWidth?: number;
  lineHeight?: number;
  shadowBlur?: number;
  applyCamera?: boolean;
  transparency?: number;
  maxWidth?: number;
}
export interface GameOptions {
  /**
   * List of string[] objects
   */
  assetList: string[];

  /**
   * Color of the canvas background
   */
  canvasColor?: string;
}

export class Game {
  private static gameInstance: Game;

  private canvas: HTMLCanvasElement;
  private canvasContext: CanvasRenderingContext2D;
  private scenes: Map<string, Scene>;
  private currentScene: Scene;
  private images = [];
  private countedFrames: number = 0;
  private lastTimeUpdate = Date.now();
  private fps: number = 0;
  private actors: Actor[] = [];
  private lines: Line[] = [];
  private measureQueue: string[];
  private mouseX: number;
  private mouseY: number;
  private runGameLoop: boolean;
  private wrappedTextCache: { [key: string]: [string, number, number] } = {};
  private resizeTimer: NodeJS.Timeout;
  private oldWidth: number;
  private oldHeight: number;
  private dpr: number;

  private getWorldX(clientX: number): number {
    return clientX * this.dpr;
  }

  private getWorldY(clientY: number): number {
    return clientY * this.dpr;
  }


  private constructor(options: GameOptions, assetsLoadedCallback: () => void) {
    this.scenes = new Map<string, Scene>();
    //Initialize canvas
    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * this.dpr;
    this.canvas.height = window.innerHeight * this.dpr;
    this.canvas.style.width = window.innerWidth + "px";
    this.canvas.style.height = window.innerHeight + "px";

    this.canvasContext = this.canvas.getContext("2d");
    this.canvasContext.fillStyle = options.canvasColor ?? "white";
    this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvasContext.font = "12px Times new Roman";
    this.canvasContext.imageSmoothingEnabled = false;
    this.measureQueue = [];
    this.runGameLoop = true;


    //Initialize canvas listeners. TODO: Make this less redundant w/ a helper function
    this.canvas.addEventListener("mousemove", (event) => {
      this.actors.forEach((actor) => {
        actor.call("mousemove", {
          x: this.getWorldX(event.clientX),
          y: this.getWorldY(event.clientY),
          // We provide direct clientX & clientY for instances where we don't want to apply the DPR or camera transformations.
          clientX: event.clientX,
          clientY: event.clientY,
        });
      });

      if (this.currentScene) {
        this.currentScene.call("mousemove", {
          x: this.getWorldX(event.clientX),
          y: this.getWorldY(event.clientY),
          // We provide direct clientX & clientY for instances where we don't want to apply the DPR or camera transformations.
          clientX: event.clientX,
          clientY: event.clientY,
          button: event.button
        });
      }

      this.mouseX = event.clientX;
      this.mouseY = event.clientY;
    });

    this.canvas.addEventListener("mousedown", (event) => {
      this.actors.forEach((actor) => {
        actor.call("mousedown", {
          x: this.getWorldX(event.clientX),
          y: this.getWorldY(event.clientY),
          // We provide direct clientX & clientY for instances where we don't want to apply the DPR or camera transformations.
          clientX: event.clientX,
          clientY: event.clientY,
          button: event.button
        });
      });

      if (this.currentScene) {
        this.currentScene.call("mousedown", {
          x: this.getWorldX(event.clientX),
          y: this.getWorldY(event.clientY),
          // We provide direct clientX & clientY for instances where we don't want to apply the DPR or camera transformations.
          clientX: event.clientX,
          clientY: event.clientY,
          button: event.button
        });
      }
    });

    this.canvas.addEventListener("mouseup", (event) => {
      this.actors.forEach((actor) => {
        actor.call("mouseup", {
          x: this.getWorldX(event.clientX),
          y: this.getWorldY(event.clientY),
          // We provide direct clientX & clientY for instances where we don't want to apply the DPR or camera transformations.
          clientX: event.clientX,
          clientY: event.clientY,
          button: event.button
        });
      });

      if (this.currentScene) {
        this.currentScene.call("mouseup", {
          x: this.getWorldX(event.clientX),
          y: this.getWorldY(event.clientY),
          // We provide direct clientX & clientY for instances where we don't want to apply the DPR or camera transformations.
          clientX: event.clientX,
          clientY: event.clientY,
          button: event.button
        });
      }
    });

    this.canvas.addEventListener("mouseleave", (event) => {
      this.actors.forEach((actor) => {
        actor.call("mouseleave", { x: this.getWorldX(event.clientX), y: this.getWorldY(event.clientY) });
      });

      if (this.currentScene) {
        this.currentScene.call("mouseleave", {
          x: this.getWorldX(event.clientX),
          y: this.getWorldY(event.clientY)
        });
      }
    });

    this.canvas.addEventListener("wheel", (event) => {
      this.actors.forEach((actor) => {
        actor.call("wheel", { deltaY: event.deltaY });
      });

      if (this.currentScene) {
        this.currentScene.call("wheel", {
          x: event.offsetX,
          y: event.offsetY,
          deltaY: event.deltaY
        });
      }
    });

    document.body.addEventListener("keydown", (event) => {
      this.actors.forEach((actor) => {
        actor.call("keydown", { key: event.key });
      });

      if (this.currentScene) {
        this.currentScene.call("keydown", { key: event.key });
      }
    });

    document.body.addEventListener("keyup", (event) => {
      this.actors.forEach((actor) => {
        actor.call("keyup", { key: event.key });
      });

      if (this.currentScene) {
        this.currentScene.call("keyup", { key: event.key });
      }
    });
    document.addEventListener("contextmenu", (event) => event.preventDefault());

    window.addEventListener("resize", () => {
      clearTimeout(this.resizeTimer);

      this.resizeTimer = setTimeout(() => {
        this.oldWidth = this.canvas.width;
        this.oldHeight = this.canvas.height;
        this.dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * this.dpr;
        this.canvas.height = window.innerHeight * this.dpr;
        this.canvas.style.width = window.innerWidth + "px";
        this.canvas.style.height = window.innerHeight + "px";

        if (this.currentScene) {
          this.currentScene.redraw();
        }
        this.canvasContext.fillStyle = options.canvasColor ?? "white";
        this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvasContext.font = "12px Times new Roman";
        this.canvasContext.imageSmoothingEnabled = false;
      }, 300);
    });

    let promise = this.loadAssetsPromise(options.assetList);

    promise.then((res) => {
      console.log("All assets loaded...");

      //Update HTML & show canvas
      document.getElementById("loading_element").style.display = "none";
      document.getElementById("canvas").removeAttribute("hidden");
      window.requestAnimationFrame(() => {
        this.gameLoop();
      });

      // Call the callback loop, now we can progress with adding actors,scenes,ect.
      assetsLoadedCallback();
    });

    // Initialize our global network events
    NetworkEvents.on({
      eventName: "setScene",
      parentObject: this,
      callback: (data) => {
        this.setScene(data["scene"]);
      },
      globalEvent: true
    });
    NetworkEvents.on({
      eventName: "messageBox",
      parentObject: this,
      callback: (data) => {
        //{"event":"messageBox","messageName":"gameInProgress","message":"Error: Game in progress!"}
        const message = data["message"];
        alert(message);
      },
      globalEvent: true
    });
  }

  public static getInstance() {
    return this.gameInstance;
  }

  public static createInstance(options: GameOptions, assetsLoadedCallback: () => void) {
    this.gameInstance = new Game(options, assetsLoadedCallback);
  }

  public gameLoop() {
    if (!this.runGameLoop) return;

    this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (Date.now() - this.lastTimeUpdate >= 1000) {
      this.fps = this.countedFrames;
      this.lastTimeUpdate = Date.now();
      this.countedFrames = 0;
    }

    // Call the gameloop for the current scene
    this.currentScene.gameLoop();

    const fpsText = "FPS: " + this.fps;
    this.canvasContext.save();
    this.canvasContext.font = "12px sans";
    const metrics = this.canvasContext.measureText(fpsText);
    const textWidth = metrics.width;
    const padding = 2;
    const x = Math.max(this.getWidth() - textWidth - padding, padding);
    const y = this.getHeight() - 12;
    this.drawText(
      {
        text: fpsText,
        x,
        y,
        color: "white",
        font: "12px sans"
      },
      this.canvasContext
    );
    this.canvasContext.restore();

    this.countedFrames++;
    window.requestAnimationFrame(() => {
      this.gameLoop();
    });
  }

  private async loadAssetsPromise(assetList: string[]): Promise<void> {
    console.log("Asset list:", JSON.stringify(assetList, null, 2));

    await Promise.all(assetList.map((url, index) => {
      return new Promise<void>((resolve, reject) => {
        console.log("Starting load for:", url);

        const image = new Image();

        // Add crossOrigin to prevent CORS issues
        image.crossOrigin = "Anonymous";

        image.onload = () => {
          console.log("✅ Successfully loaded:", url);
          this.images[index] = image;
          resolve();
        };

        image.onerror = (e) => {
          console.error("❌ Load failed for:", url);
          console.error("Error event:", e);
          reject(`Failed to load ${url}`);
        };

        // Create absolute URL to ensure proper loading
        try {
          const absoluteUrl = new URL(url, window.location.href).href;
          console.log("Loading absolute URL:", absoluteUrl);
          image.src = absoluteUrl;
        } catch (error) {
          console.error("Invalid URL:", url, error);
          reject(`Invalid URL: ${url}`);
        }
      });
    }));
  }


  public addScene(sceneName: string, scene: Scene) {
    this.scenes.set(sceneName, scene);
    scene.setName(sceneName);
  }

  public setScene(sceneName: string) {
    this.actors = [];
    this.wrappedTextCache = {};

    const newScene = this.scenes.get(sceneName);

    if (this.currentScene != null) {
      this.currentScene.onDestroyed(newScene);
    }

    this.currentScene = newScene;
    this.currentScene.onInitialize();
  }

  public addActor(actor: Actor) {
    this.actors.push(actor);
    actor.onCreated();
  }

  public addLine(line: Line) {
    this.lines.push(line);
  }

  public removeLine(line: Line) {
    this.lines = this.lines.filter((element) => element !== line);
  }

  public removeActor(actor: Actor) {
    this.actors = this.actors.filter((element) => element !== actor);
    actor.onDestroyed();
  }

  public drawImageFromActor(actor: Actor, context: CanvasRenderingContext2D) {
    if (!actor.getImage()) {
      console.log("Warning: Attempted to draw empty actor: " + actor.getWidth());
      return;
    }

    let canvasContext = context;

    canvasContext.save();

    // Only apply camera to the Game's main canvas context.
    if (actor.isCameraApplied() && this.currentScene.getCamera() && canvasContext === this.canvasContext) {
      const zoom = this.currentScene.getCamera().getZoomAmount();
      const cameraX = this.currentScene.getCamera().getX();
      const cameraY = this.currentScene.getCamera().getY();
      const dpr = this.dpr || 1;
      canvasContext.setTransform(
        zoom * dpr, 0,
        0, zoom * dpr,
        cameraX * dpr, cameraY * dpr
      );
    }

    canvasContext.translate(actor.getRotationOriginX(), actor.getRotationOriginY());
    canvasContext.rotate(actor.getRotation());
    canvasContext.translate(-actor.getRotationOriginX(), -actor.getRotationOriginY());

    canvasContext.globalAlpha = actor.getTransparency();

    if (actor.canDrawSpriteRegion()) {
      const spriteX = parseInt(actor.getSpriteRegion().split(",")[0]) * 32;
      const spriteY = parseInt(actor.getSpriteRegion().split(",")[1]) * 32;

      canvasContext.drawImage(
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
      canvasContext.drawImage(actor.getImage(), actor.getX(), actor.getY(), actor.getWidth(), actor.getHeight());
    }

    canvasContext.globalAlpha = 1;

    canvasContext.restore();
  }

  public async waitUntilMeasureQueueIsEmpty(): Promise<void> {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (this.measureQueue.length < 1) {
          clearInterval(interval);
          resolve();
        }
      }, 10);
    });
  }

  public async measureText(text: string, font: string): Promise<[number, number]> {
    await this.waitUntilMeasureQueueIsEmpty(); // Wait for other measurements to complete, then continue..
    this.measureQueue.push(text);
    this.canvasContext.save();
    this.canvasContext.font = font || "24px serif";

    await document.fonts.ready; // Wait for the async function to complete, then measure text.s

    const metrics = this.canvasContext.measureText(text);
    let height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    this.canvasContext.restore();
    //FIXME: This fails when we have a queue of the same text, support text & font simultaneously
    this.measureQueue = this.measureQueue.filter((element) => element !== text);

    return [metrics.width, height];
  }

  /**
   * Returns a wrapped text string and height of the wrapped text, and stores the wrapped text in a cache.
   */
  public async getWrappedText(text: string, font: string, maxWidth: number): Promise<[string, number, number]> {
    let currentWidth = 0;

    // Check if we have the wrapped text in cache:
    if (this.wrappedTextCache[text]) {
      return this.wrappedTextCache[text];
    }

    const [_, unwrappedWordHeight] = await this.measureText(text, font);

    //Copy the string
    let modifiedText = text + "";
    let wrappedHeight = unwrappedWordHeight;

    for (const word of modifiedText.split(" ")) {
      const [wordWidth, wordHeight] = await this.measureText(word + " ", font);

      if (currentWidth + wordWidth > maxWidth) {
        modifiedText = modifiedText.replace(word, "\n" + word);
        currentWidth = wordWidth;
        wrappedHeight += wordHeight;
      } else {
        currentWidth += wordWidth;
      }
    }

    //Store wrapped text in cache
    this.wrappedTextCache[text] = [modifiedText, wrappedHeight, unwrappedWordHeight];

    return [modifiedText, wrappedHeight, unwrappedWordHeight];
  }

  public drawText(textOptions: TextOptions, canvasContext: CanvasRenderingContext2D) {
    //FIXME: Use cache for meausring text..

    let text = textOptions.text;
    if (!text) {
      return;
    }

    canvasContext.save();

    canvasContext.textBaseline = "top";
    // Only apply camera to the Game's main canvas context. (canvasContext === this.canvasContext)
    if (textOptions.applyCamera && this.currentScene.getCamera() && canvasContext === this.canvasContext) {
      const zoom = this.currentScene.getCamera().getZoomAmount();
      const cameraX = this.currentScene.getCamera().getX();
      const cameraY = this.currentScene.getCamera().getY();
      const dpr = this.dpr || 1;
      canvasContext.setTransform(
        zoom * dpr, 0,
        0, zoom * dpr,
        cameraX * dpr, cameraY * dpr
      );
    }

    canvasContext.globalAlpha = textOptions.transparency;
    canvasContext.fillStyle = textOptions.color;
    canvasContext.font = textOptions.font;
    canvasContext.shadowColor = textOptions.shadowColor ?? "white";
    //this.canvasContext.shadowBlur = textOptions.shadowBlur ?? 0; // FIXME: Find alternative that provides better performance
    canvasContext.lineWidth = textOptions.lineWidth ?? 0; // 4
    const xPos = textOptions.x;
    const yPos = textOptions.y;

    if (textOptions.lineWidth > 0) {
      if (text.includes("\n")) {
        for (const [index, line] of text.split("\n").entries()) {
          canvasContext.strokeText(line, xPos, yPos + textOptions.height * index);
        }
      } else {
        canvasContext.strokeText(text, xPos, yPos);
      }
    }

    if (text.includes("\n")) {
      for (const [index, line] of text.split("\n").entries()) {
        canvasContext.fillText(line, xPos, yPos + textOptions.height * index);
      }
    } else {
      canvasContext.fillText(text, xPos, yPos);
    }

    canvasContext.restore();
  }

  public drawLine(line: Line, canvasContext: CanvasRenderingContext2D) {
    canvasContext.save();

    // Only apply camera to the Game's main canvas context.
    if (this.currentScene.getCamera() && canvasContext === this.canvasContext) {
      const zoom = this.currentScene.getCamera().getZoomAmount();
      const cameraX = this.currentScene.getCamera().getX();
      const cameraY = this.currentScene.getCamera().getY();
      const dpr = this.dpr || 1;
      canvasContext.setTransform(
        zoom * dpr, 0,
        0, zoom * dpr,
        cameraX * dpr, cameraY * dpr
      );
    }

    const x1 = line.getX1();
    const x2 = line.getX2();
    const y1 = line.getY1();
    const y2 = line.getY2();

    canvasContext.globalAlpha = line.getTransparency();
    canvasContext.strokeStyle = line.getColor();
    canvasContext.lineWidth = line.getGirth();
    canvasContext.lineCap = "round";

    canvasContext.beginPath();
    canvasContext.moveTo(x1, y1);
    canvasContext.lineTo(x2, y2);
    canvasContext.stroke();

    canvasContext.restore();
  }

  public drawRect({
    x,
    y,
    width,
    height,
    color,
    canvasContext,
    fill
  }: {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    canvasContext: CanvasRenderingContext2D;
    fill: boolean;
  }) {
    canvasContext.save();
    if (fill) {
      canvasContext.fillStyle = color;
      canvasContext.fillRect(x, y, width, height);
    } else {
      canvasContext.strokeStyle = color;
      canvasContext.strokeRect(x, y, width, height);
    }
    canvasContext.restore();
  }

  public getImage(gameImage: GameImage) {
    return this.images[gameImage];
  }

  public getHeight(): number {
    return this.canvas.height;
  }

  public getWidth(): number {
    return this.canvas.width;
  }

  public getOldHeight(): number {
    return this.oldHeight;
  }

  public getOldWidth(): number {
    return this.oldWidth;
  }

  public getCanvasContext() {
    return this.canvasContext;
  }

  public getCanvas() {
    return this.canvas;
  }

  public getCurrentScene() {
    return this.currentScene;
  }

  /**
   * Return the current scene & cast the class specified in the generic type.
   * @returns
   */
  public getCurrentSceneAs<T extends Scene>(): T {
    return this.currentScene as T;
  }

  public getMouseX() {
    return this.mouseX;
  }
  public getMouseY() {
    return this.mouseY;
  }

  public getRelativeMouseX() {
    return this.mouseX - (this.currentScene.getCamera()?.getX() ?? 0);
  }
  public getRelativeMouseY() {
    return this.mouseY - (this.currentScene.getCamera()?.getY() ?? 0);
  }

  public toggleGameLoop() {
    this.runGameLoop = !this.runGameLoop;
  }

  public setCursor(type: string) {
    this.canvas.style.cursor = type;
  }

  public getDPR(): number {
    return this.dpr;
  }
}
