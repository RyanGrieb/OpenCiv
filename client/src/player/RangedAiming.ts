import { GameImage, SpriteRegion } from "../Assets";
import { Game } from "../Game";
import { Unit } from "../Unit";
import { GameMap } from "../map/GameMap";
import { Tile } from "../map/Tile";
import { WebsocketClient } from "../network/Client";
import { Actor } from "../scene/Actor";

// Server "rangedTargets" payload, from server Unit.sendRangedTargets().
export interface RangedTargetsEvent {
  id: number;
  // Set when the player pressed the unit's Ranged Attack action.
  aiming: boolean;
  tiles: { x: number; y: number }[];
}

/**
 * The tiles the selected ranged unit can shoot into - worked out by the server, which owns range and
 * line of sight - and whether the player is aiming with the Ranged Attack action. While aiming, those
 * tiles are tinted red, like old_java's Target action, until the unit fires or the player stops.
 */
export class RangedAiming {
  private static readonly TILE_TINT = "rgba(255, 30, 30, 0.4)";
  // Tiles holding something the unit can actually shoot stand out from the rest of its range.
  private static readonly TARGET_TINT = "rgba(255, 30, 30, 0.7)";

  private unit: Unit | undefined;
  private targetTiles: Tile[] = [];
  private aiming = false;
  private overlays: Actor[] = [];

  // Asks the server where this unit can shoot. The answer comes back through setTargets().
  public request(unit: Unit) {
    this.clear();
    if (!unit.isRanged()) return;

    this.unit = unit;
    WebsocketClient.sendMessage({ event: "requestRangedTargets", id: unit.getID() });
  }

  public setTargets(data: RangedTargetsEvent) {
    if (!this.unit || this.unit.getID() !== data.id) return;

    this.stopAiming();
    const tiles = GameMap.getInstance().getTiles();
    this.targetTiles = data.tiles.map(({ x, y }) => tiles[x]?.[y]).filter(Boolean);

    if (data.aiming) this.startAiming();
  }

  // Mirrors server Unit.canRangedAttack(), with the range and line of sight taken from the server's list.
  public canShoot(tile: Tile | undefined): boolean {
    if (!tile || !this.unit || this.unit.getAvailableMovement() <= 0) return false;
    if (!this.targetTiles.includes(tile)) return false;

    return tile.getUnits().some((unit) => unit.getPlayer() !== this.unit.getPlayer() && unit.canFight());
  }

  public isAiming(): boolean {
    return this.aiming;
  }

  public getTargetTiles(): Tile[] {
    return this.targetTiles;
  }

  public stopAiming() {
    this.aiming = false;
    for (const overlay of this.overlays) Game.getInstance().getCurrentScene().removeActor(overlay);
    this.overlays = [];
  }

  public clear() {
    this.stopAiming();
    this.unit = undefined;
    this.targetTiles = [];
  }

  private startAiming() {
    this.aiming = true;

    for (const tile of this.targetTiles) {
      const overlay = new Actor({
        image: Game.getInstance().getImage(GameImage.SPRITESHEET),
        spriteRegion: SpriteRegion.TILE_BLANK,
        x: tile.getX(),
        y: tile.getY(),
        // Over the terrain (0), under units (2).
        z: 1,
        width: 32,
        height: 32,
        color: this.canShoot(tile) ? RangedAiming.TARGET_TINT : RangedAiming.TILE_TINT
      });
      Game.getInstance().getCurrentScene().addActor(overlay);
      this.overlays.push(overlay);
    }
  }
}
