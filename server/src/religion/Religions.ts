import { Game } from "../Game";
import type { Player } from "../Player";
import { ConfigLoader } from "../util/ConfigLoader";
import type { BeliefData } from "./Beliefs";

interface ReligionsConfig {
  religions: string[];
  founder_beliefs: BeliefData[];
  follower_beliefs: BeliefData[];
}

/**
 * Civ 5's religions and the beliefs a founder chooses for one, from config/religions.yml, and what
 * founding one costs. No two religions share a name or a belief. PlayerReligion founds them, and
 * Beliefs applies a founded religion's beliefs.
 */
export class Religions {
  // Brave New World's standard-speed Great Prophet costs, paid in faith here since there are no Great
  // Prophets yet: 200 Faith for the world's first religion, 100 more for each after.
  public static readonly FIRST_RELIGION_COST = 200;
  public static readonly COST_PER_FOUNDED = 100;

  public static getNames(): string[] {
    return Religions.getConfig().religions;
  }

  public static getFounderBeliefs(): BeliefData[] {
    return Religions.getConfig().founder_beliefs;
  }

  public static getFollowerBeliefs(): BeliefData[] {
    return Religions.getConfig().follower_beliefs;
  }

  public static getFounderBelief(name: string): BeliefData | undefined {
    return Religions.getFounderBeliefs().find((belief) => belief.name === name);
  }

  public static getFollowerBelief(name: string): BeliefData | undefined {
    return Religions.getFollowerBeliefs().find((belief) => belief.name === name);
  }

  // Every player who has founded a religion so far.
  public static getFounders(): Player[] {
    return Array.from(Game.getInstance().getPlayers().values()).filter((player) => !!player.getReligion().getFounded());
  }

  // The faith the next religion founded anywhere in the world costs.
  public static getCost(): number {
    return Religions.FIRST_RELIGION_COST + Religions.COST_PER_FOUNDED * Religions.getFounders().length;
  }

  // What's still free to found: religion names, and founder and follower beliefs no religion has taken.
  public static getAvailable() {
    const founded = Religions.getFounders().map((player) => player.getReligion().getFounded());
    const taken = new Set(
      founded.flatMap((religion) => [religion.name, religion.founderBelief, religion.followerBelief])
    );

    return {
      religions: Religions.getNames().filter((name) => !taken.has(name)),
      founderBeliefs: Religions.getFounderBeliefs().filter((belief) => !taken.has(belief.name)),
      followerBeliefs: Religions.getFollowerBeliefs().filter((belief) => !taken.has(belief.name))
    };
  }

  private static getConfig(): ReligionsConfig {
    return ConfigLoader.load<ReligionsConfig>("./config/religions.yml");
  }
}
