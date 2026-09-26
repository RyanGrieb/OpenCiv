import { GameImage, SpriteRegion } from "../../../Assets";
import { Game } from "../../../Game";
import { City } from "../../../city/City";
import { Tile } from "../../../map/Tile";
import { Actor } from "../../../scene/Actor";

// Highlights each tile in the city's territory to show whether a citizen works it, and marks the
// tile the borders grow into next. The overlays are added straight to the scene (not to the
// screen-fixed city window) so they pan with the map.
export class CityTileOverlays {
  private city: City;
  private overlays: Actor[];

  constructor(city: City) {
    this.city = city;
    this.overlays = [];
    this.show();
  }

  // Growing or starving reassigns citizens, so the highlights have to be rebuilt.
  public refresh() {
    this.clear();
    this.show();
  }

  public clear() {
    for (const overlay of this.overlays) {
      Game.getInstance().getCurrentScene().removeActor(overlay);
    }
    this.overlays = [];
  }

  private show() {
    const workedTiles = this.city.getWorkedTiles();

    for (const tile of this.city.getTerritory()) {
      const color = workedTiles.includes(tile) ? "rgba(0, 220, 0, 0.35)" : "rgba(40, 40, 40, 0.35)";
      this.addOverlay(this.createTileTint(tile, color));
    }

    this.addNextBorderTileMarker();
  }

  // Tints the tile the borders grow into next in the culture color, with a culture icon on it.
  private addNextBorderTileMarker() {
    const tile = this.city.getNextBorderTile();
    if (!tile) return;

    this.addOverlay(this.createTileTint(tile, "rgba(207, 159, 255, 0.55)"));
    this.addOverlay(
      new Actor({
        image: Game.getInstance().getImage(GameImage.SPRITESHEET),
        spriteRegion: SpriteRegion.ICON_CULTURE,
        x: tile.getX() + 8,
        y: tile.getY() + 8,
        z: 3,
        width: 16,
        height: 16
      })
    );
  }

  private createTileTint(tile: Tile, color: string): Actor {
    return new Actor({
      image: Game.getInstance().getImage(GameImage.SPRITESHEET),
      spriteRegion: SpriteRegion.TILE_BLANK,
      x: tile.getX(),
      y: tile.getY(),
      z: 2,
      width: 32,
      height: 32,
      color: color
    });
  }

  private addOverlay(overlay: Actor) {
    Game.getInstance().getCurrentScene().addActor(overlay);
    this.overlays.push(overlay);
  }
}
