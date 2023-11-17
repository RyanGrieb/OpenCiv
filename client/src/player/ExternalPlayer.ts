import { AbstractPlayer } from "./AbstractPlayer";

export class ExternalPlayer extends AbstractPlayer {
  constructor(playerJSON: JSON) {
    super(playerJSON);
  }
}
