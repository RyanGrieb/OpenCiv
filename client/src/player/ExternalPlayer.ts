import { AbstractPlayer, PlayerData } from "./AbstractPlayer";

export class ExternalPlayer extends AbstractPlayer {
  constructor(playerJSON: PlayerData) {
    super(playerJSON);
  }
}
