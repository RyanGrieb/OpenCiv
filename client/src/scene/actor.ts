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
    Game.drawImageFromActor(this);
  }

  public onCreated() {}
  public onDestroyed(){}

  public call(eventName: string, options?) {
    if (this.storedEvents.has(eventName)) {
      //Call the stored callback function
      const functions = this.storedEvents.get(eventName);
      for(let currentFunction of functions){
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
}
