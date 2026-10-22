import { Building, BuildingData } from "../city/Building";
import { Improvement, ImprovementData } from "../map/Improvement";
import { StatEntry, Tile } from "../map/Tile";
import { Unit, UnitYMLTypeData } from "../unit/Unit";
import type { Technology } from "./Technology";

export type TechBonusKind = "unit" | "building" | "wonder" | "improvement" | "note";

/**
 * One icon in a tech's bonus row on its research tree button, with what its tooltip shows: a building's
 * own data (the client's BuildingTooltip reads it), an improvement's yields, and lines of words that may
 * carry `!{icon}`s.
 */
export interface TechBonusData {
  name: string;
  asset_name?: string;
  kind: TechBonusKind;
  building?: BuildingData;
  stats?: StatEntry[];
  lines?: string[];
}

/** Everything a tech gives, as the research tree shows it: units, buildings, wonders, improvements, then its notes. */
export class TechBonuses {
  // Movement a unit has when units.yml leaves default_move_distance out, as Unit's constructor does.
  private static readonly DEFAULT_MOVEMENT = 2;

  // civName leaves out what that civ can't build, as Technology.getUnlocks() does.
  public static of(tech: Technology, civName?: string): TechBonusData[] {
    const name = tech.getName();
    const buildings = Building.getAllBuildings().filter(
      (building) => building.getRequiredTech() === name && Building.isAvailableToCiv(building, civName)
    );
    const toBonus = (building: Building, kind: TechBonusKind): TechBonusData => ({
      name: building.getName(),
      asset_name: building.getAssetName(),
      kind,
      building: building.toJSON()
    });

    return [
      ...Unit.getAllUnitData()
        .filter((unit) => unit.required_tech === name && Unit.isAvailableToCiv(unit, civName))
        .map((unit) => TechBonuses.ofUnit(unit)),
      ...buildings.filter((building) => !building.isWonderBuilding()).map((building) => toBonus(building, "building")),
      ...buildings.filter((building) => building.isWonderBuilding()).map((building) => toBonus(building, "wonder")),
      ...Improvement.getAllImprovementData()
        .filter((improvement) => improvement.required_tech === name && !improvement.removes_feature)
        .map((improvement) => TechBonuses.ofImprovement(improvement)),
      ...tech.getNoteData().map((note): TechBonusData => ({ name: note.text, asset_name: note.icon, kind: "note" }))
    ];
  }

  private static ofUnit(unit: UnitYMLTypeData): TechBonusData {
    const lines: string[] = [];
    if (unit.combat_strength) lines.push(`Strength: ${unit.combat_strength} !{combat}`);
    else lines.push("Civilian: can't attack or defend");
    if (unit.ranged_strength) lines.push(`Ranged: ${unit.ranged_strength} !{target}  Range: ${unit.range ?? 1}`);
    lines.push(`Movement: ${unit.default_move_distance ?? TechBonuses.DEFAULT_MOVEMENT} !{move}`);
    if (unit.sight_range) lines.push(`Sight: ${unit.sight_range}`);
    if (unit.cost) lines.push(`Cost: ${unit.cost} !{production}`);
    if (unit.domain === "sea") lines.push(unit.coast_only ? "Ship: stays off deep ocean" : "Ship");
    if (unit.ignores_terrain_cost) lines.push("Ignores terrain movement costs");
    if (unit.free_promotions?.length) lines.push(`Starts with ${unit.free_promotions.join(", ")}`);
    if (unit.replaces) lines.push(`Replaces the ${unit.replaces}`);
    if (unit.upgrades_to) lines.push(`Upgrades to the ${unit.upgrades_to}`);

    return { name: unit.name, asset_name: Unit.getAssetName(unit.name), kind: "unit", lines };
  }

  private static ofImprovement(improvement: ImprovementData): TechBonusData {
    const lines: string[] = [];
    const builder = improvement.domain === "sea" ? "a Work Boat" : "a Builder";
    if (improvement.consumes_unit) lines.push(`Built by ${builder}, using it up`);
    else if (improvement.build_turns) lines.push(`Built by ${builder} in ${improvement.build_turns} turns`);
    if (improvement.route) lines.push("Speeds up movement");

    const resources = Object.keys(improvement.resources ?? {}).map(TechBonuses.toTitle);
    if (resources.length > 0) lines.push(`Improves ${resources.join(", ")}`);

    const stats: StatEntry[] = improvement.tile_type
      ? (Tile.getAllTileStats()[improvement.tile_type.toUpperCase()]?.stats ?? [])
      : [];

    return { name: improvement.name, asset_name: improvement.asset_name, kind: "improvement", stats, lines };
  }

  // "ivory" -> "Ivory".
  private static toTitle(id: string): string {
    return id
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
}
