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

  constructor(actorOptions: ActorOptions) {
    this.color = actorOptions.color;
    this.image = actorOptions.image;
    this.x = actorOptions.x;
    this.y = actorOptions.y;
    this.width = actorOptions.width;
    this.height = actorOptions.height;
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
