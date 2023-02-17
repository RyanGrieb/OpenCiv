import { SpriteRegion, GameImage } from "../assets";
import { Game } from "../game";

export interface ActorOptions {
  color?: string;
  image?: HTMLImageElement;
  spriteRegion?: SpriteRegion; // Select a portion of the provided image
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Actor {
  protected color: string;
  protected image: HTMLImageElement;
  protected spriteRegion?: SpriteRegion;

  protected x: number;
  protected y: number;
  protected width: number;
  protected height: number;
  protected storedEvents: Map<string, Function[]>;
  protected mouseInside: boolean;

  constructor(actorOptions: ActorOptions) {
    this.storedEvents = new Map<string, Function[]>();
    this.color = actorOptions.color;
    this.image = actorOptions.image;
    this.spriteRegion = actorOptions.spriteRegion;
    this.x = actorOptions.x;
    this.y = actorOptions.y;
    this.width = actorOptions.width;
    this.height = actorOptions.height;

    this.on("mouse_move", (options) => {
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

    this.on("mouse_up", (options) => {
      if (this.insideActor(options.x, options.y)) {
        //FIXME: Distinguish mouse_up & mouse_click_up better?
        this.call("clicked");
      }
    });
  }

  public draw() {
    if (!this.image && this.color) {
      Game.drawRect({
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        color: this.color,
      });
    } else if (this.image) {
      Game.drawImageFromActor(this);
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

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public static mergeActors(actors: Actor[]): Actor {
    // Create dummy canvas to get pixel data of the actor sprite

    let canvas = document.createElement("canvas");
    let greatestXWidth = 0; // The width of the actor w/ the greatest x.
    let greatestYHeight = 0; // The height of the actor w/ the greatest y.
    let greatestX = 0;
    let greatestY = 0;

    actors.forEach((actor: Actor) => {
      if (actor.getX() > greatestX) {
        greatestX = actor.getX();
        greatestXWidth = actor.getWidth();
      }
      if (actor.getY() > greatestY) {
        greatestY = actor.getY();
        greatestYHeight = actor.getHeight();
      }
    });
    canvas.width = greatestX + greatestXWidth;
    canvas.height = greatestY + greatestYHeight;

    actors.forEach((actor: Actor) => {
      const spriteX = parseInt(actor.getSpriteRegion().split(",")[0]) * 32;
      const spriteY = parseInt(actor.getSpriteRegion().split(",")[1]) * 32;
      canvas
        .getContext("2d")
        .drawImage(
          actor.getImage(),
          spriteX,
          spriteY,
          32,
          32,
          actor.getX(),
          actor.getY(),
          actor.getWidth(),
          actor.getHeight()
        );
    });

    canvas.getContext("2d").globalCompositeOperation = "saturation";
    canvas.getContext("2d").fillStyle = "hsl(35,35%,35%)";
    canvas.getContext("2d").fillRect(0, 0, canvas.width, canvas.height);

    let image = new Image();
    image.src = canvas.toDataURL();

    let mergedActor: Actor = new Actor({
      image: image,
      x: actors[0].getX(),
      y: actors[0].getY(),
      width: canvas.width,
      height: canvas.height,
    });

    return mergedActor;
  }
}
