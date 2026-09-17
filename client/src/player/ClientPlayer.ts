import { Game } from "../Game";
import { Unit } from "../Unit";
import { GameMap } from "../map/GameMap";
import { HoveredTile } from "../map/HoveredTile";
import { Tile } from "../map/Tile";
import { NetworkEvents, WebsocketClient } from "../network/Client";
import { Line } from "../scene/Line";
import { InGameScene } from "../scene/type/InGameScene";
import { Numbers } from "../util/Numbers";
import { Vector } from "../util/Vector";
import { AbstractPlayer, PlayerData } from "./AbstractPlayer";

export interface CurrentResearch {
  techName: string;
  assetName: string;
  progress: number;
  cost: number;
}

/**
 * Currently client player handles selected units, the hovered tile, and movement lines from selecting a unit.
 * ClientPlayer will handle in the future: Ranged Attacks
 */
export class ClientPlayer extends AbstractPlayer {
  private selectedUnit: Unit;
  private hoveredTile: HoveredTile;
  private outlinedTile: Tile;
  private movementLines: Line[];
  private rightMouseDrag: boolean;
  private requestedNextTurn: boolean;
  private totalStats: Map<string, number> = new Map();
  private accumulatedStats: Map<string, number> = new Map();
  private currentResearch: CurrentResearch | null = null;
  private researchedTechs: Set<string> = new Set();

  constructor(playerJSON: PlayerData) {
    super(playerJSON);

    this.movementLines = [];
    this.requestedNextTurn = playerJSON.requestedNextTurn;

    Game.getInstance()
      .getCurrentScene()
      .on("mapLoaded", () => {
        this.hoveredTile = new HoveredTile(9999, 9999);
        this.hoveredTile.loadImage().then(() => {
          Game.getInstance().getCurrentScene().addActor(this.hoveredTile);
          this.updateHoveredTile(Game.getInstance().getMouseX(), Game.getInstance().getMouseY());
        });
      });

    Game.getInstance()
      .getCurrentScene()
      .on("mousemove", (options) => {
        const mouseX = options.clientX;
        const mouseY = options.clientY;

        let oldHoveredTile = this.hoveredTile ? this.hoveredTile.getRepresentedTile() : undefined;

        this.updateHoveredTile(mouseX, mouseY);

        if (!this.selectedUnit || oldHoveredTile === this.hoveredTile.getRepresentedTile() || !this.rightMouseDrag) {
          return;
        }

        // Remove the previous drag-preview outline, wherever it actually landed
        // (may not be oldHoveredTile itself, if that hop was blocked).
        if (this.outlinedTile && this.outlinedTile !== this.selectedUnit.getTile()) {
          GameMap.getInstance().removeOutline({
            tile: this.outlinedTile,
            cityOutline: false
          });
        }
        this.outlinedTile = undefined;

        if (!this.hoveredTile.getRepresentedTile()) {
          this.clearMovementPath();
          return;
        }

        // Draw movement lines to new target tile
        const { isQueuedMovement, targetTile } = this.drawMovementPath(
          this.selectedUnit.getTile(),
          this.hoveredTile.getRepresentedTile()
        );

        // Draw outline on the tile the path actually reaches, not necessarily the hovered one.
        if (this.movementLines.length > 0) {
          this.drawTargetTileOutline(targetTile, isQueuedMovement);
          this.outlinedTile = targetTile;
        }
      });

    Game.getInstance()
      .getCurrentScene()
      .on("mousedown", (options) => {
        if (options.button === 2) {
          this.onMouseRightClick();
        }
      });

    Game.getInstance()
      .getCurrentScene()
      .on("mouseup", (options) => {
        if (Game.getInstance().getCurrentScene().getCamera().isLocked() || !this.hoveredTile) {
          return;
        }

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
      parentObject: this,
      callback: (data) => {
        const gridX = data["x"];
        const gridY = data["y"];
        const tile = GameMap.getInstance().getTiles()[gridX][gridY];
        const zoomAmount = data["zoomAmount"];
        Game.getInstance().getCurrentSceneAs<InGameScene>().focusOnTile(tile, zoomAmount);
      }
    });

    NetworkEvents.on({
      eventName: "removeUnit",
      parentObject: this,
      callback: (data) => {
        if (!this.selectedUnit) return;

        if (this.selectedUnit.getID() === data["id"]) {
          this.selectedUnit = undefined;
          this.clearMovementPath();

          if (this.outlinedTile) {
            GameMap.getInstance().removeOutline({
              tile: this.outlinedTile,
              cityOutline: false
            });
            this.outlinedTile = undefined;
          }
        }
      }
    });

    NetworkEvents.on({
      eventName: "moveUnit",
      parentObject: this,
      callback: (data) => {
        if (!this.selectedUnit || this.selectedUnit.getID() !== data["id"]) {
          return;
        }

        this.clearMovementPath();

        if ("queuedTiles" in data) {
          const movementPath: Tile[] = [this.selectedUnit.getTile()];

          for (const tileLocation of data["queuedTiles"] as []) {
            movementPath.push(GameMap.getInstance().getTiles()[tileLocation["x"]][tileLocation["y"]]);
          }

          this.drawMovementPathFromTiles(movementPath);
        }
      }
    });

    Game.getInstance()
      .getCurrentScene()
      .on("uiStateChanged", (options) => {
        if (this.selectedUnit && options.opened) {
          this.unselectUnit();
        }

        if (options.opened) {
          this.hoveredTile.setHidden(true);
        } else {
          this.hoveredTile.setHidden(false);
        }
      });

    NetworkEvents.on({
      eventName: "newTurn",
      parentObject: this,
      callback: (data) => {
        this.unselectUnit();
        this.clearMovementPath();
      }
    });

    NetworkEvents.on({
      eventName: "updateTotalStats",
      parentObject: this,
      callback: (data) => {
        const stats = data["stats"];
        for (const stat of Object.keys(stats)) {
          this.totalStats.set(stat, stats[stat]);
        }

        const accumulatedStats = data["accumulatedStats"];
        for (const stat of Object.keys(accumulatedStats)) {
          this.accumulatedStats.set(stat, accumulatedStats[stat]);
        }
      }
    });

    NetworkEvents.on({
      eventName: "updateResearch",
      parentObject: this,
      callback: (data) => {
        this.currentResearch = data["currentResearch"];
        this.researchedTechs = new Set(data["researchedTechs"]);
      }
    });

    WebsocketClient.sendMessage({ event: "requestTotalStats" });
    WebsocketClient.sendMessage({ event: "requestResearch" });
  }

  public setRequestedNextTurn(value: boolean) {
    this.requestedNextTurn = value;
  }

  public hasRequestedNextTurn() {
    return this.requestedNextTurn;
  }

  public getTotalStat(stat: string): number {
    return this.totalStats.get(stat) ?? 0;
  }

  public getAccumulatedStat(stat: string): number {
    return this.accumulatedStats.get(stat) ?? 0;
  }

  public getCurrentResearch(): CurrentResearch | null {
    return this.currentResearch;
  }

  public hasResearchedTech(techName: string): boolean {
    return this.researchedTechs.has(techName);
  }

  public unselectUnit(): Unit {
    const unselectedUnit = this.selectedUnit;
    if (this.selectedUnit) {
      this.selectedUnit.unselect();

      if (this.selectedUnit.hasMovementQueue()) {
        GameMap.getInstance().removeOutline({
          tile: this.selectedUnit.getTargetQueuedTile(),
          cityOutline: false
        });
      }
    }

    this.selectedUnit = undefined;
    this.clearMovementPath();

    if (this.outlinedTile) {
      GameMap.getInstance().removeOutline({
        tile: this.outlinedTile,
        cityOutline: false
      });
      this.outlinedTile = undefined;
    }

    this.rightMouseDrag = false;
    return unselectedUnit;
  }

  private onMouseRightClick() {
    this.rightMouseDrag = true;

    if (!this.selectedUnit || !this.hoveredTile.getRepresentedTile()) {
      return;
    }

    const { isQueuedMovement, targetTile } = this.drawMovementPath(
      this.selectedUnit.getTile(),
      this.hoveredTile.getRepresentedTile()
    );

    // Remove queued target outline if it exists
    if (this.selectedUnit.hasMovementQueue()) {
      GameMap.getInstance().removeOutline({
        tile: this.selectedUnit.getTargetQueuedTile(),
        cityOutline: false
      });
    }

    // Draw outline on the tile the path actually reaches (may be blocked short of the hovered tile).
    if (this.movementLines.length > 0) {
      this.drawTargetTileOutline(targetTile, isQueuedMovement);
      this.outlinedTile = targetTile;
    }
  }

  private moveSelectedUnit(targetTile: Tile) {
    const pathTiles = GameMap.getInstance().constructShortestPath(this.selectedUnit, this.selectedUnit.getTile(), targetTile);

    // No reachable step towards targetTile (e.g. it's fully blocked) - the server would silently
    // no-op this anyway, so don't bother sending it or unselecting the unit over a wasted click.
    if (pathTiles.length < 2) {
      return;
    }

    WebsocketClient.sendMessage({
      event: "moveUnit",
      unitX: this.selectedUnit.getTile().getGridX(),
      unitY: this.selectedUnit.getTile().getGridY(),
      id: this.selectedUnit.getID(),
      targetX: targetTile.getGridX(),
      targetY: targetTile.getGridY()
    });

    // Remove the drag-preview outline, wherever it actually landed.
    if (this.outlinedTile) {
      GameMap.getInstance().removeOutline({
        tile: this.outlinedTile,
        cityOutline: false
      });
      this.outlinedTile = undefined;
    }

    // Unselect unit before moving
    this.selectedUnit.unselect();
    this.selectedUnit = undefined;
    this.clearMovementPath();
  }

  private onClickedTileWithUnit(tile: Tile) {
    const units = tile.getUnits().filter((unit) => unit.getPlayer() === this);

    if (units.length === 0) {
      return;
    }

    // Clicking a tile whose unit is already selected cycles to the next unit stacked on it.
    let unit = units[0];
    if (this.selectedUnit && this.selectedUnit.getTile() === tile) {
      const currentIndex = units.indexOf(this.selectedUnit);
      unit = units[(currentIndex + 1) % units.length];
    }

    // Clear previously defined movement paths.
    this.clearMovementPath();

    const unselectedUnit = this.unselectUnit();

    if (unselectedUnit === unit) {
      return;
    }

    unit.select();
    this.selectedUnit = unit;

    if (this.selectedUnit.hasMovementQueue()) {
      const { isQueuedMovement } = this.drawMovementPathFromTiles([unit.getTile(), ...unit.getQueuedMovementTiles()]);

      this.drawTargetTileOutline(this.selectedUnit.getTargetQueuedTile(), isQueuedMovement);
    }
  }

  private updateHoveredTile(mouseX: number, mouseY: number) {
    if (!this.hoveredTile || isNaN(mouseX) || isNaN(mouseY)) return;

    let zoom = Game.getInstance().getCurrentScene().getCamera().getZoomAmount();

    let camX = -Game.getInstance().getCurrentScene().getCamera().getX();
    let camY = -Game.getInstance().getCurrentScene().getCamera().getY();

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
      const adjBorderTiles = GameMap.getInstance().getAdjacentTiles(gridX, gridY);
      const clampedBorderTile =
        GameMap.getInstance().getTiles()[Numbers.clamp(gridX, 0, GameMap.getInstance().getWidth() - 1)][
        Numbers.clamp(gridY, 0, GameMap.getInstance().getHeight() - 1)
        ];
      adjBorderTiles.push(clampedBorderTile); // Also push clamped tile.

      let foundAdjBorderTile = false;
      for (const adjTile of adjBorderTiles) {
        if (!adjTile) continue;
        if (Vector.isInsidePolygon(adjTile.getVectors(), mouseVector, mouseExtremeVector)) {
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

      if (Vector.isInsidePolygon(estimatedTile.getVectors(), mouseVector, mouseExtremeVector)) {
        accurateTile = estimatedTile;
      } else {
        for (const adjTile of estimatedTile.getAdjacentTiles()) {
          if (!adjTile) continue;
          if (Vector.isInsidePolygon(adjTile.getVectors(), mouseVector, mouseExtremeVector)) {
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
      Game.getInstance().getCurrentScene().removeLine(line);
    }
    this.movementLines = [];
  }

  private drawMovementPath(startTile: Tile, goalTile: Tile): { isQueuedMovement: boolean; targetTile: Tile | undefined } {
    if (this.movementLines.length > 0) {
      this.clearMovementPath();
    }

    //console.log(
    //  `Drawing path from (${startTile.getGridX()},${startTile.getGridY()}) to (${goalTile.getGridX()},${goalTile.getGridY()})`
    //);

    //console.time("constructShortestPath()");
    const pathTiles = GameMap.getInstance().constructShortestPath(this.selectedUnit, startTile, goalTile);

    return this.drawMovementPathFromTiles(pathTiles);
  }

  private drawMovementPathFromTiles(pathTiles: Tile[]): { isQueuedMovement: boolean; targetTile: Tile | undefined } {
    if (pathTiles.length < 1) return { isQueuedMovement: false, targetTile: undefined };

    let availableMovement = this.selectedUnit.getAvailableMovement();
    let isQueuedMovement = false;

    for (let i = 0; i < pathTiles.length - 1; i++) {
      const tile1 = pathTiles[i];
      const tile2 = pathTiles[i + 1];
      const tileCost = Tile.getWeight(tile1, tile2, this.selectedUnit);

      let color = "rgba(7, 250, 214, 1)";

      if (availableMovement <= 0) {
        color = "rgba(154, 158, 153, 1)";
        isQueuedMovement = true;
      }

      availableMovement -= tileCost;

      const line = new Line({
        color: color,
        girth: 2,
        z: 3,
        x1: tile1.getCenterPosition().x,
        y1: tile1.getCenterPosition().y,
        x2: tile2.getCenterPosition().x,
        y2: tile2.getCenterPosition().y
      });
      this.movementLines.push(line);
      Game.getInstance().getCurrentScene().addLine(line);
    }

    return { isQueuedMovement, targetTile: pathTiles[pathTiles.length - 1] };
  }

  private drawTargetTileOutline(tile: Tile, queuedPath: boolean) {
    let color = queuedPath ? "lightgrey" : "aqua";
    GameMap.getInstance().drawUnitSelectionOutline(tile, color);
  }
}
