import { Game } from "../Game";
import { InGameScene } from "../scene/type/InGameScene";
import { AbstractPlayer } from "./AbstractPlayer";

// Mirrors server/src/diplomacy/PlayerDiplomacy.ts's RelationJSON - keep both in sync. One per
// civilization this player has met.
export interface Relation {
  name: string;
  civName: string;
  iconName: string;
  atWar: boolean;
  // Turns until peace can be offered, while at war. 0 once it can.
  turnsUntilPeace: number;
  // Turns left on the peace treaty, during which neither side may declare war. 0 once it's over.
  treatyTurnsLeft: number;
  peaceOfferedToUs: boolean;
  peaceOfferedByUs: boolean;
}

export class Diplomacy {
  /**
   * Mirrors server/src/diplomacy/PlayerDiplomacy.ts's areAtWar() - keep both in sync. The server
   * only tells this client about its own player's relations, so two other civilizations never
   * count as at war here; that's fine, since the client only works out moves for its own units.
   */
  public static areAtWar(a: AbstractPlayer, b: AbstractPlayer): boolean {
    if (a === b) return false;
    if (a.isBarbarian() || b.isBarbarian()) return true;

    const clientPlayer = Game.getInstance().getCurrentSceneAs<InGameScene>().getClientPlayer();
    if (a === clientPlayer) return clientPlayer.getRelation(b)?.atWar ?? false;
    if (b === clientPlayer) return clientPlayer.getRelation(a)?.atWar ?? false;
    return false;
  }

  // The client player has met `other` and is at peace with them - what the Declare War prompt asks about.
  public static isAtPeaceWith(other: AbstractPlayer): boolean {
    const clientPlayer = Game.getInstance().getCurrentSceneAs<InGameScene>().getClientPlayer();
    const relation = clientPlayer.getRelation(other);

    return !!relation && !relation.atWar;
  }
}
