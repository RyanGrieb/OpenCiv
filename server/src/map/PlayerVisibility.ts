import { Game } from "../Game";
import { Player } from "../Player";
import { GameMap } from "./GameMap";
import { Tile } from "./Tile";

/**
 * Per-player fog of war. Tracks two sets:
 *
 * * `discovered` - every tile the player has ever seen. Terrain, rivers and cities on these are
 *   remembered client-side even once the player looks away, so they keep whatever was last sent.
 * * `visible` - tiles currently in sight of one of the player's units or cities. Only these carry
 *   live information (units standing on them, yield changes).
 *
 * Sight is computed by walking tile adjacency rather than by a distance formula: the map's
 * coordinates are offset-hex, so Tile.gridDistance() isn't a hex metric, and a walk gets the map
 * edges and east-west wrapping right for free.
 */
export class PlayerVisibility {
  public static readonly DEFAULT_UNIT_SIGHT_RANGE = 2;
  // Measured from the city center, so this covers the city's territory plus one ring past it.
  public static readonly CITY_SIGHT_RANGE = 2;

  private player: Player;
  private discovered: Set<Tile>;
  private visible: Set<Tile>;

  constructor(player: Player) {
    this.player = player;
    this.discovered = new Set();
    this.visible = new Set();
  }

  // Whether fog is off entirely for this game - every player sees the whole map (debugging, and
  // what the client scenario tests run against).
  public static mapRevealed(): boolean {
    return Game.getInstance().getGameOptions().revealMap;
  }

  public isVisible(tile: Tile): boolean {
    return PlayerVisibility.mapRevealed() || this.visible.has(tile);
  }

  public hasDiscovered(tile: Tile): boolean {
    return PlayerVisibility.mapRevealed() || this.discovered.has(tile);
  }

  public getDiscoveredTiles(): Set<Tile> {
    return this.discovered;
  }

  /**
   * Recomputes sight from scratch, then tells the client only what changed: tile data for
   * everything newly in sight (which is how another civ's units arrive), and a "fogTiles" packet
   * for tiles that fell back into fog.
   *
   * Call this after anything that moves the player's sight around - a unit created, moved or
   * deleted, or a city founded.
   */
  public update() {
    // Everything was already sent with the initial map, and nothing ever fogs.
    if (PlayerVisibility.mapRevealed()) return;

    // Nobody to tell - a player the server runs itself (the barbarians) has no fog to keep up.
    if (!this.player.hasClient()) return;

    const previouslyVisible = this.visible;
    this.visible = this.computeVisibleTiles();

    const revealed: Tile[] = [];
    for (const tile of this.visible) {
      this.discovered.add(tile);

      if (!previouslyVisible.has(tile)) {
        revealed.push(tile);
      }
    }

    const fogged: Tile[] = [];
    for (const tile of previouslyVisible) {
      if (!this.visible.has(tile)) {
        fogged.push(tile);
      }
    }

    // Resend revealed tiles wholesale rather than diffing their contents - that's what makes a
    // tile the player looked away from catch up on whatever changed while it sat in fog.
    if (revealed.length > 0) {
      GameMap.getInstance().sendTilesToPlayer(this.player, revealed);
    }

    if (fogged.length > 0) {
      this.player.sendNetworkEvent({
        event: "fogTiles",
        tiles: fogged.map((tile) => ({ x: tile.getX(), y: tile.getY() }))
      });
    }
  }

  private computeVisibleTiles(): Set<Tile> {
    const visibleTiles = new Set<Tile>();
    const gameMap = GameMap.getInstance();

    for (const unit of this.player.getUnits()) {
      const unitTile = unit.getTile();
      // getTilesInRange gives every tile within walking distance; hasLineOfSight then drops
      // whatever higher ground - hills, mountains, woods - hides from where the unit is standing.
      for (const tile of gameMap.getTilesInRange(unitTile, unit.getSightRange())) {
        if (gameMap.hasLineOfSight(unitTile, tile)) {
          visibleTiles.add(tile);
        }
      }
    }

    for (const city of this.player.getCities()) {
      const cityTile = city.getTile();
      for (const tile of gameMap.getTilesInRange(cityTile, PlayerVisibility.CITY_SIGHT_RANGE)) {
        if (gameMap.hasLineOfSight(cityTile, tile)) {
          visibleTiles.add(tile);
        }
      }
    }

    return visibleTiles;
  }
}
