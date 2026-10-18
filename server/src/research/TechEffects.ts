import { MapResources } from "../map/MapResources";
import type { Tile, YieldSource } from "../map/Tile";
import type { Player } from "../Player";
import { Technology, TileBonusData } from "./Technology";

/**
 * What researching a tech changes on the map, beyond the units, buildings and improvements it
 * unlocks: strategic resources it reveals (map_resources.yml's reveal_tech) and yield bonuses it
 * gives certain tiles (techs.yml's tile_bonuses).
 */
export class TechEffects {
  // Civ 5 hides Horses and Iron until their tech is in. With no player to ask, nothing is hidden.
  public static isResourceHidden(resource: string, player?: Player): boolean {
    const revealTech = MapResources.getRevealTech(resource);
    if (!revealTech || !player) return false;

    return !player.hasResearchedTech(revealTech);
  }

  // The extra yields the player's techs give this tile, each under the tech's name.
  public static getTileBonusSources(tile: Tile, player?: Player): YieldSource[] {
    if (!player) return [];

    return Technology.getAllTileBonuses()
      .filter(({ techName, bonus }) => player.hasResearchedTech(techName) && TechEffects.bonusApplies(bonus, tile))
      .map(({ techName, bonus }) => ({ source: techName, stats: bonus.stats }));
  }

  // Whether researching the tech changes how this tile looks or what it yields.
  public static changesTile(techName: string, tile: Tile): boolean {
    const resource = tile.getResource();
    if (resource && MapResources.getRevealTech(resource) === techName) return true;

    return Technology.getAllTileBonuses().some(
      (entry) => entry.techName === techName && TechEffects.bonusApplies(entry.bonus, tile)
    );
  }

  private static bonusApplies(bonus: TileBonusData, tile: Tile): boolean {
    if (!tile.containsTileType(bonus.tile_type)) return false;

    return bonus.fresh_water === undefined || tile.hasFreshWater() === bonus.fresh_water;
  }
}
