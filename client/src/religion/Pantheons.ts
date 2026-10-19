// Mirrors the parts of server/src/religion/Pantheons.ts's PantheonData the client shows - keep both in sync.
export interface PantheonData {
  name: string;
  yields?: Record<string, number>;
  text: string;
  description: string;
  not_yet?: string[];
}

// The server's "pantheons" event: what's left to found and what it costs (see server PlayerReligion).
export interface PantheonsEvent {
  cost: number;
  faith: number;
  pantheon: string | null;
  canFound: boolean;
  available: PantheonData[];
}

// The server's "religionOverview" event, for the religion window (see server PlayerReligion.sendOverview()).
export interface ReligionOverview {
  pantheon: { name: string; description: string; not_yet: string[] } | null;
  faith: number;
  pantheonCost: number;
  canFoundPantheon: boolean;
  // Religions aren't in the game yet, so these are always null for now.
  founderBelief: string | null;
  followerBelief: string | null;
  // Each city following the pantheon, with what it gets from it each turn.
  cities: { name: string; bonuses: Record<string, number> }[];
  totals: Record<string, number>;
}
