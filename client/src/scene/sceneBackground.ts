import { Actor } from "./actor";
import { Game } from "../game";
import { GameImage } from "../assets";
import { SpriteRegion } from "../assets";

export class SceneBackground {
  public static generateOcean() {
    let tileActors: Actor[] = [];
    for (let y = -1; y < (Game.getHeight() + 24) / 24; y++) {
      for (let x = -1; x < (Game.getWidth() + 32) / 32; x++) {
        let yPos = y * 24;
        let xPos = x * 32;
        if (y % 2 != 0) {
          xPos += 16;
        }
        tileActors.push(
          new Actor({
            image: Game.getImage(GameImage.SPRITESHEET),
            spriteRegion: SpriteRegion.OCEAN,
            x: xPos,
            y: yPos,
            width: 32,
            height: 32,
          })
        );
      }
    }

    return Actor.mergeActors({ actors: tileActors, spriteRegion: true, spriteSize: 32 });
  }
  public static generateRandomGrassland(): Actor {
    let tileActors: Actor[] = [];
    for (let y = -1; y < (Game.getHeight() + 24) / 24; y++) {
      for (let x = -1; x < (Game.getWidth() + 32) / 32; x++) {
        let yPos = y * 24;
        let xPos = x * 32;
        if (y % 2 != 0) {
          xPos += 16;
        }
        tileActors.push(
          new Actor({
            image: Game.getImage(GameImage.SPRITESHEET),
            spriteRegion: Math.random() < 0.1 ? SpriteRegion.GRASS_HILL : SpriteRegion.GRASS,
            x: xPos,
            y: yPos,
            width: 32,
            height: 32,
          })
        );
      }
    }

    // Sparse background with a random unit
    //const spriteRegionNum = Math.floor(Math.random() * 9); // Random sprite region b/w 0-2
    for (let y = -1; y < (Game.getHeight() + 24) / 24; y++) {
      for (let x = -1; x < (Game.getWidth() + 32) / 32; x++) {
        let yPos = y * 24;
        let xPos = x * 32;
        if (y % 2 != 0) {
          xPos += 16;
        }
        if (Math.random() > 0.02) continue;

        tileActors.push(
          new Actor({
            image: Game.getImage(GameImage.SPRITESHEET),
            spriteRegion: Object.values(SpriteRegion)[Math.floor(Math.random() * 9)],
            x: xPos,
            y: yPos,
            width: 32,
            height: 32,
          })
        );
      }
    }

    return Actor.mergeActors({ actors: tileActors, spriteRegion: true, spriteSize: 32 });
  }
}
