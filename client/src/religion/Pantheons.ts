import { BeliefData } from "./Religions";

export type PantheonData = BeliefData;

// The server's "pantheons" event: what's left to found and what it costs (see server PlayerReligion).
export interface PantheonsEvent {
  cost: number;
  faith: number;
  pantheon: string | null;
  canFound: boolean;
  available: PantheonData[];
}
