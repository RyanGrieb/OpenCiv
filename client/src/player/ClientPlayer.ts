import { Game } from "../Game";
import { GameMap } from "../map/GameMap";
import { HoveredTile } from "../map/HoveredTile";
import { Tile } from "../map/Tile";
import { NetworkEvents } from "../network/Client";
import { Numbers } from "../util/Numbers";
import { Vector } from "../util/Vector";
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

    NetworkEvents.on({
      eventName: "zoomToLocation",
      callback: (data) => {
        const gridX = data["x"];
        const gridY = data["y"];
        const tile = GameMap.getTiles()[gridX][gridY];
        const zoomAmount = data["zoomAmount"];
        const x = tile.getCenterPosition()[0];
        const y = tile.getCenterPosition()[1];

        Game.getCurrentScene()
          .getCamera()
          .setPosition(-x + Game.getWidth() / 2, -y + Game.getHeight() / 2);
        Game.getCurrentScene()
          .getCamera()
          .zoom(Game.getWidth() / 2, Game.getHeight() / 2, zoomAmount);
      },
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

    let mouseVector = new Vector(mouseX, mouseY);
    let mouseExtremeVector = new Vector(mouseX + 1000, mouseY);

    let gridX = Math.floor(mouseX / Tile.WIDTH);
    let gridY = Math.floor(mouseY / 25); // NOTE: We use 25 since thats how much were offsetting the tiles during map creation. (Height is still 32..)

    // gridX is shifted 0.5 to the right on odd y values...
    if (gridY % 2 != 0) {
      gridX = Math.floor((mouseX - Tile.WIDTH / 2) / Tile.WIDTH);
    }

    let estimatedTile: Tile = undefined;
    let accurateTile: Tile = undefined;

    // Ensure tile is inside map dimensions, if not account for border tiles...
    if (
      gridX >= GameMap.getWidth() ||
      gridX < 0 ||
      gridY >= GameMap.getHeight() ||
      gridY < 0 ||
      // We also check for mouse values that could indicate were out of bounds...
      mouseY < 6 ||
      mouseX < 15 ||
      mouseX > GameMap.getWidth() * 32
    ) {
      const adjBorderTiles = GameMap.getAdjacentTiles(gridX, gridY);
      const clampedBorderTile =
        GameMap.getTiles()[Numbers.clamp(gridX, 0, GameMap.getWidth() - 1)][
          Numbers.clamp(gridY, 0, GameMap.getHeight() - 1)
        ];
      adjBorderTiles.push(clampedBorderTile); // Also push clamped tile.

      let foundAdjBorderTile = false;
      for (const adjTile of adjBorderTiles) {
        if (!adjTile) continue;
        if (
          Vector.isInsidePolygon(
            adjTile.getVectors(),
            mouseVector,
            mouseExtremeVector
          )
        ) {
          accurateTile = adjTile;
          foundAdjBorderTile = true;
        }
      }
      if (!foundAdjBorderTile) {
        this.hoveredTile.setRepresentedTile(undefined);
        return;
      }
    } else {
      // If were inside the map, handle things in our original manner...
      // Get rough estimate of where the nearest tile to the mouse is. (Accurate enough to just check it's adjacent tiles)
      estimatedTile = GameMap.getTiles()[gridX][gridY];
      if (!estimatedTile) {
        console.log("on border of map?");
        return;
      }

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
