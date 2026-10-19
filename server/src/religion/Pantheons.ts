import { Game } from "../Game";
import type { Player } from "../Player";
import { ConfigLoader } from "../util/ConfigLoader";
import type { BeliefData } from "./Beliefs";

export type PantheonData = BeliefData;

/**
 * Civ 5's pantheons, from config/pantheons.yml, and what founding one costs. A founded pantheon's
 * effects are applied by Beliefs; PlayerReligion founds it.
 */
export class Pantheons {
  // Brave New World's standard-speed costs: 10 Faith for the world's first pantheon, 5 more for each after.
  public static readonly FIRST_PANTHEON_COST = 10;
  public static readonly COST_PER_FOUNDED = 5;

  public static getAll(): PantheonData[] {
    return ConfigLoader.load<{ pantheons: PantheonData[] }>("./config/pantheons.yml").pantheons;
  }

  public static getByName(name: string): PantheonData | undefined {
    return Pantheons.getAll().find((pantheon) => pantheon.name === name);
  }

  // Which player founded each pantheon so far, by pantheon name.
  public static getFounders(): Map<string, Player> {
    const founders = new Map<string, Player>();
    Game.getInstance()
      .getPlayers()
      .forEach((player) => {
        const pantheon = player.getReligion().getPantheonName();
        if (pantheon) founders.set(pantheon, player);
      });
    return founders;
  }

  // The faith the next pantheon founded anywhere in the world costs.
  public static getCost(): number {
    return Pantheons.FIRST_PANTHEON_COST + Pantheons.COST_PER_FOUNDED * Pantheons.getFounders().size;
  }

  public static getAvailable(): PantheonData[] {
    const founders = Pantheons.getFounders();
    return Pantheons.getAll().filter((pantheon) => !founders.has(pantheon.name));
  }
}
