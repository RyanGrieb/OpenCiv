import { SpriteRegion } from "../Assets";
import { Strings } from "../util/Strings";

// Mirrors the parts of server/src/religion/Beliefs.ts's BeliefData the client shows - keep both in sync.
// A pantheon, or a religion's founder or follower belief.
export interface BeliefData {
  name: string;
  yields?: Record<string, number>;
  text: string;
  description: string;
  not_yet?: string[];
}

// A religion someone founded (see server PlayerReligion's FoundedReligion).
export interface FoundedReligion {
  name: string;
  founderBelief: string;
  followerBelief: string;
  holyCity: string;
  // Once a later Great Prophet enhances it.
  followerBelief2?: string;
  enhancerBelief?: string;
}

// The server's "religions" event: what's left to found or enhance a religion with, and whether the
// Great Prophet the window was opened from can found or enhance one where it stands.
export interface ReligionsEvent {
  faith: number;
  religion: FoundedReligion | null;
  canFound: boolean;
  canEnhance: boolean;
  hasPantheon: boolean;
  religions: string[];
  founderBeliefs: BeliefData[];
  followerBeliefs: BeliefData[];
  enhancerBeliefs: BeliefData[];
}

// What the religion window shows of a pantheon or belief.
export interface BeliefSummary {
  name: string;
  description: string;
  not_yet: string[];
}

// The server's "religionOverview" event, for the religion window (see server PlayerReligion.sendOverview()).
export interface ReligionOverview {
  pantheon: BeliefSummary | null;
  religion: { name: string; holyCity: string } | null;
  founderBelief: BeliefSummary | null;
  followerBelief: BeliefSummary | null;
  // Once enhanced.
  followerBelief2: BeliefSummary | null;
  enhancerBelief: BeliefSummary | null;
  faith: number;
  pantheonCost: number;
  canFoundPantheon: boolean;
  // The faith the next Great Prophet is born at, and whether one is waiting to found the religion.
  prophetCost: number;
  hasProphet: boolean;
  // The percent chance of one being born this turn (see server PlayerReligion.getProphetChance()).
  prophetChance: number;
  // The player's cities, with what each gets from the pantheon or religion each turn, then other
  // civilizations' cities following the religion (civilization set, no bonuses).
  cities: {
    name: string;
    civilization: string | null;
    followers: number;
    population: number;
    bonuses: Record<string, number>;
  }[];
  // What the empire gets besides (Church Property's gold, Ceremonial Burial's happiness).
  empire: Record<string, number>;
  totals: Record<string, number>;
}

// Who follows what in a city (see server CityReligion.toJSON()), in city JSON and "cityReligions".
export interface CityReligionInfo {
  followers: Record<string, number>;
  nonFollowers: number;
  // The religion the city follows, or null when no religion has enough followers.
  majority: string | null;
}

// The server's "cityReligions" event, sent each turn once religions have spread.
export interface CityReligionsEvent {
  cities: (CityReligionInfo & { cityName: string })[];
}

export class Religions {
  // ICON_RELIGION_<NAME>, e.g. ICON_RELIGION_EASTERN_ORTHODOXY.
  public static getIcon(name: string): SpriteRegion {
    return SpriteRegion[`ICON_RELIGION_${Strings.toConstantCase(name)}` as keyof typeof SpriteRegion];
  }
}
