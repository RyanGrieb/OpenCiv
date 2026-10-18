import type { Tile } from "../map/Tile";
import { ConfigLoader } from "../util/ConfigLoader";
import type { CombatModifier } from "./Combat";
import type { Unit } from "./Unit";

// What a promotion does, as promotions.yml's `effects` gives it (that file explains each one).
export interface PromotionEffects {
  open_terrain_percent?: number;
  rough_terrain_percent?: number;
  ranged_open_percent?: number;
  ranged_rough_percent?: number;
  vs_classes?: { classes: string[]; percent: number };
  vs_wounded_percent?: number;
  vs_city_percent?: number;
  vs_fortified_percent?: number;
  vs_land_percent?: number;
  vs_naval_percent?: number;
  naval_melee_percent?: number;
  attack_percent?: number;
  defense_percent?: number;
  ranged_defense_percent?: number;
  extra_attacks?: number;
  movement?: number;
  sight?: number;
  range?: number;
  heal_every_turn?: boolean;
  heal_adjacent?: number;
  heal_outside_friendly?: number;
  woodsman?: boolean;
  amphibious?: boolean;
  indirect_fire?: boolean;
  withdraw?: boolean;
  heal_instantly?: number;
}

export interface PromotionData {
  name: string;
  display_name?: string;
  // Unit classes (units.yml's unit_class) that can take it. "any" is every unit that fights.
  classes: string[];
  // The unit needs one of these first. requires_by_class swaps the list for the classes it names.
  requires?: string[];
  requires_by_class?: Record<string, string[]>;
  description: string;
  effects?: PromotionEffects;
  not_yet?: string[];
}

type NumberEffect = {
  [Key in keyof PromotionEffects]-?: PromotionEffects[Key] extends number | undefined ? Key : never;
}[keyof PromotionEffects];
type FlagEffect = {
  [Key in keyof PromotionEffects]-?: PromotionEffects[Key] extends boolean | undefined ? Key : never;
}[keyof PromotionEffects];

// The fight a combat modifier is asked about, from this unit's side.
export interface CombatSituation {
  attacking: boolean;
  // Whether the attack is a ranged one (a unit's shot or a city's strike), whichever side this unit is on.
  ranged: boolean;
  // The tile fought over: the defender's.
  tile: Tile;
  // The unit on the other side. Absent when that side is a city.
  opponent?: Unit;
}

/**
 * A unit's experience, level and promotions, following Civ 5. Experience comes from fighting (see the
 * *_XP constants) and from buildings like the Barracks. Each level reached lets the unit pick one
 * promotion its class can take; the levels need 10, 30, 60, 100... experience in total.
 */
export class UnitPromotions {
  // Civ 5's EXPERIENCE_PER_LEVEL: the first level costs this much, the next twice more, and so on.
  public static readonly EXPERIENCE_PER_LEVEL = 10;
  // Civ 5's EXPERIENCE_ATTACKING_UNIT_MELEE and friends. Attacking a city earns the same as a unit.
  public static readonly MELEE_ATTACK_XP = 5;
  public static readonly MELEE_DEFENSE_XP = 4;
  public static readonly RANGED_ATTACK_XP = 2;
  public static readonly RANGED_DEFENSE_XP = 2;
  // Civ 5's BARBARIAN_MAX_XP_VALUE: fighting barbarians stops teaching a unit anything past this.
  public static readonly BARBARIAN_XP_CAP = 30;
  public static readonly HEAL_INSTANTLY = "Heal Instantly";

  private unitClass: string | undefined;
  private experience = 0;
  // Starts at 1, and goes up by one with every promotion picked.
  private level = 1;
  private promotions: string[] = [];

  constructor(unitClass: string | undefined) {
    this.unitClass = unitClass;
  }

  public static getAllPromotionData(): PromotionData[] {
    return ConfigLoader.load<{ promotions: PromotionData[] }>("./config/promotions.yml").promotions;
  }

  public static getPromotionData(name: string): PromotionData | undefined {
    return UnitPromotions.getAllPromotionData().find((promotion) => promotion.name === name);
  }

  // Total experience needed to reach the level after `level`: 10, 30, 60, 100, 150...
  public static getExperienceNeeded(level: number): number {
    return ((level * (level + 1)) / 2) * UnitPromotions.EXPERIENCE_PER_LEVEL;
  }

  // "Shock I" -> PROMOTION_SHOCK_I, "Range (Air)" -> PROMOTION_RANGE_AIR.
  public static getIcon(name: string): string {
    return `PROMOTION_${name.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/_$/, "")}`;
  }

  // What the client shows for a promotion: its icon, and its name and description for the tooltip.
  public static toJSON(promotion: PromotionData) {
    return {
      name: promotion.name,
      displayName: promotion.display_name ?? promotion.name,
      icon: UnitPromotions.getIcon(promotion.name),
      description: promotion.description,
      notYet: promotion.not_yet ?? []
    };
  }

  // Hills, forest and jungle: Civ 5's rough terrain. Everything else is open.
  public static isRoughTerrain(tile: Tile): boolean {
    return tile.getTileTypes().some((type) => ["hill", "forest", "jungle"].some((rough) => type.includes(rough)));
  }

  public getExperience() {
    return this.experience;
  }

  public getLevel() {
    return this.level;
  }

  public getExperienceNeeded() {
    return UnitPromotions.getExperienceNeeded(this.level);
  }

  public getPromotions(): string[] {
    return this.promotions;
  }

  public has(name: string): boolean {
    return this.promotions.includes(name);
  }

  public canPromote(): boolean {
    return this.experience >= this.getExperienceNeeded();
  }

  /**
   * Adds experience, holding back what a barbarian fight would carry past BARBARIAN_XP_CAP.
   * @returns Whether this is what made a promotion available.
   */
  public addExperience(amount: number, options?: { fromBarbarian?: boolean }): boolean {
    const allowed = options?.fromBarbarian
      ? Math.min(amount, Math.max(0, UnitPromotions.BARBARIAN_XP_CAP - this.experience))
      : amount;
    if (allowed <= 0) return false;

    const couldPromote = this.canPromote();
    this.experience += allowed;
    return !couldPromote && this.canPromote();
  }

  // The promotions the unit could pick right now. Heal Instantly is only offered to a wounded unit.
  public getChoices(options: { wounded: boolean }): PromotionData[] {
    if (!this.canPromote()) return [];

    return UnitPromotions.getAllPromotionData().filter((promotion) => {
      if (promotion.effects?.heal_instantly && !options.wounded) return false;
      return this.canTake(promotion);
    });
  }

  /**
   * Spends the level the unit has earned on a promotion it can pick. Heal Instantly is spent without
   * being kept - the caller does the healing.
   */
  public choose(name: string, options: { wounded: boolean }): PromotionData | undefined {
    const promotion = this.getChoices(options).find((choice) => choice.name === name);
    if (!promotion) return undefined;

    this.level += 1;
    if (!promotion.effects?.heal_instantly) this.promotions.push(promotion.name);
    return promotion;
  }

  // The same experience, level and promotions on a unit of another class, for a unit that's been upgraded.
  public carryOverTo(unitClass: string | undefined): UnitPromotions {
    const carried = new UnitPromotions(unitClass);
    carried.experience = this.experience;
    carried.level = this.level;
    carried.promotions = [...this.promotions];
    return carried;
  }

  // A promotion given rather than earned (a Lancer's Formation I, the Alhambra's Drill I): no level is spent.
  public grant(name: string) {
    if (this.has(name) || !UnitPromotions.getPromotionData(name)) return;

    this.promotions.push(name);
  }

  public sum(effect: NumberEffect): number {
    return this.getEffects().reduce((total, effects) => total + (effects[effect] ?? 0), 0);
  }

  public hasEffect(effect: FlagEffect): boolean {
    return this.getEffects().some((effects) => effects[effect]);
  }

  /** Each promotion that helps in this fight, as an attack screen line named after it. */
  public getCombatModifiers(situation: CombatSituation): CombatModifier[] {
    return this.promotions
      .map((name) => UnitPromotions.getPromotionData(name))
      .filter((promotion) => promotion?.effects)
      .map((promotion) => ({
        label: promotion.display_name ?? promotion.name,
        value: UnitPromotions.getCombatPercent(promotion.effects, situation) / 100
      }))
      .filter((modifier) => modifier.value !== 0);
  }

  public toJSON(options: { wounded: boolean; owner: boolean }) {
    return {
      experience: this.experience,
      level: this.level,
      experienceNeeded: this.getExperienceNeeded(),
      promotions: this.promotions
        .map((name) => UnitPromotions.getPromotionData(name))
        .filter((promotion) => promotion)
        .map(UnitPromotions.toJSON),
      // Which promotions are on offer is only the owner's business.
      promotionChoices: options.owner ? this.getChoices(options).map(UnitPromotions.toJSON) : []
    };
  }

  // The percentage one promotion's effects add to this fight.
  private static getCombatPercent(effects: PromotionEffects, situation: CombatSituation): number {
    const rough = UnitPromotions.isRoughTerrain(situation.tile);
    const opponent = situation.opponent;
    let percent = rough ? (effects.rough_terrain_percent ?? 0) : (effects.open_terrain_percent ?? 0);

    if (effects.vs_classes && opponent && effects.vs_classes.classes.includes(opponent.getUnitClass())) {
      percent += effects.vs_classes.percent;
    }
    if (!situation.attacking) {
      percent += effects.defense_percent ?? 0;
      if (situation.ranged) percent += effects.ranged_defense_percent ?? 0;
      return percent;
    }

    percent += effects.attack_percent ?? 0;
    if (situation.ranged) {
      percent += rough ? (effects.ranged_rough_percent ?? 0) : (effects.ranged_open_percent ?? 0);
    }
    if (!opponent) return percent + (effects.vs_city_percent ?? 0);

    if (opponent.isWounded()) percent += effects.vs_wounded_percent ?? 0;
    if (opponent.isFortified()) percent += effects.vs_fortified_percent ?? 0;
    if (opponent.getDomain() === "land") percent += effects.vs_land_percent ?? 0;
    if (opponent.getDomain() === "sea") {
      percent += effects.vs_naval_percent ?? 0;
      if (!situation.ranged) percent += effects.naval_melee_percent ?? 0;
    }
    return percent;
  }

  private getEffects(): PromotionEffects[] {
    return this.promotions.map((name) => UnitPromotions.getPromotionData(name)?.effects ?? {});
  }

  private canTake(promotion: PromotionData): boolean {
    if (this.has(promotion.name)) return false;
    if (!promotion.classes.includes("any") && !promotion.classes.includes(this.unitClass)) return false;

    const requires = promotion.requires_by_class?.[this.unitClass] ?? promotion.requires ?? [];
    return requires.length === 0 || requires.some((name) => this.has(name));
  }
}
