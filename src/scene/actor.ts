export interface ActorOptions {
  color?: string;
  image: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Actor {
  private color: string;
  private image: HTMLImageElement;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private storedEvents: Map<string, Function>;
  private mouseInside: boolean;

  constructor(actorOptions: ActorOptions) {
    this.storedEvents = new Map<string, Function>();
    this.color = actorOptions.color;
    this.image = actorOptions.image;
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
        this.mouseInside = false;
      }
    });
  }

  public call(eventName: string, options?) {
    if (this.storedEvents.has(eventName)) {
      //Call the stored callback function
      this.storedEvents.get(eventName)(options);
    }
  }

  public on(eventName: string, callback: (options) => void) {
    this.storedEvents.set(eventName, callback);
  }

  public insideActor(x: number, y: number): boolean {
    if (x >= this.x && x <= this.x + this.width) {
      //console.log("in x-bounds");
      if (y >= this.y && y <= this.y + this.height) {
        //console.log("in y-bounds");
        return true;
      }
    }
    return false;
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
}
