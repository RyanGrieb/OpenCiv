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
