import { Building } from "../city/Building";
import { Improvement } from "../map/Improvement";
import type { StatEntry } from "../map/Tile";
import { Unit } from "../unit/Unit";
import { ConfigLoader } from "../util/ConfigLoader";
import { TechBonuses } from "./TechBonuses";

// A row range labeled for the research tree's visual section dividers/labels
// (e.g. "Ancient Era" spanning rows 0-1) - hand-placed in techs.yml, same as
// each tech's own row/slot.
export interface EraData {
  name: string;
  id: string;
  rows: number[];
}

// A lasting yield bonus a tech gives some of its owner's tiles, e.g. Civil Service's +1 Food on Farms
// next to fresh water.
export interface TileBonusData {
  // The tile type that gets the bonus, e.g. "farm".
  tile_type: string;
  // true: only tiles on a river or next to a lake. false: only tiles that aren't.
  fresh_water?: boolean;
  stats: StatEntry[];
}

export interface TechnologyData {
  name: string;
  asset_name: string;
  cost: number;
  prerequisites: string[];
  description: string;
  // The Civ5 wiki's "Notes" bullets, shown in the tech detail window.
  notes?: TechNoteData[];
  tile_bonuses?: TileBonusData[];
  // Trade route slots the tech adds (Brave New World's), listed among its notes.
  trade_routes?: number;
  // Horizontal position (0-9) within its row in the research tree, matching
  // Civ5's tech-web layout - a fixed 10-slot grid per row, some slots deliberately
  // left empty, rather than techs packed tightly together.
  slot: number;
  // Which row (0 = bottom) the tech sits in. Hand-authored like slot, not derived
  // from prerequisite depth - Civ5's actual layout doesn't pack every tech into
  // the shallowest row its prerequisites allow, so two techs can be equally deep
  // in the prerequisite graph and still sit in different rows.
  row: number;
}

// A note's icon stands for it among the tech's bonus icons in the research tree (see TechBonuses).
export interface TechNoteData {
  text: string;
  icon: string;
}

export interface UnlockData {
  name: string;
  asset_name?: string;
}

// What researching a tech makes available, gathered from every config that names
// the tech as its required_tech - so the tech detail window can't drift from what
// the production queue actually allows.
export interface TechnologyUnlocks {
  units: UnlockData[];
  buildings: UnlockData[];
  wonders: UnlockData[];
  improvements: UnlockData[];
}

export class Technology {
  private name: string;
  private assetName: string;
  private cost: number;
  private prerequisites: string[];
  private description: string;
  private notes: TechNoteData[];
  private tradeRoutes: number;
  private slot: number;
  private row: number;

  constructor(data: TechnologyData) {
    this.name = data.name;
    this.assetName = data.asset_name;
    this.cost = data.cost;
    this.prerequisites = data.prerequisites ?? [];
    this.description = data.description;
    this.notes = [...(data.notes ?? []), ...Technology.getTradeRouteNotes(data)];
    this.tradeRoutes = data.trade_routes ?? 0;
    this.slot = data.slot;
    this.row = data.row;
  }

  public static createFromName(name: string): Technology | undefined {
    const data = Technology.getTechnologyDataByName(name);
    return data ? new Technology(data) : undefined;
  }

  public static getAllTechnologies(): Technology[] {
    return Technology.loadTechnologyData().map((data) => new Technology(data));
  }

  // Every tile bonus in the tree, with the tech that grants it.
  public static getAllTileBonuses(): { techName: string; bonus: TileBonusData }[] {
    return Technology.loadTechnologyData().flatMap((tech) =>
      (tech.tile_bonuses ?? []).map((bonus) => ({ techName: tech.name, bonus }))
    );
  }

  public static getAllEras(): EraData[] {
    return ConfigLoader.load<{ eras: EraData[] }>("./config/techs.yml").eras;
  }

  /**
   * The era a player with these techs is in: the latest one any of them belongs to, as in Civ 5.
   * The first era until anything is researched.
   */
  public static getEraOf(techNames: Iterable<string>): EraData {
    const eras = Technology.getAllEras();
    const researched = new Set(techNames);
    const rows = new Set(
      Technology.getAllTechnologies()
        .filter((tech) => researched.has(tech.getName()))
        .map((tech) => tech.getRow())
    );
    const reached = eras.filter((era) => era.rows.some((row) => rows.has(row)));
    return reached[reached.length - 1] ?? eras[0];
  }

  // civName leaves out what that civ can't build (other civs' unique units and buildings, and the ones its
  // own uniques replace).
  public static getUnlocks(techName: string, civName?: string): TechnologyUnlocks {
    const buildings = Building.getAllBuildings().filter(
      (building) => building.getRequiredTech() === techName && Building.isAvailableToCiv(building, civName)
    );
    const toUnlock = (building: Building): UnlockData => ({
      name: building.getName(),
      asset_name: building.getAssetName()
    });

    return {
      units: Unit.getAllUnitData()
        .filter((unit) => unit.required_tech === techName && Unit.isAvailableToCiv(unit, civName))
        .map((unit) => ({ name: unit.name, asset_name: Unit.getAssetName(unit.name) })),
      buildings: buildings.filter((building) => !building.isWonderBuilding()).map(toUnlock),
      wonders: buildings.filter((building) => building.isWonderBuilding()).map(toUnlock),
      improvements: Improvement.getAllImprovementData()
        .filter((improvement) => improvement.required_tech === techName && !improvement.removes_feature)
        .map((improvement) => ({ name: improvement.name, asset_name: improvement.asset_name }))
    };
  }

  // The note for each trade route slot the tech adds.
  private static getTradeRouteNotes(data: TechnologyData): TechNoteData[] {
    return Array.from({ length: data.trade_routes ?? 0 }, () => ({
      text: "Allows an additional trade route",
      icon: "ICON_TRADE"
    }));
  }

  private static loadTechnologyData(): TechnologyData[] {
    return ConfigLoader.load<{ technologies: TechnologyData[] }>("./config/techs.yml").technologies;
  }

  private static getTechnologyDataByName(name: string): TechnologyData | undefined {
    return Technology.loadTechnologyData().find((tech) => tech.name.toLocaleLowerCase() === name.toLocaleLowerCase());
  }

  public getName() {
    return this.name;
  }

  public getAssetName() {
    return this.assetName;
  }

  public getCost() {
    return this.cost;
  }

  public getPrerequisites() {
    return this.prerequisites;
  }

  public getDescription() {
    return this.description;
  }

  public getNotes(): string[] {
    return this.notes.map((note) => note.text);
  }

  public getNoteData(): TechNoteData[] {
    return this.notes;
  }

  public getTradeRoutes(): number {
    return this.tradeRoutes;
  }

  public getSlot() {
    return this.slot;
  }

  public getRow() {
    return this.row;
  }

  public toJSON(civName?: string) {
    return {
      name: this.name,
      asset_name: this.assetName,
      cost: this.cost,
      prerequisites: this.prerequisites,
      description: this.description,
      notes: this.getNotes(),
      unlocks: Technology.getUnlocks(this.name, civName),
      bonuses: TechBonuses.of(this, civName),
      slot: this.slot,
      row: this.row
    };
  }
}
