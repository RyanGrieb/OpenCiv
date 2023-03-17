import { Game } from "../Game";
import { GameMap } from "../map/GameMap";
import { HoveredTile } from "../map/HoveredTile";
import { Tile } from "../map/Tile";
import { Vector } from "../util/Util";
import { AbstractPlayer } from "./AbstractPlayer";

export class ClientPlayer extends AbstractPlayer {
  private hoveredTile: HoveredTile;

  constructor(name: string) {
    super(name);

    Game.getCurrentScene().on("mapLoaded", () => {
      this.hoveredTile = new HoveredTile(9999, 9999);
      this.hoveredTile.loadImage().then(() => {
        Game.getCurrentScene().addActor(this.hoveredTile);
      });
    });

    Game.getCurrentScene().on("mousemove", (options) => {
      const mouseX = options.x;
      const mouseY = options.y;

      this.updateHoveredTile(mouseX, mouseY);
    });
  }

  private updateHoveredTile(mouseX: number, mouseY: number) {
    if (!this.hoveredTile) return;

    let zoom = Game.getCurrentScene().getCamera().getZoomAmount();

    let camX = -Game.getCurrentScene().getCamera().getX();
    let camY = -Game.getCurrentScene().getCamera().getY();

    // Adjust mouse position base on where the camera is located
    mouseX += camX;
    mouseY += camY;
    mouseX /= zoom;
    mouseY /= zoom;

    let gridX = Math.floor(mouseX / Tile.WIDTH);
    let gridY = Math.floor(mouseY / 25); // NOTE: We use 25 since thats how much were offsetting the tiles during map creation. (Height is still 32)

    // gridX is shifted 0.5 to the right on odd y values...
    if (gridY % 2 != 0) {
      gridX = Math.floor((mouseX - Tile.WIDTH / 2) / Tile.WIDTH);
    }

    //console.log("Mouse: " + mouseX + "," + mouseY);

    // Ensure tile is inside map dimensions
    if (gridX >= GameMap.getWidth() || gridX < 0) {
      this.hoveredTile.setRepresentedTile(undefined);
      return;
    }
    if (gridY >= GameMap.getHeight() || gridY < 0) {
      this.hoveredTile.setRepresentedTile(undefined);
      return;
    }

    //gridX = clamp(gridX, 0, GameMap.getWidth() - 1);
    //gridY = clamp(gridY, 0, GameMap.getHeight() - 1);

    // Get rough estimate of where the nearest tile to the mouse is. (Accurate enough to just check it's adjacent tiles)
    const estimatedTile: Tile = GameMap.getTiles()[gridX][gridY];
    if (!estimatedTile) return;

    let accurateTile = undefined;
    let mouseVector = new Vector(mouseX, mouseY);
    let mouseExtremeVector = new Vector(mouseX + 1000, mouseY);

    if (
      Vector.isInsidePolygon(
        estimatedTile.getVectors(),
        mouseVector,
        mouseExtremeVector
      )
    ) {
      accurateTile = estimatedTile;
    } else {
      for (const adjTile of estimatedTile.getAdjacentTiles()) {
        if (!adjTile) continue;
        if (
          Vector.isInsidePolygon(
            adjTile.getVectors(),
            mouseVector,
            mouseExtremeVector
          )
        ) {
          accurateTile = adjTile;
        }
      }
    }

    if (!accurateTile) {
      return;
    }

    //console.log("Tile: " + accurateTile.getX() + "," + accurateTile.getY());

    if (this.hoveredTile !== accurateTile) {
      this.hoveredTile.setRepresentedTile(accurateTile);
    }
  }
}
