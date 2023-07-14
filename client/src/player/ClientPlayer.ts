import { Game } from "../Game";
import { Unit } from "../Unit";
import { GameMap } from "../map/GameMap";
import { HoveredTile } from "../map/HoveredTile";
import { Tile } from "../map/Tile";
import { NetworkEvents, WebsocketClient } from "../network/Client";
import { Line } from "../scene/Line";
import { Numbers } from "../util/Numbers";
import { Vector } from "../util/Vector";
import { AbstractPlayer } from "./AbstractPlayer";

/**
 * Currently client player handles selected units, the hovered tile, and movement lines from selecting a unit.
 * ClientPlayer will handle in the future: Ranged Attacks
 */
export class ClientPlayer extends AbstractPlayer {
  private selectedUnit: Unit;
  private hoveredTile: HoveredTile;
  private movementLines: Line[];
  private rightMouseDrag: boolean;

  constructor(name: string) {
    super(name);

    this.movementLines = [];

    Game.getCurrentScene().on("mapLoaded", () => {
      this.hoveredTile = new HoveredTile(9999, 9999);
      this.hoveredTile.loadImage().then(() => {
        Game.getCurrentScene().addActor(this.hoveredTile);

        this.updateHoveredTile(Game.getMouseX(), Game.getMouseY());
      });
    });

    Game.getCurrentScene().on("mousemove", (options) => {
      const mouseX = options.x;
      const mouseY = options.y;

      let oldHoveredTile = this.hoveredTile
        ? this.hoveredTile.getRepresentedTile()
        : undefined;

      this.updateHoveredTile(mouseX, mouseY);

      if (
        !this.selectedUnit ||
        oldHoveredTile === this.hoveredTile.getRepresentedTile() ||
        !this.rightMouseDrag
      ) {
        return;
      }

      // Remove target-outline from previous hovered tile.
      if (oldHoveredTile !== this.selectedUnit.getTile()) {
        GameMap.getInstance().removeOutline({
          tile: oldHoveredTile,
          cityOutline: false,
        });
      }

      if (!this.hoveredTile.getRepresentedTile()) {
        this.clearMovementPath();
        return;
      }

      // Draw movement lines to new target tile
      this.drawMovementPath(
        this.selectedUnit.getTile(),
        this.hoveredTile.getRepresentedTile()
      );

      //Draw outline of final target tile
      if (this.movementLines.length > 0) {
        GameMap.getInstance().drawUnitSelectionOutline(
          this.hoveredTile.getRepresentedTile(),
          "aqua"
        );
      }
    });

    Game.getCurrentScene().on("mousedown", (options) => {
      if (options.button === 2) {
        this.onMouseRightClick();
      }
    });

    Game.getCurrentScene().on("mouseup", (options) => {
      const clickedTile = this.hoveredTile.getRepresentedTile();

      //left-click
      if (options.button === 0) {
        if (clickedTile && clickedTile.getUnits().length > 0) {
          this.onClickedTileWithUnit(clickedTile);
        }
      }

      //right-click
      if (options.button === 2) {
        this.rightMouseDrag = false;
        if (clickedTile && this.selectedUnit) {
          this.moveSelectedUnit(clickedTile);
        }
      }
    });

    NetworkEvents.on({
      eventName: "zoomToLocation",
      callback: (data) => {
        const gridX = data["x"];
        const gridY = data["y"];
        const tile = GameMap.getInstance().getTiles()[gridX][gridY];
        const zoomAmount = data["zoomAmount"];
        const x = tile.getCenterPosition()[0];
        const y = tile.getCenterPosition()[1];

        this.zoomToLocation(x, y, zoomAmount);
      },
    });

    NetworkEvents.on({
      eventName: "removeUnit",
      callback: (data) => {
        if (!this.selectedUnit) return;

        if (this.selectedUnit.getID() === data["id"]) {
          this.selectedUnit = undefined;
          this.clearMovementPath();

          GameMap.getInstance().removeOutline({
            tile: this.hoveredTile.getRepresentedTile(),
            cityOutline: false,
          });
        }
      },
    });

    NetworkEvents.on({
      eventName: "moveUnit",
      callback: (data) => {
        if (!this.selectedUnit || this.selectedUnit.getID() !== data["id"]) {
          return;
        }

        this.clearMovementPath();

        if ("queuedTiles" in data) {
          const movementPath: Tile[] = [this.selectedUnit.getTile()];

          for (const tileLocation of data["queuedTiles"] as []) {
            movementPath.push(
              GameMap.getInstance().getTiles()[tileLocation["x"]][
                tileLocation["y"]
              ]
            );
          }

          this.drawMovementPathFromTiles(movementPath);
        }
      },
    });
  }

  private zoomToLocation(x: number, y: number, zoomAmount: number) {
    Game.getCurrentScene()
      .getCamera()
      .setPosition(-x + Game.getWidth() / 2, -y + Game.getHeight() / 2);
    Game.getCurrentScene()
      .getCamera()
      .zoom(Game.getWidth() / 2, Game.getHeight() / 2, zoomAmount);
  }

  private onMouseRightClick() {
    this.rightMouseDrag = true;

    if (!this.selectedUnit || !this.hoveredTile.getRepresentedTile()) {
      return;
    }

    this.drawMovementPath(
      this.selectedUnit.getTile(),
      this.hoveredTile.getRepresentedTile()
    );

    // Remove queued target outline if it exists
    if (this.selectedUnit.hasMovementQueue()) {
      GameMap.getInstance().removeOutline({
        tile: this.selectedUnit.getTargetQueuedTile(),
        cityOutline: false,
      });
    }

    GameMap.getInstance().drawUnitSelectionOutline(
      this.hoveredTile.getRepresentedTile(),
      "aqua"
    );
  }

  private moveSelectedUnit(targetTile: Tile) {
    WebsocketClient.sendMessage({
      event: "moveUnit",
      unitX: this.selectedUnit.getTile().getGridX(),
      unitY: this.selectedUnit.getTile().getGridY(),
      id: this.selectedUnit.getID(),
      targetX: targetTile.getGridX(),
      targetY: targetTile.getGridY(),
    });

    // Remove target tile outline
    GameMap.getInstance().removeOutline({
      tile: targetTile,
      cityOutline: false,
    });

    // Unselect unit before moving
    this.selectedUnit.unselect();
    this.selectedUnit = undefined;
    this.clearMovementPath();
  }

  private onClickedTileWithUnit(tile: Tile) {
    const units = tile.getUnits();

    //TODO: Cycle through units on the tile
    const unit = units[0];

    // Clear previously defined movement paths.
    this.clearMovementPath();

    const unselectedUnit = this.unselectUnit();

    if (unselectedUnit === unit) {
      return;
    }

    unit.select();
    this.selectedUnit = unit;

    // TOOD: Draw full outline of final queued tile or hovered tile.
    if (this.selectedUnit.hasMovementQueue()) {
      this.drawMovementPathFromTiles([
        unit.getTile(),
        ...unit.getQueuedMovementTiles(),
      ]);

      GameMap.getInstance().drawUnitSelectionOutline(
        this.selectedUnit.getTargetQueuedTile(),
        "aqua"
      );
    }
  }

  private unselectUnit(): Unit {
    const unselectedUnit = this.selectedUnit;
    if (this.selectedUnit) {
      this.selectedUnit.unselect();

      if (this.selectedUnit.hasMovementQueue()) {
        GameMap.getInstance().removeOutline({
          tile: this.selectedUnit.getTargetQueuedTile(),
          cityOutline: false,
        });
      }
    }

    this.selectedUnit = undefined;
    return unselectedUnit; // Will we return undefined?
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
      gridX >= GameMap.getInstance().getWidth() ||
      gridX < 0 ||
      gridY >= GameMap.getInstance().getHeight() ||
      gridY < 0 ||
      // We also check for mouse values that could indicate were out of bounds...
      mouseY < 6 ||
      mouseX < 15 ||
      mouseX > GameMap.getInstance().getWidth() * 32
    ) {
      const adjBorderTiles = GameMap.getInstance().getAdjacentTiles(
        gridX,
        gridY
      );
      const clampedBorderTile =
        GameMap.getInstance().getTiles()[
          Numbers.clamp(gridX, 0, GameMap.getInstance().getWidth() - 1)
        ][Numbers.clamp(gridY, 0, GameMap.getInstance().getHeight() - 1)];
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
      estimatedTile = GameMap.getInstance().getTiles()[gridX][gridY];
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

  private clearMovementPath() {
    for (const line of this.movementLines) {
      Game.getCurrentScene().removeLine(line);
    }
    this.movementLines = [];
  }

  private drawMovementPath(startTile: Tile, goalTile: Tile) {
    if (this.movementLines.length > 0) {
      this.clearMovementPath();
    }

    console.log(
      `Drawing path from (${startTile.getGridX()},${startTile.getGridY()}) to (${goalTile.getGridX()},${goalTile.getGridY()})`
    );

    //console.time("constructShortestPath()");
    const pathTiles = GameMap.getInstance().constructShortestPath(
      this.selectedUnit,
      startTile,
      goalTile
    );

    this.drawMovementPathFromTiles(pathTiles);
  }

  private drawMovementPathFromTiles(pathTiles: Tile[]) {
    if (pathTiles.length < 1) return;

    let movementCost = 0;
    for (let i = 0; i < pathTiles.length - 1; i++) {
      const tile1 = pathTiles[i];
      const tile2 = pathTiles[i + 1];
      const tileCost = Tile.getWeight(tile1, tile2);
      movementCost += tileCost;

      let color = "rgba(7, 250, 214, 1)";

      const line = new Line({
        color: color,
        girth: 2,
        z: 3,
        x1: tile1.getCenterPosition()[0],
        y1: tile1.getCenterPosition()[1],
        x2: tile2.getCenterPosition()[0],
        y2: tile2.getCenterPosition()[1],
      });
      this.movementLines.push(line);
      Game.getCurrentScene().addLine(line);
    }
  }
}
