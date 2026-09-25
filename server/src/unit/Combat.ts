import random from "random";
import { Tile } from "../map/Tile";

export interface CombatResult {
  attackerHealth: number;
  defenderHealth: number;
}

export interface CombatModifier {
  label: string;
  // A fraction: 0.25 is +25%, -0.2 is -20%.
  value: number;
}

export interface CombatPrediction {
  attackerStrength: number;
  defenderStrength: number;
  attackerModifiers: CombatModifier[];
  defenderModifiers: CombatModifier[];
  // Damage each side takes, for the worst, average and best roll.
  attackerDamage: { min: number; expected: number; max: number };
  defenderDamage: { min: number; expected: number; max: number };
  outcome: string;
}

/**
 * Civ 5's combat math, kept free of any Unit/network state so it can be tested on its own. See
 * Unit.meleeAttack() for how a fight is actually carried out.
 */
export class Combat {
  public static readonly MAX_HEALTH = 100;

  // Two units of equal strength at full health deal 24-36 damage to each other
  // (Civ 5's ATTACK_SAME_STRENGTH_MIN_DAMAGE / ATTACK_SAME_STRENGTH_POSSIBLE_EXTRA_DAMAGE).
  public static readonly SAME_STRENGTH_MIN_DAMAGE = 24;
  public static readonly SAME_STRENGTH_EXTRA_DAMAGE = 12;

  // How much a wounded unit's missing health cuts the damage it deals, as a fraction of that
  // missing health (Civ 5's WOUNDED_DAMAGE_MULTIPLIER). A unit at 40 HP hits for 70% as hard.
  public static readonly WOUNDED_DAMAGE_MULTIPLIER = 0.5;

  // Terrain the defender stands on. Civ 5 stacks these, so a forested hill is +50%.
  public static readonly HILL_DEFENSE_BONUS = 0.25;
  public static readonly COVER_DEFENSE_BONUS = 0.25; // Forest or jungle
  // Attacking across a river, from the attacker's side.
  public static readonly RIVER_CROSSING_ATTACK_PENALTY = 0.2;

  // Health regained at the start of a turn by a unit that neither moved nor fought the turn before.
  public static readonly HEAL_IN_FRIENDLY_TERRITORY = 20;
  public static readonly HEAL_ELSEWHERE = 10;

  /**
   * The defender's bonus from the tile it stands on, as a fraction (0.25 = +25%). Same substring
   * convention as Tile.getMovementCost(), since tile types are biome-prefixed (e.g. "grass_hill").
   */
  public static getTerrainDefenseModifier(tile: Tile): number {
    return Combat.sumModifiers(Combat.getDefenseModifiers(tile));
  }

  public static getDefenseModifiers(tile: Tile): CombatModifier[] {
    const tileTypes = tile.getTileTypes();
    const modifiers: CombatModifier[] = [];

    if (tileTypes.some((type) => type.includes("hill"))) {
      modifiers.push({ label: "Hill", value: Combat.HILL_DEFENSE_BONUS });
    }
    if (tileTypes.some((type) => type.includes("forest"))) {
      modifiers.push({ label: "Forest", value: Combat.COVER_DEFENSE_BONUS });
    } else if (tileTypes.some((type) => type.includes("jungle"))) {
      modifiers.push({ label: "Jungle", value: Combat.COVER_DEFENSE_BONUS });
    }

    return modifiers;
  }

  public static getAttackModifiers(fromTile: Tile, targetTile: Tile): CombatModifier[] {
    if (!Tile.riverCrosses(fromTile, targetTile)) return [];

    return [{ label: "Across river", value: -Combat.RIVER_CROSSING_ATTACK_PENALTY }];
  }

  public static getAttackStrength(baseStrength: number, fromTile: Tile, targetTile: Tile): number {
    return baseStrength * (1 + Combat.sumModifiers(Combat.getAttackModifiers(fromTile, targetTile)));
  }

  public static getDefenseStrength(baseStrength: number, tile: Tile): number {
    return baseStrength * (1 + Combat.getTerrainDefenseModifier(tile));
  }

  /**
   * What the attack screen shows before a melee attack: both strengths with what went into them, the
   * damage range each side can take, and a Civ 5 style verdict from the average roll.
   */
  public static predictMelee(options: {
    attackerBaseStrength: number;
    attackerHealth: number;
    defenderBaseStrength: number;
    defenderHealth: number;
    fromTile: Tile;
    targetTile: Tile;
  }): CombatPrediction {
    const attackerModifiers = Combat.getAttackModifiers(options.fromTile, options.targetTile);
    const defenderModifiers = Combat.getDefenseModifiers(options.targetTile);
    const attackerStrength = options.attackerBaseStrength * (1 + Combat.sumModifiers(attackerModifiers));
    const defenderStrength = options.defenderBaseStrength * (1 + Combat.sumModifiers(defenderModifiers));

    const damageTo = (side: "attacker" | "defender", roll: number) =>
      side === "defender"
        ? Combat.getDamage({
            strength: attackerStrength,
            opponentStrength: defenderStrength,
            health: options.attackerHealth,
            roll
          })
        : Combat.getDamage({
            strength: defenderStrength,
            opponentStrength: attackerStrength,
            health: options.defenderHealth,
            roll
          });

    const averageDealt = damageTo("defender", 0.5);
    const averageTaken = damageTo("attacker", 0.5);

    let outcome: string;
    if (averageDealt >= options.defenderHealth) outcome = "Decisive Victory";
    else if (averageTaken >= options.attackerHealth) outcome = "Decisive Defeat";
    else if (averageDealt >= averageTaken * 1.5) outcome = "Major Victory";
    else if (averageTaken >= averageDealt * 1.5) outcome = "Major Defeat";
    else if (averageDealt > averageTaken) outcome = "Minor Victory";
    else if (averageTaken > averageDealt) outcome = "Minor Defeat";
    else outcome = "Stalemate";

    return {
      attackerStrength,
      defenderStrength,
      attackerModifiers,
      defenderModifiers,
      attackerDamage: { min: damageTo("attacker", 0), expected: averageTaken, max: damageTo("attacker", 1) },
      defenderDamage: { min: damageTo("defender", 0), expected: averageDealt, max: damageTo("defender", 1) },
      outcome
    };
  }

  /**
   * Damage one side deals to the other in a single exchange, following Civ 5's
   * CvUnit::getCombatDamage(). `roll` is in [0, 1] and picks where in the random spread this hit
   * lands; it defaults to a fresh random roll.
   */
  public static getDamage(options: {
    strength: number;
    opponentStrength: number;
    health: number;
    roll?: number;
  }): number {
    const { strength, opponentStrength, health } = options;
    const roll = options.roll ?? random.float(0, 1);

    const missingHealth = Combat.MAX_HEALTH - health;
    const woundedScale = (Combat.MAX_HEALTH - missingHealth * Combat.WOUNDED_DAMAGE_MULTIPLIER) / Combat.MAX_HEALTH;
    const baseDamage = (Combat.SAME_STRENGTH_MIN_DAMAGE + Combat.SAME_STRENGTH_EXTRA_DAMAGE * roll) * woundedScale;

    // RATIO = ((((stronger / weaker) + 3) / 4) ^ 4 + 1) / 2, inverted when we're the weaker side.
    // This damps the swing between closely matched units and snowballs lopsided ones.
    const stronger = Math.max(strength, opponentStrength);
    const weaker = Math.min(strength, opponentStrength);
    let ratio = ((stronger / weaker + 3) / 4) ** 4;
    ratio = (ratio + 1) / 2;
    if (opponentStrength > strength) ratio = 1 / ratio;

    return Math.max(1, Math.floor(baseDamage * ratio));
  }

  /**
   * Both sides of a melee exchange at once. Rolls are optional so tests can pin them.
   */
  public static resolveMelee(options: {
    attackerStrength: number;
    attackerHealth: number;
    defenderStrength: number;
    defenderHealth: number;
    attackerRoll?: number;
    defenderRoll?: number;
  }): CombatResult {
    const damageToDefender = Combat.getDamage({
      strength: options.attackerStrength,
      opponentStrength: options.defenderStrength,
      health: options.attackerHealth,
      roll: options.attackerRoll
    });
    const damageToAttacker = Combat.getDamage({
      strength: options.defenderStrength,
      opponentStrength: options.attackerStrength,
      health: options.defenderHealth,
      roll: options.defenderRoll
    });

    const defenderHealth = Math.max(0, options.defenderHealth - damageToDefender);
    let attackerHealth = Math.max(0, options.attackerHealth - damageToAttacker);

    // Civ 5 never lets both units die: when the defender falls, the attacker hangs on with 1 HP.
    if (defenderHealth === 0 && attackerHealth === 0) attackerHealth = 1;

    return { attackerHealth, defenderHealth };
  }

  private static sumModifiers(modifiers: CombatModifier[]): number {
    return modifiers.reduce((total, modifier) => total + modifier.value, 0);
  }
}
