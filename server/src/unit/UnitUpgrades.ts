import { Game } from "../Game";
import type { Player } from "../Player";
import { Unit, UnitYMLTypeData } from "./Unit";

/**
 * Civ 5's unit upgrades. A unit turns into its upgrades_to unit (units.yml) for gold once its owner has
 * researched that unit's tech, keeping its health, experience and promotions. It has to stand in its
 * owner's territory with movement left, and upgrading uses up the rest of its turn.
 */
export class UnitUpgrades {
  // Civ 5's BASE_UNIT_UPGRADE_COST, UNIT_UPGRADE_COST_PER_PRODUCTION and UNIT_UPGRADE_COST_VISIBLE_DIVISOR:
  // 10 gold plus 2 for every point of production the new unit costs over the old, rounded down to a 5.
  public static readonly BASE_COST = 10;
  public static readonly GOLD_PER_PRODUCTION = 2;
  public static readonly ROUND_TO = 5;

  // What `unitName` upgrades into for this player: its upgrades_to, or the civ's unique unit replacing that.
  public static getTarget(unitName: string, player: Player): UnitYMLTypeData | undefined {
    const units = Unit.getAllUnitData();
    const targetName = units.find((unit) => unit.name === unitName)?.upgrades_to;
    if (!targetName) return undefined;

    const civName = player.getCivilizationName();
    const unique = units.find((unit) => unit.unique_to === civName && unit.replaces === targetName);
    return unique ?? units.find((unit) => unit.name === targetName);
  }

  public static getCost(unitName: string, target: UnitYMLTypeData): number {
    const cost = Unit.getAllUnitData().find((unit) => unit.name === unitName)?.cost ?? 0;
    const extraProduction = Math.max(0, (target.cost ?? 0) - cost);
    const gold = UnitUpgrades.BASE_COST + extraProduction * UnitUpgrades.GOLD_PER_PRODUCTION;
    return Math.floor(gold / UnitUpgrades.ROUND_TO) * UnitUpgrades.ROUND_TO;
  }

  // The upgrade the unit's owner has the tech for, whether or not the unit can take it right now.
  public static getResearchedTarget(unit: Unit): UnitYMLTypeData | undefined {
    const target = UnitUpgrades.getTarget(unit.getName(), unit.getPlayer());
    if (!target) return undefined;
    if (target.required_tech && !unit.getPlayer().hasResearchedTech(target.required_tech)) return undefined;
    return target;
  }

  public static canUpgrade(unit: Unit): boolean {
    const target = UnitUpgrades.getResearchedTarget(unit);
    if (!target || unit.getAvailableMovement() <= 0) return false;

    const player = unit.getPlayer();
    if (unit.getTile().getCityTerritoryOf()?.getPlayer() !== player) return false;
    return player.getTreasury().canAfford(UnitUpgrades.getCost(unit.getName(), target));
  }

  // Whether units can upgrade changes with their owner's gold, so their Upgrade buttons are rechecked
  // after every client message and every turn, like City.refreshAllCombatStatus().
  public static refreshAll() {
    Game.getInstance()
      .getPlayers()
      .forEach((player) => player.getUnits().forEach((unit) => unit.refreshUpgradeAction()));
  }
}
