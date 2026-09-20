import { Actor } from "./Actor";
import { ActorGroup } from "./ActorGroup";
import { Game } from "../Game";
import { GameImage } from "../Assets";
import { SpriteRegion } from "../Assets";
import { Numbers } from "../util/Numbers";

export class SceneBackground {
  public static generateOcean() {
    let tileActors: Actor[] = [];
    for (let y = -1; y < (Game.getInstance().getHeight() + 24) / 24; y++) {
      for (let x = -1; x < (Game.getInstance().getWidth() + 32) / 32; x++) {
        let yPos = y * 24;
        let xPos = x * 32;
        if (y % 2 != 0) {
          xPos += 16;
        }
        tileActors.push(
          new Actor({
            image: Game.getInstance().getImage(GameImage.SPRITESHEET),
            spriteRegion: SpriteRegion.TILE_OCEAN,
            x: xPos,
            y: yPos,
            width: 32,
            height: 32
          })
        );
      }
    }

    return Actor.mergeActors({
      actors: tileActors,
      spriteRegion: true,
      spriteSize: 32
    });
  }

  public static generateRandomGrassland(): Actor {
    return Actor.mergeActors({
      actors: SceneBackground.buildGrasslandTileActors(SceneBackground.getStandaloneColumnBound()),
      spriteRegion: true,
      spriteSize: 32
    });
  }

  /**
   * Like generateRandomGrassland(), but returns a background that continuously pans to the
   * left, generating new terrain chunks ahead of it and discarding ones that scroll off-screen.
   */
  public static generatePanningGrassland(): Actor {
    return new PanningBackground();
  }

  /**
   * A tile chunk meant to be placed edge-to-edge with others at multiples of
   * getGrasslandChunkSpacing(). Unlike generateRandomGrassland()'s standalone background, this
   * deliberately omits the extra right-hand overscan column: that column exists so a lone
   * full-screen background can bleed past the visible edge, but odd (stagger-shifted) rows
   * reach 16px further right with it than even rows do, leaving a transparent notch at the
   * canvas's own right edge. That notch is harmless off past a standalone background's visible
   * area, but lands exactly on the seam once two chunks are placed side by side, showing as a
   * vertical half-tile-wide gap. Dropping the overscan column keeps every row's right edge
   * flush with the chunk boundary, so the next chunk butts up against it with no gap.
   */
  public static generateGrasslandChunk(xOffset: number): Actor {
    const chunk = Actor.mergeActors({
      actors: SceneBackground.buildGrasslandTileActors(SceneBackground.getChunkColumnBound()),
      spriteRegion: true,
      spriteSize: 32
    });

    // mergeActors() positions the merged actor at its first tile's (negative, overscan) coordinate
    // rather than the canvas origin - override it so xOffset lands exactly on the canvas's left edge.
    chunk.setPosition(xOffset, chunk.getY());
    return chunk;
  }

  /**
   * Horizontal distance between two chunks' origins that keeps their tile grids flush -
   * always a whole number of 32px tile columns.
   */
  public static getGrasslandChunkSpacing(): number {
    return SceneBackground.getChunkColumnBound() * 32;
  }

  private static getStandaloneColumnBound(): number {
    return Math.ceil((Game.getInstance().getWidth() + 32) / 32);
  }

  private static getChunkColumnBound(): number {
    return Math.ceil(Game.getInstance().getWidth() / 32);
  }

  private static buildGrasslandTileActors(columnBound: number): Actor[] {
    let tileActors: Actor[] = [];
    for (let y = -1; y < (Game.getInstance().getHeight() + 24) / 24; y++) {
      for (let x = -1; x < columnBound; x++) {
        let yPos = y * 24;
        let xPos = x * 32;
        if (y % 2 != 0) {
          xPos += 16;
        }
        tileActors.push(
          new Actor({
            image: Game.getInstance().getImage(GameImage.SPRITESHEET),
            spriteRegion: Numbers.safeRandom() < 0.1 ? SpriteRegion.TILE_GRASS_HILL : SpriteRegion.TILE_GRASS,
            x: xPos,
            y: yPos,
            width: 32,
            height: 32
          })
        );
      }
    }

    // Sparse background with a random unit
    for (let y = -1; y < (Game.getInstance().getHeight() + 24) / 24; y++) {
      for (let x = -1; x < columnBound; x++) {
        let yPos = y * 24;
        let xPos = x * 32;
        if (y % 2 != 0) {
          xPos += 16;
        }
        if (Numbers.safeRandom() > 0.02) continue;

        tileActors.push(
          new Actor({
            image: Game.getInstance().getImage(GameImage.SPRITESHEET),
            spriteRegion: SpriteRegion.UNIT_WARRIOR + Math.floor(Numbers.safeRandom() * 9),
            x: xPos,
            y: yPos,
            width: 32,
            height: 32
          })
        );
      }
    }

    return tileActors;
  }
}

// Holds a row of grassland chunks and scrolls them left each frame, swapping the leftmost
// chunk out for a freshly generated one once it fully exits the screen.
class PanningBackground extends ActorGroup {
  private static readonly PAN_SPEED = 15; // pixels per second
  private static readonly CHUNK_COUNT = 3;

  private lastUpdateMs: number;

  constructor() {
    const width = Game.getInstance().getWidth();
    const height = Game.getInstance().getHeight();
    super({ x: 0, y: 0, width, height, cameraApplies: false });

    const spacing = SceneBackground.getGrasslandChunkSpacing();
    for (let i = 0; i < PanningBackground.CHUNK_COUNT; i++) {
      this.addActor(SceneBackground.generateGrasslandChunk(i * spacing));
    }

    this.lastUpdateMs = Date.now();
  }

  public draw(canvasContext: CanvasRenderingContext2D) {
    this.updatePanning();
    super.draw(canvasContext);
  }

  private updatePanning(): void {
    const now = Date.now();
    const distance = (PanningBackground.PAN_SPEED * (now - this.lastUpdateMs)) / 1000;
    this.lastUpdateMs = now;

    for (const chunk of this.actors) {
      chunk.setPosition(chunk.getX() - distance, chunk.getY());
    }

    const leftmostChunk = this.actors[0];
    if (leftmostChunk.getX() + leftmostChunk.getWidth() <= 0) {
      this.removeActor(leftmostChunk);

      const rightmostChunk = this.actors[this.actors.length - 1];
      this.addActor(
        SceneBackground.generateGrasslandChunk(rightmostChunk.getX() + SceneBackground.getGrasslandChunkSpacing())
      );
    }
  }
}
