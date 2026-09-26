/**
 * Civ 5's city combat numbers (Gods & Kings / Brave New World rules). A city defends with its own
 * combat strength and hit points, heals every turn, and can shoot once a turn at an enemy nearby.
 * See City for how they're applied, and Unit.meleeAttack() for how a city is captured.
 */
export class CityCombat {
  // Every city starts with 200 HP. Buildings like Walls add to it (`city_health` in buildings.yml).
  public static readonly BASE_MAX_HEALTH = 200;
  // Health a damaged city regains at the start of every turn.
  public static readonly HEAL_PER_TURN = 20;

  // Strength = BASE + PER_POPULATION per citizen + the city's `defense` stat from buildings (Palace,
  // Walls) + a share of its garrison's strength, then +25% on a hill.
  public static readonly BASE_STRENGTH = 8;
  public static readonly STRENGTH_PER_POPULATION = 0.4;
  public static readonly GARRISON_STRENGTH_SHARE = 0.2;
  public static readonly HILL_STRENGTH_BONUS = 0.25;

  // How far a city can shoot. Cities fire indirectly, so hills and woods in between don't block it.
  public static readonly STRIKE_RANGE = 2;

  // A captured city loses this share of its citizens, keeping at least one.
  public static readonly CAPTURE_POPULATION_LOSS = 0.5;
}
