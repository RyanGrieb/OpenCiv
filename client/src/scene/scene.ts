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
    actors.forEach((actor: Actor) => {
      const spriteX = parseInt(actor.getSprite().split(",")[0]) * 32;
      const spriteY = parseInt(actor.getSprite().split(",")[1]) * 32;

      // Create dummy canvas to get pixel data of the actor sprite
      let canvas = document.createElement("canvas"); // TODO: Hide this guy.
      canvas.width = actor.getWidth();
      canvas.height = actor.getHeight();
      canvas.getContext("2d").drawImage(
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

      var pixelData = canvas.getContext('2d').getImageData(0, 0, 1, 1).data;
      console.log(pixelData)
    });
    return actors[0];
  }

  public onInitialize() {}
  public onDestroyed() {}
}
