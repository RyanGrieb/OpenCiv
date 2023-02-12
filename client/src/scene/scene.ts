import { Actor } from "./actor";
import { Game } from "../game";

export abstract class Scene {
  // Use a Map<> ?
  private actors: Actor[] = [];

  constructor() {}

  public addActor(actor: Actor) {
    this.actors.push(actor);
    Game.addActor(actor);
  }
  public gameLoop() {
    this.actors.forEach((actor: Actor) => {
      actor.draw();
    });
  }

  public generateSingleActor(actors: Actor[]): Actor {
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

  public onInitialize() {
  }

  public onDestroyed() {
    this.actors.forEach((actor) => {
      actor.onDestroyed();
    });
    this.actors = [];
  }
}
