import { SpriteRegion, GameImage } from "../Assets";
import { Game } from "../Game";
import { SceneObject } from "./SceneObject";

export interface ActorOptions {
  color?: string;
  image?: HTMLImageElement;
  spriteRegion?: SpriteRegion; // Select a portion of the provided image
  x: number;
  y: number;
  width: number;
  height: number;
  z?: number;
  rotation?: number;
  transparency?: number;
  cameraApplies?: boolean;
}

export class Actor implements SceneObject {
  protected color: string;
  protected image: HTMLImageElement;
  protected spriteRegion?: SpriteRegion; // Location of sprite on spritesheet

  protected x: number;
  protected y: number;
  protected z: number;
  protected width: number;
  protected height: number;
  protected rotation: number;
  protected transparency: number;
  protected storedEvents: Map<string, Function[]>;
  protected mouseInside: boolean;
  protected cameraApplies: boolean;
  protected drawSpriteRegion: boolean; // Draw region from spritesheet

  constructor(actorOptions: ActorOptions) {
    this.storedEvents = new Map<string, Function[]>();
    this.color = actorOptions.color;
    this.image = actorOptions.image;
    this.spriteRegion = actorOptions.spriteRegion;
    this.x = actorOptions.x;
    this.y = actorOptions.y;
    this.z = actorOptions.z;
    this.width = actorOptions.width;
    this.height = actorOptions.height;
    this.rotation = actorOptions.rotation ?? 0;
    this.transparency = actorOptions.transparency ?? 1;
    this.cameraApplies =
      actorOptions.cameraApplies === undefined
        ? true
        : actorOptions.cameraApplies;

    this.on("mousemove", (options) => {
      if (this.insideActor(options.x, options.y)) {
        if (!this.mouseInside) {
          this.call("mouse_enter");
          this.mouseInside = true;
        }
      } else {
        if (this.mouseInside) {
          this.call("mouse_exit");
        }
        this.mouseInside = false;
      }
    });

    this.on("mouseup", (options) => {
      if (this.insideActor(options.x, options.y) && options.button === 0) {
        //FIXME: Distinguish mouse_up & mouse_click_up better?
        this.call("clicked");
      }
    });

    if (this.spriteRegion) {
      this.drawSpriteRegion = true; // Since we reference a sprite region variable
    }

    // Apply color to actor image.. TODO: Handle non-sprite region actors.
    if (this.color && this.image && this.spriteRegion) {
      this.setColor(this.color);
    }
  }

  public setColor(color: string) {
    this.color = color;

    const canvas = document.getElementById(
      "auxillary_canvas"
    ) as HTMLCanvasElement;
    const context = canvas.getContext("2d");

    // Set the canvas dimensions to match the image dimensions.
    canvas.width = this.width;
    canvas.height = this.height;
    context.clearRect(0, 0, canvas.width, canvas.height);

    //TODO: Handle non-sprite region actors
    if (this.spriteRegion) {
      // Draw the image on the canvas.
      const spriteX = parseInt(this.getSpriteRegion().split(",")[0]) * 32;
      const spriteY = parseInt(this.getSpriteRegion().split(",")[1]) * 32;

      context.drawImage(
        Game.getImage(GameImage.SPRITESHEET),
        spriteX,
        spriteY,
        32,
        32,
        0,
        0,
        this.getWidth(),
        this.getHeight()
      );
    }

    // Apply color using globalCompositeOperation.
    context.globalCompositeOperation = "source-in";

    context.fillStyle = this.color;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Replace the original image source with the modified canvas image.
    const dataURL = canvas.toDataURL();
    const image = new Image();
    image.width = canvas.width;
    image.height = canvas.height;
    image.src = dataURL;
    this.image = image;

    this.drawSpriteRegion = false; // Since we are not referencing the sprite region directly anymore.
    context.globalCompositeOperation = "source-out";
  }

  public getZIndex(): number {
    return this.z;
  }

  public setZValue(value: number): void {
    this.z = value;
  }

  public draw(canvasContext: CanvasRenderingContext2D) {
    if (!this.image && this.color) {
      Game.drawRect({
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        color: this.color,
        fill: true,
        canvasContext: canvasContext,
      });
    } else if (this.image) {
      Game.drawImageFromActor(this, canvasContext);
    } else {
      console.log("Warning: Nothing for actor can be drawn:" + this);
    }
  }

  public onCreated() {}
  public onDestroyed() {}

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

  public insideActor(x: number, y: number): boolean {
    //FIXME: The actor should have a scene parent object
    if (this.cameraApplies && Game.getCurrentScene().getCamera()) {
      const zoom = Game.getCurrentScene().getCamera().getZoomAmount();
      const cameraX = Game.getCurrentScene().getCamera().getX();
      const cameraY = Game.getCurrentScene().getCamera().getY();

      // Adjust the x and y coordinates relative to the camera
      x = (x - cameraX) / zoom;
      y = (y - cameraY) / zoom;
    }

    if (x >= this.x && x <= this.x + this.width) {
      if (y >= this.y && y <= this.y + this.height) {
        return true;
      }
    }
    return false;
  }

  public setImage(image: GameImage) {
    //TODO: Support HTMLImageElement
    this.image = Game.getImage(image);
  }

  public setSpriteRegion(spriteRegion: SpriteRegion) {
    this.spriteRegion = spriteRegion;
  }

  public getImage(): HTMLImageElement {
    return this.image;
  }

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }

  public getColor(): string {
    return this.color;
  }

  public getSpriteRegion() {
    return this.spriteRegion;
  }

  public canDrawSpriteRegion() {
    return this.drawSpriteRegion;
  }

  public getRotation(): number {
    return this.rotation;
  }

  public setRotation(rotation: number) {
    this.rotation = rotation;
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public getRotationOriginX(): number {
    return 0;
  }

  public getRotationOriginY(): number {
    return 0;
  }

  public getTransparency(): number {
    return this.transparency;
  }

  public static mergeActors(options: {
    actors: Actor[];
    spriteRegion: boolean;
    spriteSize?: number;
    canvasWidth?: number;
    canvasHeight?: number;
  }): Actor {
    // Create dummy canvas to get pixel data of the actor sprite

    let canvas = document.getElementById(
      "auxillary_canvas"
    ) as HTMLCanvasElement;
    let greatestXWidth = 0; // The width of the actor w/ the greatest x.
    let greatestYHeight = 0; // The height of the actor w/ the greatest y.
    let greatestX = 0;
    let greatestY = 0;

    options.actors.forEach((actor: Actor) => {
      if (actor.getX() > greatestX) {
        greatestX = actor.getX();
        greatestXWidth = actor.getWidth();
      }
      if (actor.getY() > greatestY) {
        greatestY = actor.getY();
        greatestYHeight = actor.getHeight();
      }
    });
    canvas.width = options.canvasWidth || greatestX + greatestXWidth + 1000;
    canvas.height = options.canvasHeight || greatestY + greatestYHeight + 1000;

    const ctx = canvas.getContext("2d");

    options.actors.forEach((actor: Actor) => {
      actor.draw(ctx);
    });

    let image = new Image();
    image.src = canvas.toDataURL();

    let mergedActor: Actor = new Actor({
      image: image,
      x: options.actors[0].getX(),
      y: options.actors[0].getY(),
      width: canvas.width,
      height: canvas.height,
    });

    return mergedActor;
  }

  public setSize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public setCameraApplies(value: boolean) {
    this.cameraApplies = value;
  }

  public isCameraApplied() {
    return this.cameraApplies;
  }

  /**
   * Returns the variable that keeps track of this. NOT always true as this is outdated compared to insideActor().
   * @returns
   */
  public isMouseInside() {
    return this.mouseInside;
  }

  public setMouseInside(value: boolean) {
    this.mouseInside = value;
  }
}
